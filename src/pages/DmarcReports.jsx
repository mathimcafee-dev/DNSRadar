import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import { Shield, Mail, AlertTriangle, CheckCircle, Globe, TrendingUp, Upload, Info } from 'lucide-react'

const D = { bg:'#0d1117', surface:'#161b22', surface2:'#1c2333', border:'rgba(255,255,255,0.08)', text:'#e6edf3', muted:'rgba(255,255,255,0.5)', dim:'rgba(255,255,255,0.25)' }
const card = { background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, overflow:'hidden' }
const cardHd = { padding:'11px 16px', borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:D.surface2 }

const VTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1a2035', border:`1px solid ${D.border}`, borderRadius:8, padding:'10px 14px', fontSize:11 }}>
      <div style={{ color:D.muted, marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:p.color }}/>
          <span style={{ color:D.text, fontWeight:500 }}>{p.name}: {p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function UploadXMLModal({ domain, onClose, onSuccess }) {
  const [xml, setXml] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(f) {
    setFile(f)
    const text = await f.text()
    setXml(text)
  }

  async function submit() {
    if (!xml.trim()) return
    setLoading(true); setError('')
    try {
      const { data, error: err } = await supabase.functions.invoke('parse-dmarc', { body: { xml, domain: domain.domain_name } })
      if (err || data?.error) throw new Error(err?.message || data?.error)
      onSuccess(data)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#1a2035', border:`1px solid ${D.border}`, borderRadius:16, width:'100%', maxWidth:520, margin:'0 16px', padding:24 }}>
        <div style={{ fontSize:16, fontWeight:700, color:D.text, marginBottom:6 }}>Upload DMARC aggregate report</div>
        <div style={{ fontSize:12, color:D.muted, marginBottom:16 }}>Paste XML from your rua= email or upload the .xml.gz file</div>
        <div style={{ marginBottom:12, padding:'12px 14px', background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:8, fontSize:11, color:'rgba(96,165,250,0.8)' }}>
          <div style={{ display:'flex', gap:6, marginBottom:4 }}><Info size={13}/><strong>How to get DMARC reports:</strong></div>
          Add <code style={{ background:'rgba(0,0,0,0.3)', padding:'1px 6px', borderRadius:4 }}>rua=mailto:reports@dnsradar.easysecurity.in</code> to your DMARC record and reports will arrive automatically. Or upload manually here.
        </div>
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
          style={{ border:`2px dashed ${D.border}`, borderRadius:8, padding:'16px', textAlign:'center', marginBottom:10, cursor:'pointer', transition:'border-color 0.2s' }}
          onClick={() => document.getElementById('xml-upload').click()}>
          <Upload size={20} color={D.muted} style={{ marginBottom:6 }}/>
          <div style={{ fontSize:12, color:D.muted }}>{file ? file.name : 'Drop .xml or .xml.gz file here, or click to browse'}</div>
          <input id="xml-upload" type="file" accept=".xml,.gz" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
        </div>
        <div style={{ marginBottom:4, fontSize:11, color:D.muted }}>Or paste XML directly:</div>
        <textarea value={xml} onChange={e => setXml(e.target.value)} rows={5} placeholder="<?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot; ?><feedback>..."
          style={{ width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:11, color:D.text, outline:'none', resize:'vertical', fontFamily:'monospace' }}/>
        {error && <div style={{ fontSize:11, color:'#ef4444', marginTop:6 }}>{error}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:14 }}>
          <button onClick={onClose} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.06)', color:D.muted, border:`1px solid ${D.border}`, borderRadius:8, cursor:'pointer', fontSize:13 }}>Cancel</button>
          <button onClick={submit} disabled={!xml || loading} style={{ padding:'8px 18px', background:'#10b981', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500, opacity: !xml ? 0.5 : 1 }}>
            {loading ? 'Parsing...' : 'Parse report'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DmarcReportsInner({ user, selectedDomain }) {
  const [stats, setStats] = useState([])
  const [sources, setSources] = useState([])
  const [reports, setReports] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

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
    setLoading(false)
  }

  const totalVolume = stats.reduce((s, d) => s + (d.total_volume || 0), 0)
  const totalPass = stats.reduce((s, d) => s + (d.pass_count || 0), 0)
  const totalFail = stats.reduce((s, d) => s + (d.fail_count || 0), 0)
  const totalThreats = stats.reduce((s, d) => s + (d.threat_count || 0), 0)
  const passRate = totalVolume > 0 ? Math.round((totalPass / totalVolume) * 100) : 0

  // Source breakdown
  const serviceBreakdown = sources.reduce((acc, s) => {
    const name = s.service_name || s.source_hostname || s.source_ip
    if (!acc[name]) acc[name] = { name, count: 0, pass: 0, fail: 0, threat: false }
    acc[name].count += s.count
    if (s.dmarc_pass) acc[name].pass += s.count
    else acc[name].fail += s.count
    if (s.is_threat) acc[name].threat = true
    return acc
  }, {})
  const topSources = Object.values(serviceBreakdown).sort((a, b) => b.count - a.count).slice(0, 10)

  // Country breakdown
  const countryBreakdown = sources.reduce((acc, s) => {
    if (!s.source_country) return acc
    if (!acc[s.source_country]) acc[s.source_country] = { country: s.source_country, code: s.source_country_code, count: 0, threats: 0 }
    acc[s.source_country].count += s.count
    if (s.is_threat) acc[s.source_country].threats += s.count
    return acc
  }, {})
  const topCountries = Object.values(countryBreakdown).sort((a, b) => b.count - a.count).slice(0, 8)

  const donutData = totalVolume > 0 ? [
    { name: 'Pass', value: totalPass, color: '#10b981' },
    { name: 'Fail', value: totalFail, color: '#ef4444' },
  ] : [{ name: 'No data', value: 1, color: 'rgba(255,255,255,0.06)' }]

  if (!selectedDomain) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:D.muted, flexDirection:'column', gap:12 }}>
      <Mail size={40} color="rgba(255,255,255,0.1)"/>
      <div style={{ fontSize:15, fontWeight:500 }}>Select a domain to view DMARC reports</div>
    </div>
  )

  return (
    <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14, background:D.bg, minHeight:'100%', fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:D.text, marginBottom:3 }}>DMARC aggregate reports — {selectedDomain.domain_name}</h2>
          <p style={{ fontSize:12, color:D.muted }}>Email authentication visibility from mail providers worldwide</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.05)', borderRadius:8, padding:3 }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setRange(d)}
                style={{ padding:'4px 12px', borderRadius:6, border:'none', fontSize:12, fontWeight:500, cursor:'pointer', background: range===d ? '#10b981' : 'transparent', color: range===d ? '#fff' : D.muted }}>
                {d}d
              </button>
            ))}
          </div>
          <button onClick={() => setShowUpload(true)}
            style={{ padding:'7px 16px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, color:'#10b981', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <Upload size={13}/> Upload XML report
          </button>
        </div>
      </div>

      {/* No data state */}
      {!loading && stats.length === 0 && (
        <div style={{ ...card, padding:32, textAlign:'center' }}>
          <Mail size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom:12 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:D.text, marginBottom:8 }}>No DMARC reports yet</div>
          <div style={{ fontSize:13, color:D.muted, maxWidth:500, margin:'0 auto', lineHeight:1.6, marginBottom:16 }}>
            Add <code style={{ background:'rgba(255,255,255,0.08)', padding:'2px 8px', borderRadius:4 }}>rua=mailto:reports@dnsradar.easysecurity.in</code> to your DMARC record. Mail providers will start sending reports within 24 hours.
          </div>
          <button onClick={() => setShowUpload(true)}
            style={{ padding:'9px 24px', background:'#10b981', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7 }}>
            <Upload size={14}/> Upload existing report
          </button>
        </div>
      )}

      {(loading || stats.length > 0) && (<>
        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:10 }}>
          {[
            { label:'Total volume', val:totalVolume.toLocaleString(), color:'#3b82f6', sub:`Last ${range} days` },
            { label:'Pass rate', val:`${passRate}%`, color: passRate >= 95 ? '#10b981' : passRate >= 80 ? '#f59e0b' : '#ef4444', sub:`${totalPass.toLocaleString()} passed` },
            { label:'Failures', val:totalFail.toLocaleString(), color:totalFail > 0 ? '#ef4444' : '#10b981', sub:'emails failed auth' },
            { label:'Threats detected', val:totalThreats.toLocaleString(), color:totalThreats > 0 ? '#ef4444' : '#10b981', sub:'unauthorised senders' },
          ].map(k => (
            <div key={k.label} style={{ ...card, padding:'13px 16px' }}>
              <div style={{ fontSize:11, color:D.muted, marginBottom:4 }}>{k.label}</div>
              <div style={{ fontSize:22, fontWeight:700, color:k.color, lineHeight:1 }}>{loading ? '…' : k.val}</div>
              <div style={{ fontSize:10, color:D.dim, marginTop:4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Volume trend + compliance donut */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14 }}>
          <div style={{ ...card, padding:'14px 16px' }}>
            <div style={{ fontSize:12, fontWeight:600, color:D.text, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:3, height:14, background:'#3b82f6', borderRadius:2, display:'inline-block' }}/>
              Email volume trend
            </div>
            {loading ? <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:D.muted, fontSize:12 }}>Loading...</div> : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={stats.map(s => ({ date: s.stat_date?.slice(5), pass: s.pass_count, fail: s.fail_count, total: s.total_volume }))} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                  <defs>
                    <linearGradient id="gPass" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'rgba(255,255,255,0.3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<VTooltip/>}/>
                  <Area type="monotone" dataKey="pass" name="Pass" stroke="#10b981" strokeWidth={2} fill="url(#gPass)"/>
                  <Area type="monotone" dataKey="fail" name="Fail" stroke="#ef4444" strokeWidth={1.5} fill="url(#gFail)"/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ ...card, padding:'14px 16px', width:160, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:11, fontWeight:600, color:D.text, marginBottom:8, textAlign:'center' }}>Compliance</div>
            {loading ? <div style={{ fontSize:24, fontWeight:700, color:D.muted }}>…</div> : (
              <>
                <div style={{ position:'relative', width:100, height:100 }}>
                  <PieChart width={100} height={100}>
                    <Pie data={donutData} cx={50} cy={50} innerRadius={32} outerRadius={46} dataKey="value" strokeWidth={0}>
                      {donutData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                    </Pie>
                  </PieChart>
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                    <div style={{ fontSize:18, fontWeight:700, color: passRate >= 95 ? '#10b981' : passRate >= 80 ? '#f59e0b' : '#ef4444', lineHeight:1 }}>{passRate}%</div>
                    <div style={{ fontSize:9, color:D.dim }}>pass rate</div>
                  </div>
                </div>
                <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4, width:'100%' }}>
                  {donutData.filter(d => d.name !== 'No data').map(d => (
                    <div key={d.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:d.color, flexShrink:0 }}/>
                      <span style={{ color:D.muted, flex:1 }}>{d.name}</span>
                      <span style={{ color:D.text, fontWeight:600 }}>{d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top sending sources */}
        <div style={card}>
          <div style={cardHd}>
            <span style={{ fontSize:12, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:6 }}><Mail size={13} color="#a78bfa"/> Sending sources</span>
            <span style={{ fontSize:10, color:D.dim }}>{topSources.length} unique sources in period</span>
          </div>
          {topSources.length === 0 ? (
            <div style={{ padding:'24px', textAlign:'center', fontSize:12, color:D.muted }}>No source data yet — upload a DMARC report</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                    {['Source','Volume','Pass','Fail','Pass rate','Status'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'7px 16px', fontSize:10, fontWeight:600, color:D.muted, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${D.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topSources.map((s, i) => {
                    const rate = s.count > 0 ? Math.round((s.pass / s.count) * 100) : 0
                    return (
                      <tr key={i} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                        <td style={{ padding:'9px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:6, height:6, borderRadius:'50%', background: s.threat ? '#ef4444' : '#10b981', flexShrink:0 }}/>
                            <span style={{ color:D.text, fontWeight:500, fontFamily: s.name.match(/\d+\.\d+/) ? 'monospace' : 'inherit', fontSize: s.name.match(/\d+\.\d+/) ? 11 : 12 }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ padding:'9px 16px', color:D.muted }}>{s.count.toLocaleString()}</td>
                        <td style={{ padding:'9px 16px', color:'#10b981', fontWeight:500 }}>{s.pass.toLocaleString()}</td>
                        <td style={{ padding:'9px 16px', color: s.fail > 0 ? '#ef4444' : D.dim, fontWeight: s.fail > 0 ? 600 : 400 }}>{s.fail.toLocaleString()}</td>
                        <td style={{ padding:'9px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${rate}%`, background: rate >= 95 ? '#10b981' : rate >= 80 ? '#f59e0b' : '#ef4444' }}/>
                            </div>
                            <span style={{ fontSize:11, color:D.muted, width:32, textAlign:'right' }}>{rate}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'9px 16px' }}>
                          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background: s.threat ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', color: s.threat ? '#ef4444' : '#10b981' }}>
                            {s.threat ? 'Threat' : 'Legitimate'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Country breakdown + reports log */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={card}>
            <div style={cardHd}><span style={{ fontSize:12, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:6 }}><Globe size={13} color="#3b82f6"/> Top countries</span></div>
            {topCountries.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', fontSize:12, color:D.muted }}>No country data yet</div>
            ) : (
              <div style={{ padding:'8px 0' }}>
                {topCountries.map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 16px', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                    <span style={{ fontSize:13 }}>{c.code === 'US' ? '🇺🇸' : c.code === 'GB' ? '🇬🇧' : c.code === 'DE' ? '🇩🇪' : c.code === 'IN' ? '🇮🇳' : c.code === 'CN' ? '🇨🇳' : c.code === 'FR' ? '🇫🇷' : c.code === 'CA' ? '🇨🇦' : c.code === 'AU' ? '🇦🇺' : '🌐'}</span>
                    <span style={{ flex:1, fontSize:12, color:D.text }}>{c.country}</span>
                    {c.threats > 0 && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'rgba(239,68,68,0.15)', color:'#ef4444' }}>{c.threats} threats</span>}
                    <div style={{ width:60 }}>
                      <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.round((c.count/topCountries[0].count)*100)}%`, background: c.threats > 0 ? '#ef4444' : '#3b82f6', borderRadius:2 }}/>
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:D.muted, width:36, textAlign:'right' }}>{c.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={card}>
            <div style={cardHd}><span style={{ fontSize:12, fontWeight:600, color:D.text }}>Report log</span><span style={{ fontSize:10, color:D.dim }}>{reports.length} reports received</span></div>
            {reports.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', fontSize:12, color:D.muted }}>No reports yet</div>
            ) : (
              <div style={{ overflowY:'auto', maxHeight:280 }}>
                {reports.map(r => (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:D.text, fontWeight:500 }}>{r.org_name || 'Unknown org'}</div>
                      <div style={{ fontSize:10, color:D.dim }}>{r.report_date} · {r.total_volume?.toLocaleString()} emails</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:12, fontWeight:600, color: (r.pass_count/r.total_volume) >= 0.95 ? '#10b981' : '#f59e0b' }}>
                        {r.total_volume > 0 ? Math.round((r.pass_count/r.total_volume)*100) : 0}%
                      </div>
                      <div style={{ fontSize:10, color:D.dim }}>pass rate</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RUA setup instructions */}
        <div style={{ ...card, padding:'16px 18px' }}>
          <div style={{ fontSize:12, fontWeight:600, color:D.text, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}><Info size={13} color="#3b82f6"/> Set up automatic DMARC reporting</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, fontSize:12 }}>
            <div>
              <div style={{ color:D.muted, marginBottom:6 }}>1. Add or update your DMARC record with the rua= tag:</div>
              <div style={{ fontFamily:'monospace', fontSize:11, color:'rgba(16,185,129,0.8)', background:'rgba(16,185,129,0.06)', padding:'8px 12px', borderRadius:7 }}>
                v=DMARC1; p=quarantine; rua=mailto:reports@dnsradar.easysecurity.in
              </div>
            </div>
            <div>
              <div style={{ color:D.muted, marginBottom:6 }}>2. Mail providers that send reports (they arrive daily):</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {['Google', 'Microsoft', 'Yahoo', 'Apple', 'Proofpoint', 'Mimecast'].map(p => (
                  <span key={p} style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'rgba(255,255,255,0.06)', color:D.muted }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>)}

      {showUpload && <UploadXMLModal domain={selectedDomain} onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); fetchData() }}/>}
    </div>
  )
}

export default function DmarcReports({ user }) {
  const [domains, setDomains] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    supabase.from('domains').select('id,domain_name').eq('user_id', user.id).eq('verified', true).order('domain_name').then(({ data }) => {
      setDomains(data || [])
      if (data?.length) setSelectedId(data[0].id)
    })
  }, [user.id])

  const selectedDomain = domains.find(d => d.id === selectedId) || null

  return (
    <div style={{ background: D.bg, minHeight: '100%', fontFamily: "'DM Sans','Inter',system-ui,sans-serif" }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${D.border}`, background: D.surface, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: D.text, margin: 0 }}>DMARC Reports</h2>
        {domains.length > 0 && (
          <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value)}
            style={{ padding: '5px 10px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 7, fontSize: 12, color: D.text, cursor: 'pointer', outline: 'none' }}>
            {domains.map(d => <option key={d.id} value={d.id}>{d.domain_name}</option>)}
          </select>
        )}
        {domains.length === 0 && (
          <span style={{ fontSize: 12, color: D.muted }}>No verified domains found</span>
        )}
      </div>
      <DmarcReportsInner user={user} selectedDomain={selectedDomain} />
    </div>
  )
}
