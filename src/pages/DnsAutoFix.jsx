import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Zap, Shield, CheckCircle, AlertTriangle, Trash2, RefreshCw, Plus, Eye, EyeOff, ExternalLink, Clock, Check, X } from 'lucide-react'

const D = { bg:'#0d1117', surface:'#161b22', surface2:'#1c2333', border:'rgba(255,255,255,0.08)', text:'#e6edf3', muted:'rgba(255,255,255,0.5)', dim:'rgba(255,255,255,0.25)' }
const card = { background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, overflow:'hidden' }
const cardHd = { padding:'11px 16px', borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:D.surface2 }

const PROVIDERS = [
  { id:'cloudflare', name:'Cloudflare', logo:'🟠', fields:[{key:'api_key',label:'API Token',type:'password',help:'Create in Cloudflare Dashboard → My Profile → API Tokens → Create Token (Zone DNS Edit)'}], docsUrl:'https://dash.cloudflare.com/profile/api-tokens' },
  { id:'godaddy', name:'GoDaddy', logo:'🟢', fields:[{key:'api_key',label:'API Key',type:'password',help:'GoDaddy Developer Portal → Your API Keys'},{key:'api_secret',label:'API Secret',type:'password',help:'Shown once when you create the API key'}], docsUrl:'https://developer.godaddy.com/keys' },
  { id:'route53', name:'AWS Route 53', logo:'🟡', fields:[{key:'api_key',label:'Access Key ID',type:'text',help:'AWS IAM → Users → Security Credentials'},{key:'api_secret',label:'Secret Access Key',type:'password',help:'Shown once when key is created'}], docsUrl:'https://console.aws.amazon.com/iam' },
  { id:'namecheap', name:'Namecheap', logo:'🔴', fields:[{key:'api_email',label:'Username',type:'text',help:'Your Namecheap username'},{key:'api_key',label:'API Key',type:'password',help:'Profile → Tools → API Access'}], docsUrl:'https://www.namecheap.com/myaccount/tools/' },
]

const RECORD_TEMPLATES = {
  SPF: { type:'TXT', name:'@', ttl:300, getValues:(domain) => ([`v=spf1 include:_spf.google.com ~all`]) },
  DMARC: { type:'TXT', name:(domain) => `_dmarc.${domain}`, ttl:300, getValues:(domain) => ([`v=DMARC1; p=quarantine; rua=mailto:reports@dnsradar.easysecurity.in; adkim=r; aspf=r`]) },
  CAA: { type:'CAA', name:'@', ttl:300, getValues:() => ([`0 issue "letsencrypt.org"`, `0 issue "sectigo.com"`, `0 issuewild ";"`]) },
}

function AddCredentialModal({ domain, onClose, onSuccess }) {
  const [selectedProvider, setSelectedProvider] = useState('cloudflare')
  const [fields, setFields] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFields, setShowFields] = useState({})
  const provider = PROVIDERS.find(p => p.id === selectedProvider)

  async function save() {
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('dns_credentials').insert({
      user_id: user.id, domain_id: domain.id, provider: selectedProvider,
      label: `${provider.name} — ${domain.domain_name}`,
      ...fields,
    })
    if (err) { setError(err.message); setLoading(false); return }
    onSuccess()
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#1a2035', border:`1px solid ${D.border}`, borderRadius:16, width:'100%', maxWidth:480, margin:'0 16px', padding:24 }}>
        <div style={{ fontSize:16, fontWeight:700, color:D.text, marginBottom:4 }}>Connect DNS provider</div>
        <div style={{ fontSize:12, color:D.muted, marginBottom:16 }}>For {domain.domain_name} — credentials are stored encrypted</div>

        {/* Provider selector */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:16 }}>
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => { setSelectedProvider(p.id); setFields({}) }}
              style={{ padding:'8px 6px', border:`1px solid ${selectedProvider===p.id?'rgba(16,185,129,0.4)':D.border}`, borderRadius:8, background:selectedProvider===p.id?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.03)', cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:18, marginBottom:3 }}>{p.logo}</div>
              <div style={{ fontSize:10, color:selectedProvider===p.id?'#10b981':D.muted, fontWeight:500 }}>{p.name}</div>
            </button>
          ))}
        </div>

        {/* Fields */}
        {provider.fields.map(f => (
          <div key={f.key} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
              <label style={{ fontSize:12, color:D.muted }}>{f.label}</label>
              <a href={provider.docsUrl} target="_blank" rel="noreferrer" style={{ fontSize:10, color:'rgba(16,185,129,0.7)', textDecoration:'none', display:'flex', alignItems:'center', gap:3 }}>Get token <ExternalLink size={10}/></a>
            </div>
            <div style={{ position:'relative' }}>
              <input type={f.type === 'password' && !showFields[f.key] ? 'password' : 'text'}
                value={fields[f.key] || ''} onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.label}
                style={{ width:'100%', padding:`8px ${f.type==='password'?'36px':'12px'} 8px 12px`, background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:f.type==='password'?'monospace':'inherit', boxSizing:'border-box' }}/>
              {f.type === 'password' && (
                <button onClick={() => setShowFields(p => ({ ...p, [f.key]: !p[f.key] }))}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:D.dim }}>
                  {showFields[f.key] ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              )}
            </div>
            <div style={{ fontSize:10, color:D.dim, marginTop:3 }}>{f.help}</div>
          </div>
        ))}
        {error && <div style={{ fontSize:11, color:'#ef4444', marginBottom:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={onClose} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.06)', color:D.muted, border:`1px solid ${D.border}`, borderRadius:8, cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={save} disabled={loading}
            style={{ padding:'8px 18px', background:'#10b981', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>
            {loading ? 'Saving...' : 'Save credentials'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FixButton({ issue, domain, credential, onFixed }) {
  const [state, setState] = useState('idle') // idle|confirming|pushing|done|error
  const [error, setError] = useState('')
  const template = RECORD_TEMPLATES[issue.type]
  if (!template || !credential?.verified) return null

  const recordValue = template.getValues(domain.domain_name)[0]
  const recordName = typeof template.name === 'function' ? template.name(domain.domain_name) : template.name

  async function push() {
    setState('pushing'); setError('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`https://kbfgnbhjczicpjqxbxjj.supabase.co/functions/v1/dns-autofix`, {
      method:'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session.access_token}` },
      body: JSON.stringify({ action:'create', credential_id:credential.id, domain_id:domain.id, record_type:template.type, record_name:recordName, record_value:recordValue, record_ttl:template.ttl })
    })
    const data = await res.json()
    if (data.success) { setState('done'); onFixed() }
    else { setState('error'); setError(data.error || 'Failed') }
  }

  if (state === 'done') return <span style={{ fontSize:10, color:'#10b981', display:'flex', alignItems:'center', gap:4 }}><Check size={12}/> Fixed</span>
  if (state === 'confirming') return (
    <div style={{ display:'flex', gap:5, alignItems:'center' }}>
      <div style={{ fontSize:10, color:D.dim, maxWidth:180, lineHeight:1.3 }}>Add: <code style={{ fontFamily:'monospace' }}>{recordValue.slice(0,40)}…</code></div>
      <button onClick={push} style={{ padding:'3px 10px', background:'#10b981', color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer' }}>Confirm</button>
      <button onClick={() => setState('idle')} style={{ padding:'3px 8px', background:'rgba(255,255,255,0.06)', color:D.muted, border:'none', borderRadius:5, fontSize:11, cursor:'pointer' }}>Cancel</button>
    </div>
  )
  if (state === 'pushing') return <span style={{ fontSize:10, color:'#f59e0b' }}>Pushing...</span>
  if (state === 'error') return <span style={{ fontSize:10, color:'#ef4444' }}>{error}</span>

  return (
    <button onClick={() => setState('confirming')}
      style={{ padding:'3px 10px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:5, color:'#10b981', fontSize:11, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
      <Zap size={10}/> Fix automatically
    </button>
  )
}

export default function DnsAutoFix({ user, selectedDomain }) {
  const [credentials, setCredentials] = useState([])
  const [scanResult, setScanResult] = useState(null)
  const [changeLog, setChangeLog] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [verifying, setVerifying] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (selectedDomain?.id) { fetchCredentials(); fetchChangeLog() } }, [selectedDomain?.id])
  useEffect(() => { if (selectedDomain?.scan_results?.[0]) setScanResult(selectedDomain.scan_results[0]) }, [selectedDomain])

  async function fetchCredentials() {
    const { data } = await supabase.from('dns_credentials').select('*').eq('domain_id', selectedDomain.id).order('created_at')
    setCredentials(data || [])
  }

  async function fetchChangeLog() {
    const { data } = await supabase.from('dns_change_log').select('*').eq('domain_id', selectedDomain.id).order('created_at', { ascending: false }).limit(20)
    setChangeLog(data || [])
  }

  async function verifyCred(cred) {
    setVerifying(v => ({ ...v, [cred.id]: true }))
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`https://kbfgnbhjczicpjqxbxjj.supabase.co/functions/v1/dns-autofix`, {
      method:'POST', headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session.access_token}` },
      body: JSON.stringify({ action:'verify', credential_id:cred.id, domain_id:selectedDomain.id })
    })
    await res.json()
    await fetchCredentials()
    setVerifying(v => ({ ...v, [cred.id]: false }))
  }

  async function deleteCred(id) {
    await supabase.from('dns_credentials').delete().eq('id', id)
    fetchCredentials()
  }

  const issues = scanResult?.issues || []
  const fixableIssues = issues.filter(i => ['SPF','DMARC','CAA'].includes(i.type))
  const activeCred = credentials.find(c => c.verified)

  if (!selectedDomain) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:D.muted, flexDirection:'column', gap:12 }}>
      <Zap size={40} color="rgba(255,255,255,0.1)"/>
      <div>Select a domain to use DNS auto-fix</div>
    </div>
  )

  return (
    <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14, background:D.bg, minHeight:'100%', fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:D.text, marginBottom:3, display:'flex', alignItems:'center', gap:8 }}>
            <Zap size={16} color="#f59e0b"/> DNS auto-fix — {selectedDomain.domain_name}
          </h2>
          <p style={{ fontSize:12, color:D.muted }}>Connect your DNS provider once. Fix missing records in one click.</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ padding:'7px 16px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, color:'#10b981', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
          <Plus size={13}/> Connect provider
        </button>
      </div>

      {/* Connected providers */}
      <div style={card}>
        <div style={cardHd}><span style={{ fontSize:12, fontWeight:600, color:D.text }}>Connected DNS providers</span></div>
        {credentials.length === 0 ? (
          <div style={{ padding:'24px', textAlign:'center' }}>
            <Shield size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom:10 }}/>
            <div style={{ fontSize:13, color:D.muted, marginBottom:6 }}>No DNS providers connected</div>
            <div style={{ fontSize:11, color:D.dim, marginBottom:14 }}>Connect Cloudflare, GoDaddy, or Route 53 to enable one-click record fixes</div>
            <button onClick={() => setShowAdd(true)}
              style={{ padding:'8px 20px', background:'#10b981', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
              <Plus size={13}/> Connect your first provider
            </button>
          </div>
        ) : credentials.map(cred => {
          const prov = PROVIDERS.find(p => p.id === cred.provider)
          return (
            <div key={cred.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:`1px solid ${D.border}` }}>
              <span style={{ fontSize:20 }}>{prov?.logo}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:D.text }}>{cred.label}</div>
                <div style={{ fontSize:11, color:D.dim }}>
                  {cred.verified ? `Verified · Zone: ${cred.zone_id || 'auto-detected'}` : 'Not verified — click Verify to confirm access'}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                {cred.verified ? (
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:8, background:'rgba(16,185,129,0.15)', color:'#10b981', display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={11}/> Active</span>
                ) : (
                  <button onClick={() => verifyCred(cred)} disabled={verifying[cred.id]}
                    style={{ padding:'5px 12px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:7, color:'#f59e0b', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                    {verifying[cred.id] ? <><div style={{ width:11, height:11, border:'2px solid rgba(245,158,11,0.3)', borderTopColor:'#f59e0b', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Verifying...</> : <><RefreshCw size={11}/> Verify</>}
                  </button>
                )}
                <button onClick={() => deleteCred(cred.id)} style={{ padding:'5px 8px', background:'rgba(239,68,68,0.1)', border:'none', borderRadius:7, color:'#ef4444', cursor:'pointer' }}>
                  <Trash2 size={12}/>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fixable issues */}
      {scanResult && (
        <div style={card}>
          <div style={cardHd}>
            <span style={{ fontSize:12, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:6 }}><Zap size={13} color="#f59e0b"/> Auto-fixable issues</span>
            {!activeCred && <span style={{ fontSize:10, color:'#f59e0b' }}>Connect and verify a provider to enable auto-fix</span>}
          </div>
          {fixableIssues.length === 0 ? (
            <div style={{ padding:'20px 16px', display:'flex', alignItems:'center', gap:10 }}>
              <CheckCircle size={20} color="#10b981"/>
              <div style={{ fontSize:13, color:D.muted }}>No auto-fixable issues found — great job!</div>
            </div>
          ) : fixableIssues.map((iss, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'11px 16px', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
              <div style={{ width:22, height:22, borderRadius:6, background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                <AlertTriangle size={11} color="#ef4444"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:D.text, fontFamily:'monospace', marginBottom:2 }}>{iss.type}</div>
                <div style={{ fontSize:11, color:D.muted }}>{iss.message}</div>
                {iss.fix && <div style={{ fontSize:10, fontFamily:'monospace', color:'rgba(16,185,129,0.7)', padding:'2px 8px', background:'rgba(16,185,129,0.06)', borderRadius:4, display:'inline-block', marginTop:3 }}>{iss.fix}</div>}
              </div>
              <FixButton issue={iss} domain={selectedDomain} credential={activeCred} onFixed={() => fetchChangeLog()}/>
            </div>
          ))}
        </div>
      )}

      {/* Change audit log */}
      <div style={card}>
        <div style={cardHd}>
          <span style={{ fontSize:12, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:6 }}><Clock size={13} color={D.muted}/> DNS change audit log</span>
          <span style={{ fontSize:10, color:D.dim }}>{changeLog.length} changes</span>
        </div>
        {changeLog.length === 0 ? (
          <div style={{ padding:'20px 16px', textAlign:'center', fontSize:12, color:D.muted }}>No changes yet — all DNS fixes are logged here</div>
        ) : changeLog.map(log => (
          <div key={log.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 16px', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background: log.status==='success'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {log.status==='success'?<Check size={10} color="#10b981"/>:<X size={10} color="#ef4444"/>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:D.text }}>
                <span style={{ fontFamily:'monospace', color:'#3b82f6' }}>{log.record_type}</span> record {log.action}d on <span style={{ color:D.muted }}>{log.record_name}</span>
              </div>
              {log.record_value && <div style={{ fontSize:10, fontFamily:'monospace', color:D.dim, marginTop:1 }}>{log.record_value?.slice(0,60)}{log.record_value?.length > 60 ? '…' : ''}</div>}
              {log.error_message && <div style={{ fontSize:10, color:'#ef4444', marginTop:1 }}>{log.error_message}</div>}
            </div>
            <div style={{ fontSize:10, color:D.dim, textAlign:'right', flexShrink:0 }}>
              <div>{log.provider}</div>
              <div>{new Date(log.created_at).toLocaleString('en-GB', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddCredentialModal domain={selectedDomain} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); fetchCredentials() }}/>}
    </div>
  )
}
