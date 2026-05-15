import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, CheckCircle, AlertTriangle, Zap, Eye, EyeOff, Info, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

const D = { bg:'#f7f8fa', surface:'#ffffff', surface2:'#f9fafb', border:'#e5e7eb', text:'#111827', muted:'#374151', dim:'#6b7280' }
const card = { background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }

const PROVIDERS = [
  { id:'cloudflare', name:'Cloudflare', logo:'☁️', fields:[
    { key:'zone_id', label:'Zone ID', placeholder:'Paste from Cloudflare → Overview → Zone ID', mono:true },
    { key:'api_key', label:'API Token', placeholder:'Create at dash.cloudflare.com/profile/api-tokens', mono:true, secret:true },
  ], help:'Create a token with "DNS:Edit" permission for the specific zone.' },
  { id:'godaddy', name:'GoDaddy', logo:'🐟', fields:[
    { key:'zone_id', label:'Domain', placeholder:'yourdomain.com', mono:false },
    { key:'api_key', label:'API Key', placeholder:'Paste from developer.godaddy.com', mono:true, secret:true },
    { key:'api_secret', label:'API Secret', placeholder:'Paste API secret', mono:true, secret:true },
  ], help:'Get credentials at developer.godaddy.com → API Keys.' },
  { id:'namecheap', name:'Namecheap', logo:'🔑', fields:[
    { key:'zone_id', label:'Domain', placeholder:'yourdomain.com', mono:false },
    { key:'api_key', label:'API Key', placeholder:'From Account → Profile → API Access', mono:true, secret:true },
    { key:'api_email', label:'Account Username', placeholder:'Your Namecheap username', mono:false },
  ], help:'Enable API access in your Namecheap account settings first.' },
  { id:'route53', name:'AWS Route 53', logo:'🔶', fields:[
    { key:'zone_id', label:'Hosted Zone ID', placeholder:'Z1234567890ABC', mono:true },
    { key:'api_key', label:'Access Key ID', placeholder:'AKIAIOSFODNN7EXAMPLE', mono:true, secret:false },
    { key:'api_secret', label:'Secret Access Key', placeholder:'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', mono:true, secret:true },
  ], help:'Create an IAM user with Route53FullAccess or specific zone permissions.' },
]

// Build the exact DNS record fix for each issue type
function buildFixRecord(issue, domain) {
  const d = domain?.domain_name || 'yourdomain.com'
  switch (issue.type) {
    case 'SPF':
      return { type:'TXT', name:'@', content:`v=spf1 include:_spf.google.com ~all`, ttl:300, label:'SPF record' }
    case 'DMARC':
      return { type:'TXT', name:`_dmarc.${d}`, content:`v=DMARC1; p=quarantine; rua=mailto:reports@${d}; adkim=r; aspf=r`, ttl:300, label:'DMARC record' }
    case 'CAA':
      return { type:'CAA', name:'@', content:`0 issue "letsencrypt.org"`, ttl:3600, label:'CAA record' }
    default:
      return null
  }
}

export default function DnsAutoFix({ user, domains, selectedDomain, onScanTrigger }) {
  const [credentials, setCredentials] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('cloudflare')
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(null)
  const [testResult, setTestResult] = useState({})
  const [showSecrets, setShowSecrets] = useState({})
  const [fixing, setFixing] = useState({})
  const [fixResults, setFixResults] = useState({})
  const [changeLog, setChangeLog] = useState([])
  const [activeTab, setActiveTab] = useState('credentials')
  const [label, setLabel] = useState('')

  useEffect(() => { if (user) { fetchCredentials(); fetchLog() } }, [user])

  async function fetchCredentials() {
    const { data } = await supabase.from('dns_credentials').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setCredentials(data || [])
  }

  async function fetchLog() {
    const { data } = await supabase.from('dns_change_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    setChangeLog(data || [])
  }

  async function saveCredential() {
    setSaving(true)
    const { error } = await supabase.from('dns_credentials').insert({
      user_id: user.id,
      domain_id: selectedDomain?.id || null,
      provider: selectedProvider,
      label: label || `${selectedProvider} — ${form.zone_id || 'new'}`,
      zone_id: form.zone_id || null,
      api_key: form.api_key || null,
      api_secret: form.api_secret || null,
      api_email: form.api_email || null,
    })
    if (!error) { setShowAdd(false); setForm({}); setLabel(''); fetchCredentials() }
    setSaving(false)
  }

  async function deleteCredential(id) {
    await supabase.from('dns_credentials').delete().eq('id', id)
    fetchCredentials()
  }

  async function testCredential(cred) {
    setTesting(cred.id)
    try {
      if (cred.provider === 'cloudflare') {
        const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cred.zone_id}`, {
          headers: { 'Authorization': `Bearer ${cred.api_key}` }
        })
        const data = await res.json()
        setTestResult(r => ({ ...r, [cred.id]: data.success ? { ok:true, msg:`✓ Connected to ${data.result?.name}` } : { ok:false, msg:data.errors?.[0]?.message || 'Auth failed' } }))
      } else {
        setTestResult(r => ({ ...r, [cred.id]: { ok:true, msg:'Credentials saved (test not available for this provider)' } }))
      }
    } catch (e) {
      setTestResult(r => ({ ...r, [cred.id]: { ok:false, msg:e.message } }))
    }
    setTesting(null)
  }

  async function autoFix(cred, issue) {
    const fixKey = `${cred.id}-${issue.type}`
    setFixing(f => ({ ...f, [fixKey]: true }))
    const record = buildFixRecord(issue, selectedDomain)
    if (!record) { setFixing(f => ({ ...f, [fixKey]: false })); return }

    try {
      const { data, error } = await supabase.functions.invoke('dns-autofix', {
        body: {
          credential_id: cred.id,
          domain_id: selectedDomain?.id,
          user_id: user.id,
          records: [record],
          triggered_by: 'auto_fix',
        }
      })
      setFixResults(r => ({ ...r, [fixKey]: data || { success: false, error: error?.message } }))
      fetchLog()
      if (data?.success && onScanTrigger) setTimeout(onScanTrigger, 3000)
    } catch (e) {
      setFixResults(r => ({ ...r, [fixKey]: { success: false, error: e.message } }))
    }
    setFixing(f => ({ ...f, [fixKey]: false }))
  }

  const scan = selectedDomain?.scan_results?.[0]
  const fixableIssues = (scan?.issues || []).filter(i => ['SPF','DMARC','CAA'].includes(i.type))
  const connectedCreds = credentials.filter(c => !c.domain_id || c.domain_id === selectedDomain?.id)

  return (
    <div style={{ background:'#f7f8fa', minHeight:'100%', padding:20, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom:16, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
        <div>
          <h2 style={{ fontSize:17, fontWeight:700, color:'#111827', margin:0, marginBottom:4 }}>DNS Auto-Fix</h2>
          <p style={{ fontSize:13, color:'#374151', margin:0 }}>Connect your DNS provider. One click to push any missing record directly — no copy-pasting.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ padding:'8px 16px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, color:'#92400e', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <Plus size={14}/> Connect DNS provider
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid #f0f2f5', marginBottom:16 }}>
        {['credentials','auto-fix','audit log'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:'8px 16px', background:'transparent', border:'none', borderBottom:`2px solid ${activeTab===t?'#d97706':'transparent'}`, cursor:'pointer', fontSize:12, fontWeight:activeTab===t?600:400, color:activeTab===t?'#d97706':D.muted, textTransform:'capitalize', transition:'all 0.15s', marginBottom:-1 }}>
            {t}
          </button>
        ))}
      </div>

      {/* Add credential modal */}
      {showAdd && (
        <div style={{ ...card, marginBottom:16, border:'1px solid rgba(245,158,11,0.25)' }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f2f5', background:'rgba(245,158,11,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:600, color:'#92400e' }}>Connect DNS provider</span>
            <button onClick={() => { setShowAdd(false); setForm({}) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151' }}>✕</button>
          </div>
          <div style={{ padding:16 }}>
            {/* Provider selector */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => { setSelectedProvider(p.id); setForm({}) }}
                  style={{ padding:'10px 8px', background:selectedProvider===p.id?'rgba(245,158,11,0.12)':'rgba(255,255,255,0.03)', border:`1px solid ${selectedProvider===p.id?'rgba(245,158,11,0.4)':D.border}`, borderRadius:8, cursor:'pointer', textAlign:'center' }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{p.logo}</div>
                  <div style={{ fontSize:12, fontWeight:500, color:selectedProvider===p.id?'#d97706':D.muted }}>{p.name}</div>
                </button>
              ))}
            </div>

            {/* Help text */}
            <div style={{ padding:'8px 12px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:7, fontSize:12, color:'#a5b4fc', marginBottom:14, display:'flex', gap:7 }}>
              <Info size={13} style={{ flexShrink:0, marginTop:1 }}/>
              {PROVIDERS.find(p=>p.id===selectedProvider)?.help}
            </div>

            {/* Label */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12,color:'#374151', display:'block', marginBottom:4 }}>Label (optional)</label>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder={`My ${selectedProvider} credentials`}
                style={{ width:'100%', padding:'8px 12px', background:'#f1f5f9', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, color:'#111827', outline:'none', fontFamily:'inherit' }}/>
            </div>

            {/* Dynamic fields */}
            {PROVIDERS.find(p=>p.id===selectedProvider)?.fields.map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <label style={{ fontSize:12,color:'#374151', display:'block', marginBottom:4 }}>{f.label}</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={f.secret && !showSecrets[f.key] ? 'password' : 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key] || ''}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width:'100%', padding:f.secret?'8px 36px 8px 12px':'8px 12px', background:'#f1f5f9', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, color:'#111827', outline:'none', fontFamily:f.mono?'monospace':'inherit', boxSizing:'border-box' }}/>
                  {f.secret && (
                    <button onClick={() => setShowSecrets(s => ({ ...s, [f.key]: !s[f.key] }))}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#374151' }}>
                      {showSecrets[f.key] ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <button onClick={saveCredential} disabled={saving}
                style={{ padding:'8px 20px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:7, color:'#92400e', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                {saving ? <><div style={{ width:12, height:12, border:'2px solid rgba(245,158,11,0.3)', borderTopColor:'#d97706', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Saving…</> : <><Shield size={13}/> Save credentials</>}
              </button>
              <button onClick={() => { setShowAdd(false); setForm({}) }} style={{ padding:'8px 14px', background:'transparent', border:'1px solid #e5e7eb', borderRadius:7, color:'#374151', fontSize:13, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'credentials' && (
        credentials.length === 0 ? (
          <div style={{ ...card, padding:'48px 20px', textAlign:'center' }}>
            <Shield size={44} color="#f3f4f6" style={{ marginBottom:14 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:'#374151', marginBottom:8 }}>No DNS providers connected</div>
            <div style={{ fontSize:13, color:'#374151', marginBottom:20 }}>Connect Cloudflare, GoDaddy, Route 53, or Namecheap to enable one-click DNS record fixes.</div>
            <button onClick={() => setShowAdd(true)}
              style={{ padding:'9px 20px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:8, color:'#92400e', fontSize:13, fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              <Plus size={14}/> Connect your first provider
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {credentials.map(cred => {
              const provider = PROVIDERS.find(p => p.id === cred.provider)
              const tr = testResult[cred.id]
              return (
                <div key={cred.id} style={{ ...card }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                    <span style={{ fontSize:24 }}>{provider?.logo}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{cred.label || provider?.name}</div>
                      <div style={{ fontSize:12,color:'#374151', fontFamily:'monospace' }}>{cred.zone_id}</div>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => testCredential(cred)} disabled={testing === cred.id}
                        style={{ padding:'5px 12px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:6, color:'#818cf8', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                        {testing===cred.id?<div style={{ width:10,height:10,border:'2px solid rgba(129,140,248,0.3)',borderTopColor:'#818cf8',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>:<RefreshCw size={11}/>} Test
                      </button>
                      <button onClick={() => deleteCredential(cred.id)}
                        style={{ padding:'5px 10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, color:'#dc2626', fontSize:12, cursor:'pointer' }}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  </div>
                  {tr && (
                    <div style={{ padding:'7px 16px 10px', fontSize:12, color:tr.ok?'#16a34a':'#dc2626', background:tr.ok?'rgba(16,185,129,0.05)':'rgba(239,68,68,0.05)' }}>
                      {tr.msg}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}

      {activeTab === 'auto-fix' && (
        <div>
          {!selectedDomain ? (
            <div style={{ ...card, padding:'40px', textAlign:'center', color:'#374151', fontSize:13 }}>Select a domain in the dashboard to see auto-fix options</div>
          ) : fixableIssues.length === 0 ? (
            <div style={{ ...card, padding:'40px', textAlign:'center' }}>
              <CheckCircle size={36} color="#10b981" style={{ marginBottom:12 }}/>
              <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>No auto-fixable issues for {selectedDomain.domain_name}</div>
              <div style={{ fontSize:12,color:'#374151', marginTop:6 }}>SPF, DMARC and CAA records are all present</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ padding:'10px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:8, fontSize:12, color:'rgba(245,158,11,0.9)', display:'flex', gap:8 }}>
                <AlertTriangle size={14} style={{ flexShrink:0, marginTop:1 }}/>
                DomainRadar will push these exact records to your DNS. Review each record before confirming. Changes are logged and reversible.
              </div>
              {fixableIssues.map((issue, i) => {
                const record = buildFixRecord(issue, selectedDomain)
                if (!record) return null
                return (
                  <div key={i} style={{ ...card }}>
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:22, height:22, borderRadius:6, background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <AlertTriangle size={11} color="#ef4444"/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#111827', fontFamily:'monospace' }}>{issue.type}</div>
                        <div style={{ fontSize:12,color:'#374151' }}>{issue.message}</div>
                      </div>
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'rgba(239,68,68,0.15)', color:'#dc2626' }}>{issue.severity}</span>
                    </div>
                    <div style={{ padding:'12px 16px' }}>
                      <div style={{ fontSize:12,color:'#374151', marginBottom:6 }}>Will create this record:</div>
                      <div style={{ display:'grid', gridTemplateColumns:'80px 120px 1fr', gap:8, padding:'8px 12px', background:'#f1f5f9', borderRadius:7, fontFamily:'monospace', fontSize:12, marginBottom:12 }}>
                        <span style={{ color:'#3730a3',fontWeight:700 }}>{record.type}</span>
                        <span style={{ color:'#111827',fontWeight:500 }}>{record.name}</span>
                        <span style={{ color:'#111827',wordBreak:'break-all' }}>{record.content}</span>
                      </div>
                      {connectedCreds.length === 0 ? (
                        <div style={{ fontSize:12, color:'#92400e', display:'flex', alignItems:'center', gap:6 }}>
                          <AlertTriangle size={12}/>
                          <span>Connect a DNS provider first to enable auto-fix</span>
                          <button onClick={() => { setActiveTab('credentials'); setShowAdd(true) }} style={{ background:'none', border:'none', color:'#92400e', cursor:'pointer', textDecoration:'underline', fontSize:12 }}>Go to Credentials</button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {connectedCreds.map(cred => {
                            const fixKey = `${cred.id}-${issue.type}`
                            const fr = fixResults[fixKey]
                            const provider = PROVIDERS.find(p => p.id === cred.provider)
                            return (
                              <div key={cred.id}>
                                {fr ? (
                                  <div style={{ padding:'6px 12px', borderRadius:7, background:fr.success?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${fr.success?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}`, fontSize:12, color:fr.success?'#16a34a':'#dc2626', display:'flex', alignItems:'center', gap:5 }}>
                                    {fr.success?<CheckCircle size={12}/>:<AlertTriangle size={12}/>}
                                    {fr.success?'Record created!':fr.results?.[0]?.error||'Failed'}
                                  </div>
                                ) : (
                                  <button onClick={() => autoFix(cred, issue)} disabled={fixing[fixKey]}
                                    style={{ padding:'7px 14px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:7, color:'#92400e', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                                    {fixing[fixKey]?<div style={{ width:12,height:12,border:'2px solid rgba(245,158,11,0.3)',borderTopColor:'#d97706',borderRadius:'50%',animation:'spin 0.7s linear infinite' }}/>:<Zap size={12}/>}
                                    Fix via {provider?.logo} {cred.label || provider?.name}
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit log' && (
        <div style={card}>
          <div style={{ padding:'11px 16px', borderBottom:'1px solid #f0f2f5', background:'#ffffff', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'#111827' }}>DNS change audit log</span>
            <span style={{ fontSize:12,color:'#374151' }}>{changeLog.length} entries</span>
          </div>
          {changeLog.length === 0 ? (
            <div style={{ padding:'40px', textAlign:'center', color:'#374151', fontSize:13 }}>No DNS changes made yet</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                    {['Time','Provider','Type','Name','Value','Status'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'7px 14px', fontSize:10, fontWeight:600, color:'#374151', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid #f0f2f5' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {changeLog.map((c, i) => (
                    <tr key={i} style={{ borderBottom:`1px solid #f9fafb` }}>
                      <td style={{ padding:'8px 14px', fontFamily:'monospace', color:'#374151', fontSize:11 }}>{new Date(c.created_at).toLocaleString()}</td>
                      <td style={{ padding:'8px 14px', color:'#374151' }}>{c.provider}</td>
                      <td style={{ padding:'8px 14px' }}><span style={{ fontSize:10, padding:'1px 6px', borderRadius:5, background:'rgba(96,165,250,0.15)', color:'#3730a3', fontFamily:'monospace' }}>{c.record_type}</span></td>
                      <td style={{ padding:'8px 14px', fontFamily:'monospace', color:'#374151', fontSize:11 }}>{c.record_name}</td>
                      <td style={{ padding:'8px 14px', fontFamily:'monospace', color:'#374151', fontSize:10, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.record_value}</td>
                      <td style={{ padding:'8px 14px' }}>
                        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:c.status==='success'?'rgba(16,185,129,0.15)':c.status==='failed'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)', color:c.status==='success'?'#16a34a':c.status==='failed'?'#dc2626':'#d97706' }}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
