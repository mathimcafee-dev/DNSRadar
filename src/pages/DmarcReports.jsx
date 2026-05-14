import { useState, useEffect, useRef } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import { Shield, Mail, AlertTriangle, CheckCircle, Globe, Upload, Copy, Check, ChevronDown, ChevronUp, RefreshCw, Zap, Info, ExternalLink } from 'lucide-react'

const D = { bg:'#f7f8fa', surface:'#ffffff', surface2:'#f9fafb', border:'#e5e7eb', text:'#111827', muted:'#374151', dim:'#6b7280' }
const card = { background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }
const cardHd = { padding:'12px 16px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafafa' }

const VTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 14px', fontSize:11 }}>
      <div style={{ color:'#374151', marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }}/>
          <span style={{ color:D.text, fontWeight:500 }}>{p.name}: {p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function CopyBtn({ text }) {
  const [c,setC] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(() => setC(false), 2000) }}
      style={{ padding:'4px 10px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:6, color:'#16a34a', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
      {c ? <><Check size={11}/>Copied</> : <><Copy size={11}/>Copy</>}
    </button>
  )
}

function RuaSetupCard({ ruaAddress }) {
  const [open, setOpen] = useState(true)
  const dmarcRecord = `v=DMARC1; p=none; rua=mailto:${ruaAddress}; ruf=mailto:${ruaAddress}; adkim=r; aspf=r`
  return (
    <div style={{ ...card, marginBottom:16, border:'1px solid rgba(16,185,129,0.25)', background:'rgba(16,185,129,0.04)' }}>
      <div style={{ ...cardHd, background:'rgba(16,185,129,0.08)', cursor:'pointer' }} onClick={() => setOpen(o=>!o)}>
        <span style={{ fontSize:13, fontWeight:600, color:'#16a34a', display:'flex', alignItems:'center', gap:7 }}>
          <Zap size={14}/> Step 1 — Point your DMARC rua= address here to start receiving reports automatically
        </span>
        {open ? <ChevronUp size={14} color={D.dim}/> : <ChevronDown size={14} color={D.dim}/>}
      </div>
      {open && (
        <div style={{ padding:16 }}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>Your unique RUA address</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ flex:1, fontFamily:'monospace', fontSize:13, color:'#16a34a', background:'#1e293b', padding:'8px 12px', borderRadius:7, border:`1px solid rgba(16,185,129,0.2)`, wordBreak:'break-all' }}>
                {ruaAddress}
              </div>
              <CopyBtn text={ruaAddress}/>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'#374151', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>Full DMARC record to add to your DNS</div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
              <div style={{ flex:1, fontFamily:'monospace', fontSize:12, color:'#7dd3fc', background:'#1e293b', padding:'8px 12px', borderRadius:7, border:'1px solid #e5e7eb', lineHeight:1.7, wordBreak:'break-all' }}>
                {dmarcRecord}
              </div>
              <CopyBtn text={dmarcRecord}/>
            </div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#374151' }}>
            <strong style={{ color:D.text }}>How it works:</strong> Add this TXT record to <code style={{ color:'#f97316' }}>_dmarc.yourdomain.com</code> → Google / Microsoft / other mail providers will automatically send DMARC aggregate reports to this address → reports appear here within 24–48 hours.
          </div>
        </div>
      )}
    </div>
  )
}

function PolicyWizard({ domain, currentPolicy, ruaAddress }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const policies = [
    { p: 'none', label: 'None (monitor)', color: '#6b7280', desc: 'Emails pass regardless. You receive reports to see who is sending on your behalf. Start here.', risk: 'Low', visibility: 'Full' },
    { p: 'quarantine', label: 'Quarantine', color: '#ffb224', desc: 'Unauthenticated emails go to spam. Legitimate senders must pass SPF or DKIM.', risk: 'Medium', visibility: 'Full' },
    { p: 'reject', label: 'Reject (enforce)', color: '#00e5a0', desc: 'Unauthenticated emails are blocked entirely. Maximum protection — use only after monitoring confirms all senders pass.', risk: 'High if misconfigured', visibility: 'Full' },
  ]
  const currentIdx = policies.findIndex(p => p.p === currentPolicy) ?? 0
  const safeIdx = Math.max(0, currentIdx)
  const nextPolicy = policies[Math.min(safeIdx + 1, 2)]
  const canUpgrade = safeIdx < 2

  const record = `v=DMARC1; p=${nextPolicy.p}; rua=mailto:${ruaAddress}; adkim=r; aspf=r`

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:7 }}><Shield size={14} color="#10b981"/> DMARC enforcement wizard — {domain?.domain_name}</span>
      </div>
      <div style={{ padding:16 }}>
        {/* Policy ladder */}
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {policies.map((p, i) => (
            <div key={p.p} style={{ flex:1, minWidth:140, padding:'10px 12px', borderRadius:10, border:`1px solid ${i === safeIdx ? p.color+'60' : D.border}`, background: i === safeIdx ? p.color+'12' : 'rgba(255,255,255,0.02)', position:'relative' }}>
              {i === safeIdx && <div style={{ position:'absolute', top:8, right:8, fontSize:9, padding:'1px 6px', borderRadius:6, background:p.color+'25', color:p.color, fontWeight:700 }}>CURRENT</div>}
              {i < safeIdx && <CheckCircle size={12} color="#10b981" style={{ position:'absolute', top:8, right:8 }}/>}
              <div style={{ fontSize:13, fontWeight:600, color:i <= safeIdx ? p.color : D.dim, marginBottom:4 }}>{p.label}</div>
              <div style={{ fontSize:12, color:'#374151' }}>{p.desc}</div>
            </div>
          ))}
        </div>

        {canUpgrade ? (
          <>
            <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:8 }}>Next step: upgrade to <span style={{ color:nextPolicy.color }}>{nextPolicy.label}</span></div>
              <div style={{ fontSize:12, color:'#374151', marginBottom:10 }}>Update your <code style={{ color:'#f97316' }}>_dmarc.{domain?.domain_name}</code> TXT record to:</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ flex:1, fontFamily:'monospace', fontSize:12, color:'#7dd3fc', background:'#1e293b', padding:'8px 12px', borderRadius:7, border:'1px solid #e5e7eb', wordBreak:'break-all', lineHeight:1.6 }}>
                  {record}
                </div>
                <CopyBtn text={record}/>
              </div>
            </div>
            <div style={{ fontSize:12, color:'#374151', lineHeight:1.6 }}>
              ⚠️ Before upgrading to <strong style={{ color:'#374151' }}>{nextPolicy.p}</strong>: ensure all your sending sources appear in your DMARC reports with <span style={{ color:'#16a34a' }}>pass</span> status. If any legitimate sender shows <span style={{ color:'#ff4d6a' }}>fail</span>, fix it first.
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'20px', color:'#16a34a', fontSize:13 }}>
            <CheckCircle size={28} style={{ marginBottom:8 }} /><br/>
            Your domain is fully enforced at <strong>p=reject</strong>. Maximum protection active.
          </div>
        )}
      </div>
    </div>
  )
}

function UploadXMLModal({ domain, onClose, onSuccess }) {
  const [xml, setXml] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  async function upload() {
    const xmlToSend = file ? await file.text() : xml.trim()
    if (!xmlToSend) { setError('Paste XML or select a file'); return }
    setLoading(true); setError('')
    try {
      const res = await supabase.functions.invoke('parse-dmarc', {
        body: { xml: xmlToSend, domain_name: domain?.domain_name, domain_id: domain?.id }
      })
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message)
      onSuccess(res.data)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500 }}>
      <div style={{ background:D.surface, border:'1px solid #e5e7eb', borderRadius:14, padding:20, width:'min(520px,95vw)', maxHeight:'80vh', overflow:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontSize:14, fontWeight:600, color:D.text }}>Upload DMARC XML report</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:18 }}>×</button>
        </div>
        <div style={{ marginBottom:12 }}>
          <button onClick={() => fileRef.current?.click()} style={{ padding:'7px 14px', background:'#e5e7eb', border:'1px solid #e5e7eb', borderRadius:7, color:D.text, fontSize:12, cursor:'pointer', marginBottom:10 }}>
            {file ? `📎 ${file.name}` : '📎 Select .xml / .gz file'}
          </button>
          <input ref={fileRef} type="file" accept=".xml,.gz,.zip" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])}/>
        </div>
        {!file && (
          <textarea value={xml} onChange={e => setXml(e.target.value)} placeholder="Or paste XML content here..." rows={8}
            style={{ width:'100%', padding:'10px', background:'#1e293b', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12, fontFamily:'monospace', color:D.text, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
        )}
        {error && <div style={{ fontSize:12, color:'#ff4d6a', marginTop:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button onClick={upload} disabled={loading} style={{ flex:1, padding:'9px', background:'#00e5a0', color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' }}>
            {loading ? 'Processing…' : 'Upload & parse'}
          </button>
          <button onClick={onClose} style={{ padding:'9px 16px', background:'#e5e7eb', border:'1px solid #e5e7eb', borderRadius:8, color:'#374151', fontSize:13, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function DmarcReportsInner({ user, selectedDomain }) {
  const [stats, setStats] = useState([])
  const [sources, setSources] = useState([])
  const [reports, setReports] = useState([])
  const [ruaAddress, setRuaAddress] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)
  const [currentPolicy, setCurrentPolicy] = useState('none')

  useEffect(() => {
    supabase.from('profiles').select('rua_token').eq('id', user.id).single().then(({ data }) => {
      if (data?.rua_token) setRuaAddress(`${data.rua_token}@rua.domainmaster.site`)
    })
  }, [user.id])

  useEffect(() => { if (selectedDomain?.id) fetchData() }, [selectedDomain?.id, range])

  async function fetchData() {
    if (!selectedDomain?.id) return
    setLoading(true)
    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const [statsRes, sourcesRes, reportsRes] = await Promise.all([
      supabase.from('dmarc_daily_stats').select('*').eq('domain_id', selectedDomain.id).gte('stat_date', since).order('stat_date'),
      supabase.from('dmarc_sources').select('*').eq('domain_id', selectedDomain.id).gte('report_date', since).order('count', { ascending: false }).limit(50),
      supabase.from('dmarc_reports').select('*').eq('domain_id', selectedDomain.id).order('report_date', { ascending: false }).limit(20),
    ])
    setStats(statsRes.data || [])
    setSources(sourcesRes.data || [])
    setReports(reportsRes.data || [])
    // Get current policy from latest report
    if (reportsRes.data?.length) setCurrentPolicy(reportsRes.data[0].policy_p || 'none')
    setLoading(false)
  }

  const totalVolume = stats.reduce((s, d) => s + (d.total_volume || 0), 0)
  const totalPass = stats.reduce((s, d) => s + (d.pass_count || 0), 0)
  const totalFail = stats.reduce((s, d) => s + (d.fail_count || 0), 0)
  const passRate = totalVolume > 0 ? Math.round((totalPass / totalVolume) * 100) : 0

  const serviceBreakdown = sources.reduce((acc, s) => {
    const name = s.service_name || s.source_hostname || s.source_ip || 'Unknown'
    if (!acc[name]) acc[name] = { name, count: 0, pass: 0, fail: 0, threat: false }
    acc[name].count += s.count
    if (s.dmarc_pass) acc[name].pass += s.count
    else acc[name].fail += s.count
    if (s.is_threat) acc[name].threat = true
    return acc
  }, {})
  const topSources = Object.values(serviceBreakdown).sort((a, b) => b.count - a.count).slice(0, 10)

  const countryBreakdown = sources.reduce((acc, s) => {
    if (!s.source_country) return acc
    if (!acc[s.source_country]) acc[s.source_country] = { country: s.source_country, count: 0, threats: 0 }
    acc[s.source_country].count += s.count
    if (s.is_threat) acc[s.source_country].threats += s.count
    return acc
  }, {})
  const topCountries = Object.values(countryBreakdown).sort((a, b) => b.count - a.count).slice(0, 8)

  const donutData = totalVolume > 0
    ? [{ name: 'Pass', value: totalPass, color: '#00e5a0' }, { name: 'Fail', value: totalFail, color: '#ff4d6a' }]
    : [{ name: 'No data', value: 1, color: '#e5e7eb' }]

  const hasData = totalVolume > 0

  return (
    <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14, background:'#f7f8fa', minHeight:'100%', fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:3 }}>DMARC Reports — {selectedDomain?.domain_name}</h2>
          <div style={{ fontSize:13, color:'#374151' }}>Last {range} days · {totalVolume.toLocaleString()} messages processed</div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[7,30,90].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ padding:'5px 12px', background:range===r?'rgba(16,185,129,0.12)':'#f9fafb', border:`1px solid ${range===r?'rgba(16,185,129,0.3)':'#e5e7eb'}`, borderRadius:7, color:range===r?'#00e5a0':D.muted, fontSize:12, fontWeight:500, cursor:'pointer' }}>{r}d</button>
          ))}
          <button onClick={() => setShowUpload(true)} style={{ padding:'5px 12px', background:'#e5e7eb', border:'1px solid #e5e7eb', borderRadius:7, color:D.text, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}><Upload size={11}/> Upload XML</button>
          <button onClick={fetchData} style={{ padding:'5px 10px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:7, color:'#374151', cursor:'pointer' }}><RefreshCw size={12}/></button>
        </div>
      </div>

      {/* RUA setup — always show */}
      {ruaAddress && <RuaSetupCard ruaAddress={ruaAddress}/>}

      {/* Policy wizard */}
      {selectedDomain && <PolicyWizard domain={selectedDomain} currentPolicy={currentPolicy} ruaAddress={ruaAddress}/>}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
          <div style={{ width:28, height:28, border:'3px solid rgba(16,185,129,0.2)', borderTopColor:'#00e5a0', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
        </div>
      ) : !hasData ? (
        <div style={{ ...card, padding:'48px 24px', textAlign:'center' }}>
          <Mail size={40} color={D.dim} style={{ marginBottom:12 }}/>
          <div style={{ fontSize:14, fontWeight:600, color:D.text, marginBottom:8 }}>No DMARC data yet for this domain</div>
          <p style={{ fontSize:13, color:'#374151', maxWidth:420, margin:'0 auto 16px', lineHeight:1.6 }}>
            Add the RUA address above to your DMARC record. Reports arrive automatically within 24–48 hours.
            Or upload a report XML manually to test immediately.
          </p>
          <button onClick={() => setShowUpload(true)} style={{ padding:'8px 20px', background:'#00e5a0', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Upload test XML now
          </button>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
            {[
              { label:'Total messages', value:totalVolume.toLocaleString(), color:'#111827' },
              { label:'Pass rate', value:`${passRate}%`, color: passRate >= 90 ? '#00e5a0' : passRate >= 70 ? '#ffb224' : '#ff4d6a' },
              { label:'Passing', value:totalPass.toLocaleString(), color:'#16a34a' },
              { label:'Failing', value:totalFail.toLocaleString(), color: totalFail > 0 ? '#ff4d6a' : '#6b7280' },
            ].map(s => (
              <div key={s.label} style={{ background:D.surface, border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:20, fontWeight:700, color:s.color, marginBottom:2 }}>{s.value}</div>
                <div style={{ fontSize:12, color:'#374151' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Volume chart + donut */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14, flexWrap:'wrap' }}>
            <div style={card}>
              <div style={cardHd}><span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Email volume over time</span></div>
              <div style={{ padding:16, height:180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                    <defs>
                      <linearGradient id="gPass" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="stat_date" tick={{ fill:'#9ca3af', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'#9ca3af', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<VTooltip/>}/>
                    <Area type="monotone" dataKey="pass_count" name="Pass" stroke="#10b981" strokeWidth={2} fill="url(#gPass)"/>
                    <Area type="monotone" dataKey="fail_count" name="Fail" stroke="#ef4444" strokeWidth={2} fill="url(#gFail)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ ...card, minWidth:160 }}>
              <div style={cardHd}><span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Compliance</span></div>
              <div style={{ padding:16, display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <PieChart width={120} height={120}>
                  <Pie data={donutData} cx={60} cy={60} innerRadius={38} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {donutData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                </PieChart>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:700, color: passRate >= 90 ? '#00e5a0' : passRate >= 70 ? '#ffb224' : '#ff4d6a' }}>{passRate}%</div>
                  <div style={{ fontSize:12, color:'#374151' }}>pass rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top sources */}
          {topSources.length > 0 && (
            <div style={card}>
              <div style={cardHd}><span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Sending sources</span></div>
              <div style={{ padding:'0 16px 8px' }}>
                {topSources.map((s, i) => {
                  const pct = s.count > 0 ? Math.round((s.pass / s.count) * 100) : 0
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < topSources.length-1 ? '1px solid #1e2535' : 'none' }}>
                      {s.threat && <AlertTriangle size={12} color="#ef4444" style={{ flexShrink:0 }}/>}
                      {!s.threat && <CheckCircle size={12} color="#10b981" style={{ flexShrink:0 }}/>}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:D.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                        <div style={{ height:4, borderRadius:2, background:'#e5e7eb', marginTop:4, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background: pct >= 90 ? '#00e5a0' : pct >= 70 ? '#ffb224' : '#ff4d6a', borderRadius:2 }}/>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:'#374151', flexShrink:0, textAlign:'right' }}>
                        <div>{s.count.toLocaleString()} msgs</div>
                        <div style={{ color: pct >= 90 ? '#00e5a0' : '#ffb224' }}>{pct}% pass</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Country breakdown */}
          {topCountries.length > 0 && (
            <div style={card}>
              <div style={cardHd}><span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Email by country</span></div>
              <div style={{ padding:16, height:220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCountries} layout="vertical" margin={{ top:0, right:40, left:10, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
                    <XAxis type="number" tick={{ fill:'#9ca3af', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="country" type="category" tick={{ fill:'#6b7280', fontSize:10 }} axisLine={false} tickLine={false} width={80}/>
                    <Tooltip content={<VTooltip/>}/>
                    <Bar dataKey="count" name="Messages" fill="#3b82f6" radius={[0,4,4,0]}>
                      {topCountries.map((e, i) => <Cell key={i} fill={e.threats > 0 ? '#ff4d6a' : '#3d9bff'}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Report list */}
          {reports.length > 0 && (
            <div style={card}>
              <div style={cardHd}><span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>Individual reports ({reports.length})</span></div>
              <div>
                {reports.map((r, i) => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom: i < reports.length-1 ? '1px solid #1e2535' : 'none' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:D.text }}>{r.org_name || 'Unknown'}</div>
                      <div style={{ fontSize:10, color:'#6b7280' }}>{r.report_date} · {r.total_volume?.toLocaleString()} messages</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:12, color:'#16a34a' }}>{r.total_volume > 0 ? Math.round((r.pass_count / r.total_volume) * 100) : 0}% pass</div>
                      <div style={{ fontSize:10, color:'#6b7280' }}>p={r.policy_p || '?'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showUpload && <UploadXMLModal domain={selectedDomain} onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); fetchData() }}/>}
    </div>
  )
}

export default function DmarcReports({ user }) {
  const [domains, setDomains] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    supabase.from('domains').select('id,domain_name,verified').eq('user_id', user.id).order('domain_name').then(({ data }) => {
      setDomains(data || [])
      if (data?.length) setSelectedId(data[0].id)
    })
  }, [user.id])

  const selectedDomain = domains.find(d => d.id === selectedId) || null

  return (
    <div style={{ background: D.bg, minHeight: '100%', fontFamily: "'DM Sans','Inter',system-ui,sans-serif" }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2535', background: D.surface, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: 0 }}>DMARC Reports</h2>
        {domains.length > 0 && (
          <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value)}
            style={{ padding: '5px 10px', background: D.surface2, border: '1px solid #1e2535', borderRadius: 7, fontSize: 12, color: D.text, cursor: 'pointer', outline: 'none' }}>
            {domains.map(d => <option key={d.id} value={d.id}>{d.domain_name}</option>)}
          </select>
        )}
      </div>
      <DmarcReportsInner user={user} selectedDomain={selectedDomain} />
    </div>
  )
}
