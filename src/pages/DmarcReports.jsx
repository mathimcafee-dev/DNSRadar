import { useState, useEffect } from 'react'
import { Shield, Globe, AlertTriangle, CheckCircle, Mail, Upload, RefreshCw, Info } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabase'

const D = { bg:'#0d1117',surface:'#161b22',surface2:'#1c2333',border:'rgba(255,255,255,0.08)',text:'#e6edf3',muted:'rgba(255,255,255,0.5)',dim:'rgba(255,255,255,0.25)' }
const card = { background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, overflow:'hidden' }
const cardHd = { padding:'11px 16px', borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:D.surface2 }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1a2035', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', fontSize:11 }}>
      <div style={{ color:D.muted, marginBottom:6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:p.color }}/>
          <span style={{ color:D.text }}>{p.name}: {p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function DmarcReports({ user, selectedDomain }) {
  const [stats, setStats] = useState([])
  const [sources, setSources] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [rua, setRua] = useState('')

  useEffect(() => {
    if (selectedDomain?.id) fetchData()
  }, [selectedDomain])

  useEffect(() => {
    if (selectedDomain?.domain_name) {
      setRua(`reports+${selectedDomain.domain_name.replace(/\./g,'-')}@dnsradar.easysecurity.in`)
    }
  }, [selectedDomain])

  async function fetchData() {
    setLoading(true)
    const [{ data: statsData }, { data: sourcesData }, { data: reportsData }] = await Promise.all([
      supabase.from('dmarc_daily_stats').select('*').eq('domain_id', selectedDomain.id).order('stat_date', { ascending: true }).limit(30),
      supabase.from('dmarc_sources').select('*').eq('domain_id', selectedDomain.id).order('count', { ascending: false }).limit(50),
      supabase.from('dmarc_reports').select('*').eq('domain_id', selectedDomain.id).order('report_date', { ascending: false }).limit(20),
    ])
    setStats(statsData || [])
    setSources(sourcesData || [])
    setReports(reportsData || [])
    setLoading(false)
  }

  async function handleXMLUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    try {
      const text = await file.text()
      const xml = text.includes('<feedback>') ? text : atob(text.split('\n').join(''))
      const { data, error } = await supabase.functions.invoke('parse-dmarc', {
        body: { xml, domain_id: selectedDomain?.id, user_id: user?.id, domain_name: selectedDomain?.domain_name }
      })
      if (error) throw error
      setUploadResult({ success: true, ...data })
      await fetchData()
    } catch (err) {
      setUploadResult({ success: false, error: err.message })
    }
    setUploading(false)
    e.target.value = ''
  }

  const totalVol = stats.reduce((a, s) => a + (s.total_volume || 0), 0)
  const totalPass = stats.reduce((a, s) => a + (s.pass_count || 0), 0)
  const totalFail = stats.reduce((a, s) => a + (s.fail_count || 0), 0)
  const totalThreat = stats.reduce((a, s) => a + (s.threat_count || 0), 0)
  const complianceRate = totalVol > 0 ? Math.round((totalPass / totalVol) * 100) : 0

  const chartData = stats.map(s => ({
    date: new Date(s.stat_date).toLocaleDateString('en-GB', { month:'short', day:'numeric' }),
    pass: s.pass_count || 0,
    fail: s.fail_count || 0,
    threat: s.threat_count || 0,
  }))

  const sourcesByService = sources.reduce((acc, s) => {
    const key = s.service_name || s.source_org || s.source_ip
    if (!acc[key]) acc[key] = { name: key, pass: 0, fail: 0, total: 0, threat: s.is_threat }
    acc[key].pass += s.dmarc_pass ? s.count : 0
    acc[key].fail += !s.dmarc_pass ? s.count : 0
    acc[key].total += s.count
    return acc
  }, {})
  const topSources = Object.values(sourcesByService).sort((a, b) => b.total - a.total).slice(0, 10)

  const countryData = sources.reduce((acc, s) => {
    if (!s.source_country) return acc
    if (!acc[s.source_country]) acc[s.source_country] = { country: s.source_country, code: s.source_country_code, total: 0, threats: 0 }
    acc[s.source_country].total += s.count
    if (s.is_threat) acc[s.source_country].threats += s.count
    return acc
  }, {})
  const topCountries = Object.values(countryData).sort((a, b) => b.total - a.total).slice(0, 10)

  const hasData = stats.length > 0 || sources.length > 0

  return (
    <div style={{ background:D.bg, minHeight:'100%', padding:20, fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* RUA setup banner */}
      <div style={{ ...card, marginBottom:16, padding:'14px 18px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <Info size={16} color="#818cf8" style={{ flexShrink:0, marginTop:2 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#a5b4fc', marginBottom:4 }}>Set up DMARC aggregate reports</div>
            <div style={{ fontSize:12, color:D.muted, lineHeight:1.6 }}>
              Add this address as your DMARC <code style={{ background:'rgba(255,255,255,0.06)', padding:'1px 6px', borderRadius:4, fontFamily:'monospace' }}>rua=</code> tag to receive daily reports from mail servers worldwide:
            </div>
            <div style={{ marginTop:8, padding:'7px 12px', background:'rgba(0,0,0,0.3)', borderRadius:7, fontFamily:'monospace', fontSize:12, color:'#10b981', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span>rua=mailto:{rua}</span>
              <button onClick={() => navigator.clipboard.writeText(`rua=mailto:${rua}`)}
                style={{ padding:'3px 10px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:5, color:'#10b981', fontSize:10, cursor:'pointer' }}>Copy</button>
            </div>
            <div style={{ fontSize:11, color:D.dim, marginTop:6 }}>Or upload an XML report manually below</div>
          </div>
          {/* Manual upload */}
          <div style={{ flexShrink:0 }}>
            <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:8, color:'#818cf8', fontSize:12, fontWeight:500, cursor:'pointer' }}>
              {uploading ? <><div style={{ width:12, height:12, border:'2px solid rgba(129,140,248,0.3)', borderTopColor:'#818cf8', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Parsing…</> : <><Upload size={12}/> Upload XML</>}
              <input type="file" accept=".xml,.gz" onChange={handleXMLUpload} style={{ display:'none' }} disabled={uploading}/>
            </label>
          </div>
        </div>
        {uploadResult && (
          <div style={{ marginTop:10, padding:'8px 12px', borderRadius:7, background:uploadResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border:`1px solid ${uploadResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, fontSize:12, color:uploadResult.success ? '#10b981' : '#ef4444' }}>
            {uploadResult.success ? `✓ Parsed: ${uploadResult.total_volume?.toLocaleString()} emails — ${uploadResult.pass_count?.toLocaleString()} passed, ${uploadResult.fail_count?.toLocaleString()} failed, ${uploadResult.sources} sources` : `✗ Error: ${uploadResult.error}`}
          </div>
        )}
      </div>

      {!hasData ? (
        <div style={{ ...card, padding:'60px 20px', textAlign:'center' }}>
          <Mail size={48} color="rgba(255,255,255,0.08)" style={{ marginBottom:16 }}/>
          <div style={{ fontSize:16, fontWeight:600, color:D.muted, marginBottom:8 }}>No DMARC reports yet</div>
          <div style={{ fontSize:13, color:D.dim }}>Add the rua= address to your DMARC record above and reports will appear here automatically once mail servers start sending them (usually within 24 hours).</div>
        </div>
      ) : (
        <>
          {/* Sub tabs */}
          <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${D.border}`, marginBottom:16 }}>
            {['overview','sources','countries','reports'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding:'8px 16px', background:'transparent', border:'none', borderBottom:`2px solid ${activeTab===t?'#6366f1':'transparent'}`, cursor:'pointer', fontSize:12, fontWeight:activeTab===t?600:400, color:activeTab===t?'#818cf8':D.muted, textTransform:'capitalize', transition:'all 0.15s', marginBottom:-1 }}>
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <>
              {/* KPI row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
                {[
                  { label:'Total email volume', val:totalVol.toLocaleString(), color:'#a78bfa', sub:'emails tracked' },
                  { label:'Compliance rate', val:`${complianceRate}%`, color:complianceRate>=90?'#10b981':complianceRate>=70?'#f59e0b':'#ef4444', sub:'passed DMARC' },
                  { label:'Failing emails', val:totalFail.toLocaleString(), color:totalFail>0?'#ef4444':'#10b981', sub:'authentication failed' },
                  { label:'Threats blocked', val:totalThreat.toLocaleString(), color:totalThreat>0?'#ef4444':'#10b981', sub:'unauthorised senders' },
                ].map(k => (
                  <div key={k.label} style={{ ...card, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, color:D.muted, marginBottom:4 }}>{k.label}</div>
                    <div style={{ fontSize:24, fontWeight:700, color:k.color, lineHeight:1 }}>{k.val}</div>
                    <div style={{ fontSize:10, color:D.dim, marginTop:4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Compliance donut + area chart */}
              <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:14, marginBottom:16 }}>
                <div style={{ ...card, padding:'16px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ fontSize:11, color:D.muted, marginBottom:10 }}>Compliance breakdown</div>
                  <PieChart width={160} height={160}>
                    <Pie data={[{ name:'Pass', value:totalPass }, { name:'Fail', value:totalFail }]} cx={80} cy={80} innerRadius={50} outerRadius={72} startAngle={90} endAngle={-270} dataKey="value">
                      <Cell fill="#10b981"/>
                      <Cell fill="#ef4444"/>
                    </Pie>
                  </PieChart>
                  <div style={{ display:'flex', gap:12, fontSize:10, marginTop:4 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:4, color:D.muted }}><div style={{ width:8, height:8, borderRadius:'50%', background:'#10b981' }}/> Pass</span>
                    <span style={{ display:'flex', alignItems:'center', gap:4, color:D.muted }}><div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444' }}/> Fail</span>
                  </div>
                </div>
                <div style={{ ...card, padding:'14px 16px' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:D.text, marginBottom:12 }}>Email volume over time</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                      <defs>
                        <linearGradient id="gPass" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gFail" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                      <XAxis dataKey="date" tick={{ fill:'rgba(255,255,255,0.25)', fontSize:9 }} axisLine={false} tickLine={false}/>
                      <YAxis tick={{ fill:'rgba(255,255,255,0.25)', fontSize:9 }} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="pass" name="Pass" stroke="#10b981" strokeWidth={2} fill="url(#gPass)"/>
                      <Area type="monotone" dataKey="fail" name="Fail" stroke="#ef4444" strokeWidth={1.5} fill="url(#gFail)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top sources quick view */}
              {topSources.length > 0 && (
                <div style={card}>
                  <div style={cardHd}>
                    <span style={{ fontSize:12, fontWeight:600, color:D.text }}>Top sending sources</span>
                    <button onClick={() => setActiveTab('sources')} style={{ fontSize:11, color:'#6366f1', background:'none', border:'none', cursor:'pointer' }}>View all →</button>
                  </div>
                  {topSources.slice(0,5).map((s, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 16px', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                      <div style={{ width:28, height:28, borderRadius:7, background:s.threat?'rgba(239,68,68,0.15)':'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {s.threat ? <AlertTriangle size={13} color="#ef4444"/> : <CheckCircle size={13} color="#10b981"/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:D.text }}>{s.name}</div>
                        <div style={{ fontSize:10, color:D.dim }}>{s.total.toLocaleString()} emails</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:600, color:s.fail>0?'#ef4444':'#10b981' }}>
                        {Math.round((s.pass/s.total)*100)}% pass
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'sources' && (
            <div style={card}>
              <div style={cardHd}><span style={{ fontSize:12, fontWeight:600, color:D.text }}>All sending sources</span><span style={{ fontSize:11, color:D.muted }}>{topSources.length} unique</span></div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                      {['Source','Emails','Pass','Fail','Rate','Threat'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'8px 14px', fontSize:10, fontWeight:600, color:D.muted, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${D.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topSources.map((s, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                        <td style={{ padding:'9px 14px', color:D.text, fontWeight:500 }}>{s.name}</td>
                        <td style={{ padding:'9px 14px', fontFamily:'monospace', color:D.muted }}>{s.total.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px', color:'#10b981', fontFamily:'monospace' }}>{s.pass.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px', color:s.fail>0?'#ef4444':D.muted, fontFamily:'monospace' }}>{s.fail.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden', maxWidth:80 }}>
                              <div style={{ height:'100%', width:`${Math.round((s.pass/s.total)*100)}%`, background:s.fail>0?'#f59e0b':'#10b981', borderRadius:3 }}/>
                            </div>
                            <span style={{ fontSize:11, color:D.muted, width:32 }}>{Math.round((s.pass/s.total)*100)}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'9px 14px' }}>
                          {s.threat ? <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:'rgba(239,68,68,0.15)', color:'#ef4444' }}>Threat</span>
                            : <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:'rgba(16,185,129,0.1)', color:'#10b981' }}>Legit</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'countries' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={card}>
                <div style={cardHd}><span style={{ fontSize:12, fontWeight:600, color:D.text }}>Email by country</span></div>
                {topCountries.map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 16px', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                    <span style={{ fontSize:18 }}>{getFlag(c.code)}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:D.text }}>{c.country}</div>
                      <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, marginTop:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.round((c.total/totalVol)*100)}%`, background:c.threats>0?'#ef4444':'#3b82f6', borderRadius:2 }}/>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:12, fontWeight:600, color:D.text }}>{c.total.toLocaleString()}</div>
                      {c.threats > 0 && <div style={{ fontSize:10, color:'#ef4444' }}>{c.threats} threats</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={cardHd}><span style={{ fontSize:12, fontWeight:600, color:D.text }}>Country volume chart</span></div>
                <div style={{ padding:'14px 8px' }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topCountries.slice(0,8)} layout="vertical" margin={{ top:0, right:16, bottom:0, left:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                      <XAxis type="number" tick={{ fill:'rgba(255,255,255,0.25)', fontSize:9 }} axisLine={false} tickLine={false}/>
                      <YAxis dataKey="country" type="category" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} axisLine={false} tickLine={false} width={80}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[0,4,4,0]}/>
                      <Bar dataKey="threats" name="Threats" fill="#ef4444" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={card}>
              <div style={cardHd}><span style={{ fontSize:12, fontWeight:600, color:D.text }}>DMARC aggregate reports received</span><span style={{ fontSize:11, color:D.muted }}>{reports.length} reports</span></div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                      {['Date','Sender','Volume','Pass','Fail','Policy'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'8px 14px', fontSize:10, fontWeight:600, color:D.muted, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${D.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                        <td style={{ padding:'9px 14px', fontFamily:'monospace', color:D.muted, fontSize:11 }}>{r.report_date}</td>
                        <td style={{ padding:'9px 14px', color:D.text, fontWeight:500 }}>{r.org_name || '–'}</td>
                        <td style={{ padding:'9px 14px', fontFamily:'monospace', color:D.muted }}>{r.total_volume?.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px', color:'#10b981', fontFamily:'monospace' }}>{r.pass_count?.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px', color:r.fail_count>0?'#ef4444':D.muted, fontFamily:'monospace' }}>{r.fail_count?.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px' }}><span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:'rgba(255,255,255,0.06)', color:D.muted, fontFamily:'monospace' }}>p={r.policy_p||'–'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function getFlag(code) {
  if (!code) return '🌐'
  const flags = { US:'🇺🇸',GB:'🇬🇧',DE:'🇩🇪',FR:'🇫🇷',IN:'🇮🇳',CN:'🇨🇳',JP:'🇯🇵',RU:'🇷🇺',BR:'🇧🇷',CA:'🇨🇦',AU:'🇦🇺',NL:'🇳🇱',SG:'🇸🇬',KR:'🇰🇷',IT:'🇮🇹',ES:'🇪🇸',PL:'🇵🇱',SE:'🇸🇪',NO:'🇳🇴',CH:'🇨🇭' }
  return flags[code] || '🌐'
}
