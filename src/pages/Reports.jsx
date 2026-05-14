import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Upload, AlertTriangle, CheckCircle, ShieldOff, Globe, Mail } from 'lucide-react'

const D = { bg:'#0f1117', s:'#16191f', s2:'#1c2028', b:'rgba(255,255,255,0.08)', t:'#f1f5ff', m:'#8b95b0', d:'rgba(255,255,255,0.28)' }
const card = { background:D.s, border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' }
const cardHd = { padding:'11px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', background:D.s2 }

const TTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1c2028', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', fontSize:11 }}>
      <div style={{ color:'#8b95b0', marginBottom:5 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color, marginBottom:2 }}>{p.name}: {p.value?.toLocaleString()}</div>)}
    </div>
  )
}

export default function Reports({ user }) {
  const [domains, setDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [reports, setReports] = useState([])
  const [sources, setSources] = useState([])
  const [dailyStats, setDailyStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadXML, setUploadXML] = useState(false)
  const [xmlInput, setXmlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    supabase.from('domains').select('id,domain_name').eq('user_id', user.id).then(({data})=>{
      setDomains(data||[])
      if (data?.length) setSelectedDomain(data[0].id)
    })
  }, [])

  useEffect(() => { if (selectedDomain) loadData() }, [selectedDomain])

  async function loadData() {
    setLoading(true)
    const [rRes, sRes, dRes] = await Promise.all([
      supabase.from('dmarc_reports').select('*').eq('domain_id', selectedDomain).order('report_date', { ascending:false }).limit(30),
      supabase.from('dmarc_sources').select('*').eq('domain_id', selectedDomain).order('count', { ascending:false }).limit(100),
      supabase.from('dmarc_daily_stats').select('*').eq('domain_id', selectedDomain).order('stat_date', { ascending:true }).limit(30),
    ])
    setReports(rRes.data||[])
    setSources(sRes.data||[])
    setDailyStats(dRes.data||[])
    setLoading(false)
  }

  async function uploadReport() {
    if (!xmlInput.trim() || !selectedDomain) return
    setUploading(true)
    const domain = domains.find(d=>d.id===selectedDomain)
    const res = await supabase.functions.invoke('parse-dmarc', {
      body: { xml: xmlInput, user_id: user.id, domain_name: domain?.domain_name || '' }
    })
    if (res.data?.success) {
      setUploadMsg(`✓ Parsed: ${res.data.total_volume} emails, ${res.data.sources} sources`)
      setXmlInput(''); setUploadXML(false); loadData()
    } else {
      setUploadMsg('✗ ' + (res.data?.error || 'Parse failed'))
    }
    setUploading(false)
    setTimeout(()=>setUploadMsg(''),5000)
  }

  // Aggregate stats
  const totalVolume = reports.reduce((a,r) => a + (r.total_volume||0), 0)
  const totalPass = reports.reduce((a,r) => a + (r.pass_count||0), 0)
  const totalFail = reports.reduce((a,r) => a + (r.fail_count||0), 0)
  const complianceRate = totalVolume > 0 ? Math.round((totalPass/totalVolume)*100) : 0
  const threats = sources.filter(s => s.is_threat)
  const topSources = [...sources].sort((a,b)=>b.count-a.count).slice(0,10)

  // By sender name
  const byService = sources.reduce((acc, s) => {
    const name = s.service_name || s.source_org || s.source_hostname || s.source_ip
    if (!acc[name]) acc[name] = { name, count:0, pass:0, fail:0 }
    acc[name].count += s.count
    if (s.dmarc_pass) acc[name].pass += s.count
    else acc[name].fail += s.count
    return acc
  }, {})
  const serviceList = Object.values(byService).sort((a,b)=>b.count-a.count).slice(0,8)

  const pieData = [
    { name:'Compliant', value:totalPass, color:'#10e898' },
    { name:'Failing', value:totalFail, color:'#ff5757' },
  ].filter(d=>d.value>0)

  const chartData = dailyStats.map(d => ({
    date: new Date(d.stat_date).toLocaleDateString('en-GB', {month:'short',day:'numeric'}),
    compliant: d.pass_count,
    failing: d.fail_count,
    threats: d.threat_count,
  }))

  return (
    <div style={{ background:D.bg, minHeight:'100%', padding:20, fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:17, fontWeight:700, color:D.t, marginBottom:4 }}>DMARC reports</h2>
          <p style={{ fontSize:12, color:D.m }}>Aggregate reports from mail servers showing who sends email from your domain</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {domains.length > 1 && (
            <select value={selectedDomain} onChange={e=>setSelectedDomain(e.target.value)}
              style={{ padding:'7px 12px', background:D.s, border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, fontSize:12, color:D.t, outline:'none' }}>
              {domains.map(d=><option key={d.id} value={d.id}>{d.domain_name}</option>)}
            </select>
          )}
          <button onClick={()=>setUploadXML(u=>!u)}
            style={{ padding:'7px 14px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, color:'#10e898', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
            <Upload size={13}/> Upload XML report
          </button>
        </div>
      </div>

      {/* XML upload panel */}
      {uploadXML && (
        <div style={{ ...card, marginBottom:14 }}>
          <div style={{ ...cardHd }}><span style={{ fontSize:12, fontWeight:600, color:D.t }}>Upload DMARC aggregate report (XML)</span></div>
          <div style={{ padding:14 }}>
            <div style={{ fontSize:11, color:D.m, marginBottom:10, lineHeight:1.6 }}>
              Paste the raw XML content from a DMARC aggregate report. Mail servers (Google, Microsoft, Yahoo) send these to the <code style={{ fontFamily:'monospace', color:'#10e898' }}>rua=</code> address in your DMARC record. Add <code style={{ fontFamily:'monospace', color:'#10e898' }}>rua=mailto:reports@dnsradar.easysecurity.in</code> to your DMARC record to receive them automatically.
            </div>
            <textarea value={xmlInput} onChange={e=>setXmlInput(e.target.value)} rows={8} placeholder="<?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot; ?><feedback>..."
              style={{ width:'100%', padding:'10px 12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, fontSize:11, color:D.t, outline:'none', resize:'vertical', fontFamily:'monospace', lineHeight:1.5 }}/>
            {uploadMsg && <div style={{ padding:'6px 10px', borderRadius:6, background:uploadMsg.startsWith('✓')?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color:uploadMsg.startsWith('✓')?'#10e898':'#ff5757', fontSize:12, margin:'8px 0' }}>{uploadMsg}</div>}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button onClick={uploadReport} disabled={uploading||!xmlInput}
                style={{ padding:'7px 16px', background:'#10e898', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer', opacity:!xmlInput?0.5:1 }}>
                {uploading?'Parsing…':'Parse & import'}
              </button>
              <button onClick={()=>{setUploadXML(false);setXmlInput('')}} style={{ padding:'7px 14px', background:'rgba(255,255,255,0.08)', color:D.m, border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, fontSize:12, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:'48px', color:D.m }}>Loading report data…</div>
      ) : reports.length === 0 ? (
        <div style={{ ...card, padding:'48px', textAlign:'center' }}>
          <Mail size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom:16 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:D.t, marginBottom:8 }}>No DMARC reports yet</div>
          <div style={{ fontSize:13, color:D.m, maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>
            To receive aggregate reports automatically, add this to your DMARC record:
          </div>
          <div style={{ fontFamily:'monospace', fontSize:12, color:'#10e898', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'10px 16px', margin:'12px auto', maxWidth:480, textAlign:'left' }}>
            rua=mailto:reports@dnsradar.easysecurity.in
          </div>
          <div style={{ fontSize:12, color:D.d }}>Or upload an existing XML report above to get started immediately.</div>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:14 }}>
            {[
              { l:'Total emails', v:totalVolume.toLocaleString(), c:D.t, sub:'across all reports' },
              { l:'Compliance rate', v:`${complianceRate}%`, c:complianceRate>=90?'#10e898':complianceRate>=70?'#ffad30':'#ff5757', sub:`${totalPass.toLocaleString()} passing` },
              { l:'Failing', v:totalFail.toLocaleString(), c:totalFail>0?'#ff5757':'#10e898', sub:'emails failing DMARC' },
              { l:'Threats detected', v:threats.length, c:threats.length>0?'#ff5757':'#10e898', sub:'unauthorised sources' },
            ].map(k=>(
              <div key={k.l} style={{ ...card, padding:'13px 16px' }}>
                <div style={{ fontSize:11, color:D.m, marginBottom:4 }}>{k.l}</div>
                <div style={{ fontSize:24, fontWeight:700, color:k.c, lineHeight:1 }}>{k.v}</div>
                <div style={{ fontSize:10, color:D.d, marginTop:4 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Volume trend + compliance donut */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14, marginBottom:14 }}>
            <div style={{ ...card, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:D.t, marginBottom:12 }}>Email volume over time</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-20 }}>
                  <defs>
                    <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                  <XAxis dataKey="date" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'rgba(255,255,255,0.3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TTip/>}/>
                  <Area type="monotone" dataKey="compliant" name="Compliant" stroke="#10b981" strokeWidth={2} fill="url(#gc)"/>
                  <Area type="monotone" dataKey="failing" name="Failing" stroke="#ef4444" strokeWidth={2} fill="url(#gf)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {pieData.length > 0 && (
              <div style={{ ...card, padding:'14px 16px', minWidth:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontSize:12, fontWeight:600, color:D.t, marginBottom:8 }}>Compliance split</div>
                <PieChart width={160} height={160}>
                  <Pie data={pieData} cx={80} cy={80} innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v)=>v.toLocaleString()}/>
                </PieChart>
                <div style={{ display:'flex', gap:12, fontSize:10 }}>
                  {pieData.map(p=><span key={p.name} style={{ display:'flex', alignItems:'center', gap:4, color:D.m }}><span style={{ width:8,height:8,borderRadius:'50%',background:p.color,display:'inline-block' }}/>{p.name}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Sending sources */}
          <div style={{ ...card, marginBottom:14 }}>
            <div style={{ ...cardHd }}>
              <span style={{ fontSize:12, fontWeight:600, color:D.t }}>Sending sources</span>
              <span style={{ fontSize:11, color:D.m }}>{serviceList.length} sources</span>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ background:'rgba(255,255,255,0.02)' }}>
                  {['Source','Volume','Compliant','Failing','Rate','Status'].map(h=>(
                    <th key={h} style={{ textAlign:'left', padding:'7px 14px', fontSize:10, fontWeight:600, color:D.m, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {serviceList.map((s,i)=>{
                    const rate = s.count > 0 ? Math.round((s.pass/s.count)*100) : 0
                    const isKnown = s.name !== sources.find(src=>src.source_ip===s.name)?.source_ip
                    return (
                      <tr key={i} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                        <td style={{ padding:'9px 14px' }}>
                          <div style={{ fontSize:12, fontWeight:500, color:D.t }}>{s.name}</div>
                        </td>
                        <td style={{ padding:'9px 14px', fontFamily:'monospace', color:D.t, fontWeight:600 }}>{s.count.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px', color:'#10e898', fontFamily:'monospace' }}>{s.pass.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px', color:s.fail>0?'#ff5757':D.d, fontFamily:'monospace' }}>{s.fail.toLocaleString()}</td>
                        <td style={{ padding:'9px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ height:5, width:60, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${rate}%`, background:rate>=90?'#10e898':rate>=70?'#ffad30':'#ff5757', borderRadius:3 }}/>
                            </div>
                            <span style={{ fontSize:11, color:rate>=90?'#10e898':rate>=70?'#ffad30':'#ff5757', fontWeight:600 }}>{rate}%</span>
                          </div>
                        </td>
                        <td style={{ padding:'9px 14px' }}>
                          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:`rgba(${s.fail>0&&rate<50?'239,68,68':'16,185,129'},0.15)`, color:s.fail>0&&rate<50?'#ff5757':'#10e898' }}>
                            {s.fail>0&&rate<50?'Threat':'Legitimate'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report list */}
          <div style={card}>
            <div style={{ ...cardHd }}><span style={{ fontSize:12, fontWeight:600, color:D.t }}>Individual reports ({reports.length})</span></div>
            {reports.map(r=>(
              <div key={r.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 16px', borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:D.t }}>{r.org_name || 'Unknown sender'}</div>
                  <div style={{ fontSize:10, color:D.d }}>{r.report_date} · {r.email}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:D.t }}>{(r.total_volume||0).toLocaleString()} emails</div>
                  <div style={{ fontSize:10, color:r.fail_count>0?'#ff5757':'#10e898' }}>
                    {r.pass_count||0} pass · {r.fail_count||0} fail
                  </div>
                </div>
                <div style={{ width:48, textAlign:'right', fontSize:12, fontWeight:700, color:r.total_volume>0?Math.round((r.pass_count/r.total_volume)*100)>=90?'#10e898':'#ffad30':D.d }}>
                  {r.total_volume > 0 ? Math.round((r.pass_count/r.total_volume)*100)+'%' : '–'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
