import { useState, useEffect, useRef } from 'react'
import { Plus, Globe, Trash2, RefreshCw, ExternalLink, Shield, Pause, Play, Clock, Mail, Lock, Ban, AlertTriangle, CheckCircle, ChevronRight, Zap, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddDomainModal from '../components/AddDomainModal'
import { timeAgo, getScoreColor } from '../lib/scoreEngine'

// ─── Gauge SVG ────────────────────────────────────────────────────────
function Gauge({ score, size = 140 }) {
  const r = size * 0.38
  const cx = size / 2, cy = size * 0.56
  const startAngle = -210, endAngle = 30
  const totalArc = endAngle - startAngle
  const pct = Math.min(Math.max((score || 0) / 100, 0), 1)
  const angle = startAngle + totalArc * pct
  const toRad = a => (a * Math.PI) / 180
  const arcPath = (sa, ea, radius) => {
    const x1 = cx + radius * Math.cos(toRad(sa))
    const y1 = cy + radius * Math.sin(toRad(sa))
    const x2 = cx + radius * Math.cos(toRad(ea))
    const y2 = cy + radius * Math.sin(toRad(ea))
    const large = (ea - sa) > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }
  const needleX = cx + r * 0.72 * Math.cos(toRad(angle))
  const needleY = cy + r * 0.72 * Math.sin(toRad(angle))
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const trackColor = score >= 70 ? 'rgba(16,185,129,0.15)' : score >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'
  const label = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Needs work' : 'Critical'
  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      {/* Ticks */}
      {[...Array(11)].map((_, i) => {
        const a = startAngle + (totalArc / 10) * i
        const x1 = cx + (r + 4) * Math.cos(toRad(a)), y1 = cy + (r + 4) * Math.sin(toRad(a))
        const x2 = cx + (r + 10) * Math.cos(toRad(a)), y2 = cy + (r + 10) * Math.sin(toRad(a))
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth={i % 5 === 0 ? 2 : 1}/>
      })}
      {/* Track */}
      <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.07} strokeLinecap="round"/>
      {/* Fill */}
      <path d={arcPath(startAngle, angle, r)} fill="none" stroke={color} strokeWidth={size*0.07} strokeLinecap="round"
        style={{ filter:`drop-shadow(0 0 6px ${color}60)` }}/>
      {/* Center glow */}
      <circle cx={cx} cy={cy} r={r * 0.4} fill={trackColor}/>
      {/* Score */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize={size * 0.22} fontWeight="600" fontFamily="system-ui">{score ?? '–'}</text>
      <text x={cx} y={cy + size*0.1} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={size * 0.095} fontFamily="system-ui">{label}</text>
      {/* Needle */}
      <circle cx={needleX} cy={needleY} r={3} fill={color} style={{ filter:`drop-shadow(0 0 4px ${color})` }}/>
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.7}/>
      <circle cx={cx} cy={cy} r={4} fill={color} opacity={0.5}/>
      {/* Labels */}
      <text x={cx + (r+14)*Math.cos(toRad(startAngle))} y={cy + (r+14)*Math.sin(toRad(startAngle))+4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={size*0.075} fontFamily="system-ui">0</text>
      <text x={cx + (r+14)*Math.cos(toRad(endAngle))} y={cy + (r+14)*Math.sin(toRad(endAngle))+4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize={size*0.075} fontFamily="system-ui">100</text>
    </svg>
  )
}

// ─── Animated bar ─────────────────────────────────────────────────────
function AnimBar({ pct, color, delay = 0, height = 6 }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 100 + delay); return () => clearTimeout(t) }, [pct])
  return (
    <div style={{ height, background: 'rgba(255,255,255,0.06)', borderRadius: height/2, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: height/2, width: `${w}%`, background: color, transition: 'width 1s cubic-bezier(.4,0,.2,1)', boxShadow: `0 0 8px ${color}60` }}/>
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────
function Sparkline({ values, color, width = 80, height = 28 }) {
  if (!values?.length) return null
  const max = Math.max(...values), min = Math.min(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <circle cx={values.map((_,i)=>(i/(values.length-1))*width).at(-1)} cy={height-((values.at(-1)-min)/range)*(height-4)-2} r="2.5" fill={color}/>
    </svg>
  )
}

// ─── Radar chart ─────────────────────────────────────────────────────
function RadarChart({ scores, size = 180 }) {
  const cats = ['DNS','Email','SSL','Prop','Sec','BL']
  const vals = [scores?.score_dns/25, scores?.score_email/30, scores?.score_ssl/20, scores?.score_propagation/10, scores?.score_security/10, scores?.score_blacklist/5].map(v => v||0)
  const n = cats.length
  const cx = size/2, cy = size/2, r = size*0.36
  const angle = i => (i * 2 * Math.PI / n) - Math.PI/2
  const pt = (i, frac) => ({ x: cx + r * frac * Math.cos(angle(i)), y: cy + r * frac * Math.sin(angle(i)) })
  const gridLevels = [0.25, 0.5, 0.75, 1]
  const dataPath = vals.map((v,i) => { const p = pt(i, v); return `${i===0?'M':'L'}${p.x},${p.y}` }).join(' ') + 'Z'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridLevels.map(lvl => (
        <polygon key={lvl} points={[...Array(n)].map((_,i) => { const p = pt(i,lvl); return `${p.x},${p.y}` }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      ))}
      {/* Axes */}
      {[...Array(n)].map((_,i) => {
        const p = pt(i,1)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      })}
      {/* Data fill */}
      <path d={dataPath} fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round"/>
      {/* Data points */}
      {vals.map((v,i) => {
        const p = pt(i,v)
        return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" style={{ filter:'drop-shadow(0 0 4px #10b98180)' }}/>
      })}
      {/* Labels */}
      {cats.map((cat,i) => {
        const p = pt(i, 1.22)
        const score = [scores?.score_dns,scores?.score_email,scores?.score_ssl,scores?.score_propagation,scores?.score_security,scores?.score_blacklist][i]
        return (
          <g key={cat}>
            <text x={p.x} y={p.y-3} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="system-ui">{cat}</text>
            <text x={p.x} y={p.y+8} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9" fontWeight="600" fontFamily="system-ui">{score??0}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Delete modal ─────────────────────────────────────────────────────
function DeleteModal({ domain, onConfirm, onCancel, loading }) {
  return (
    <div onClick={e => e.target===e.currentTarget&&onCancel()}
      style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#1a1f2e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,width:'100%',maxWidth:400,margin:'0 16px',padding:24 }}>
        <div style={{ fontSize:16,fontWeight:600,color:'#fff',marginBottom:8 }}>Delete domain?</div>
        <div style={{ fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:20 }}>
          Permanently delete <span style={{ color:'#ef4444',fontFamily:'monospace' }}>{domain?.domain_name}</span> and all data.
        </div>
        <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'8px 16px',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,cursor:'pointer',fontSize:13 }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding:'8px 16px',background:'#ef4444',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500 }}>
            {loading?'Deleting…':'Delete forever'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────
export default function Dashboard({ user, setPage, setScanDomain, setScanType }) {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [scanning, setScanning] = useState({})
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => { if (user) fetchDomains() }, [user])

  async function fetchDomains() {
    setLoading(true)
    const { data } = await supabase.from('domains')
      .select(`*, scan_results(health_score,score_dns,score_email,score_ssl,score_propagation,score_security,score_blacklist,email_auth,ssl_info,security,propagation,blacklists,issues,dns_records,scanned_at)`)
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setDomains(data || [])
    if (data?.length && !selected) setSelected(data[0])
    setLoading(false)
  }

  async function triggerScan(domain) {
    setScanning(s => ({ ...s, [domain.id]: true }))
    try {
      await supabase.functions.invoke('dns-scan', { body: { domain: domain.domain_name, scan_type: 'website', save_to_db: true, domain_id: domain.id } })
      await fetchDomains()
    } finally { setScanning(s => ({ ...s, [domain.id]: false })) }
  }

  async function confirmDelete() {
    setDeleteLoading(true)
    await supabase.from('domains').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    if (selected?.id === deleteTarget.id) setSelected(null)
    fetchDomains()
  }

  async function updateInterval(domainId, interval) {
    await supabase.from('domains').update({ monitor_interval: interval }).eq('id', domainId)
    fetchDomains()
  }

  const scan = selected?.scan_results?.[0]
  const issues = scan?.issues || []
  const critical = issues.filter(i => i.severity === 'critical')
  const warns = issues.filter(i => i.severity === 'warn')

  const catData = scan ? [
    { label:'DNS', icon:'🌐', score:scan.score_dns, max:25, color:'#378ADD' },
    { label:'Email auth', icon:'📧', score:scan.score_email, max:30, color:'#ef4444' },
    { label:'SSL/TLS', icon:'🔒', score:scan.score_ssl, max:20, color:'#10b981' },
    { label:'Propagation', icon:'🌍', score:scan.score_propagation, max:10, color:'#f59e0b' },
    { label:'Security', icon:'🛡', score:scan.score_security, max:10, color:'#a78bfa' },
    { label:'Blacklists', icon:'🚫', score:scan.score_blacklist, max:5, color:'#ef4444' },
  ] : []

  // dark theme vars
  const D = {
    bg: '#0d1117',
    surface: '#161b22',
    surface2: '#1c2333',
    border: 'rgba(255,255,255,0.07)',
    text: '#fff',
    muted: 'rgba(255,255,255,0.45)',
    dim: 'rgba(255,255,255,0.2)',
  }

  const card = {
    background: D.surface,
    border: `1px solid ${D.border}`,
    borderRadius: 12,
    overflow: 'hidden',
  }

  const tabs = ['overview','email','ssl','propagation','blacklists','dns']

  return (
    <div style={{ display:'flex', height:'calc(100vh - 56px)', background: D.bg, fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        .db-sidebar-row { transition: background 0.15s; }
        .db-sidebar-row:hover { background: rgba(255,255,255,0.05) !important; }
        .db-tab { transition: all 0.15s; }
        .db-tab:hover { color: rgba(255,255,255,0.8) !important; }
        .db-issue-row { transition: background 0.15s; }
        .db-issue-row:hover { background: rgba(255,255,255,0.03) !important; }
        .db-scan-card { transition: all 0.2s; }
        .db-scan-card:hover { border-color: rgba(16,185,129,0.4) !important; transform: translateY(-1px); }
        .db-action-btn { transition: all 0.15s; }
        .db-action-btn:hover { background: rgba(255,255,255,0.08) !important; }
        @keyframes db-glow { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes db-spin { to{transform:rotate(360deg)} }
        .db-pulse { animation: db-glow 2s ease infinite; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ width:220,flexShrink:0,background:D.surface,borderRight:`1px solid ${D.border}`,display:'flex',flexDirection:'column' }}>
        <div style={{ padding:12,borderBottom:`1px solid ${D.border}` }}>
          <button onClick={() => setShowAdd(true)}
            style={{ width:'100%',padding:'8px 12px',background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:8,color:'#10b981',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6,justifyContent:'center' }}>
            <Plus size={14}/> Add domain
          </button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'8px 0' }}>
          <div style={{ fontSize:10,fontWeight:600,color:D.dim,textTransform:'uppercase',letterSpacing:'0.08em',padding:'4px 14px 6px' }}>Domains</div>
          {loading ? [...Array(2)].map(i => (
            <div key={i} style={{ margin:'4px 10px',height:44,borderRadius:8,background:'rgba(255,255,255,0.04)' }}/>
          )) : domains.map(d => {
            const s = d.scan_results?.[0]
            const score = s?.health_score
            const isActive = selected?.id === d.id
            const sc = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
            const issues = s?.issues?.filter(i=>i.severity==='critical').length || 0
            return (
              <div key={d.id} className="db-sidebar-row" onClick={() => { setSelected(d); setActiveTab('overview') }}
                style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',cursor:'pointer',background:isActive?'rgba(16,185,129,0.08)':'transparent',borderLeft:`2px solid ${isActive?'#10b981':'transparent'}` }}>
                <div style={{ width:7,height:7,borderRadius:'50%',background:d.paused?'rgba(255,255,255,0.2)':!d.verified?'#f59e0b':sc,flexShrink:0,...(!d.paused&&d.verified&&{boxShadow:`0 0 6px ${sc}80`}) }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:500,color:D.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{d.domain_name}</div>
                  <div style={{ fontSize:10,color:D.muted }}>
                    {!d.verified?'Pending':d.paused?'Paused':`${issues>0?`${issues} critical · `:''}${d.monitor_interval}`}
                  </div>
                </div>
                {score != null && <span style={{ fontSize:13,fontWeight:600,color:sc }}>{score}</span>}
                <div onClick={e=>{e.stopPropagation();setDeleteTarget(d)}} style={{ color:'rgba(255,255,255,0.2)',cursor:'pointer',padding:2 }}><Trash2 size={11}/></div>
              </div>
            )
          })}
        </div>
        {/* Fleet summary */}
        {domains.length > 0 && (
          <div style={{ padding:'10px 14px',borderTop:`1px solid ${D.border}` }}>
            <div style={{ fontSize:10,color:D.dim,marginBottom:6 }}>Fleet avg score</div>
            {(() => {
              const avg = Math.round(domains.filter(d=>d.scan_results?.[0]).reduce((a,d)=>a+(d.scan_results[0].health_score||0),0) / Math.max(domains.filter(d=>d.scan_results?.[0]).length,1))
              const c = avg >= 70 ? '#10b981' : avg >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <>
                  <div style={{ fontSize:22,fontWeight:600,color:c,lineHeight:1,marginBottom:6 }}>{isNaN(avg)?'–':avg}</div>
                  <AnimBar pct={isNaN(avg)?0:avg} color={c} height={4}/>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* ── MAIN PANEL ── */}
      <div style={{ flex:1,overflowY:'auto',background:D.bg }}>
        {!selected ? (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:16 }}>
            <Shield size={56} color="rgba(255,255,255,0.08)"/>
            <div style={{ fontSize:18,fontWeight:500,color:'rgba(255,255,255,0.3)' }}>Add a domain to get started</div>
            <button onClick={()=>setShowAdd(true)} style={{ padding:'10px 24px',background:'#10b981',color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:7 }}>
              <Plus size={15}/> Add your first domain
            </button>
          </div>
        ) : (
          <div>
            {/* ── TOP BAR ── */}
            <div style={{ padding:'14px 20px',borderBottom:`1px solid ${D.border}`,background:D.surface,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
                  <h2 style={{ fontSize:17,fontWeight:600,color:D.text,margin:0 }}>{selected.domain_name}</h2>
                  {selected.verified && <span style={{ fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.25)',fontWeight:500 }}>Verified</span>}
                  {critical.length>0 && <span style={{ fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(239,68,68,0.15)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.25)',fontWeight:500 }}>{critical.length} critical</span>}
                  {warns.length>0 && <span style={{ fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(245,158,11,0.15)',color:'#f59e0b',border:'1px solid rgba(245,158,11,0.25)',fontWeight:500 }}>{warns.length} warnings</span>}
                </div>
                <div style={{ fontSize:11,color:D.muted,display:'flex',gap:14 }}>
                  {scan?.blacklists?.ip&&<span style={{ fontFamily:'monospace',color:'rgba(255,255,255,0.35)' }}>{scan.blacklists.ip}</span>}
                  <span>{selected.monitor_interval} monitoring</span>
                  {scan?.scanned_at&&<span>Scanned {timeAgo(scan.scanned_at)}</span>}
                </div>
              </div>
              <div style={{ display:'flex',gap:8 }}>
                {[
                  {icon:RefreshCw,label:'Scan now',action:()=>triggerScan(selected),primary:true,loading:scanning[selected.id]},
                  {icon:selected.paused?Play:Pause,label:selected.paused?'Resume':'Pause',action:async()=>{await supabase.from('domains').update({paused:!selected.paused}).eq('id',selected.id);fetchDomains()}},
                  {icon:ExternalLink,label:'Full report',action:()=>{setScanDomain(selected.domain_name);setScanType('website');setPage('scan')}},
                ].map(btn => (
                  <button key={btn.label} className="db-action-btn" onClick={btn.action} disabled={btn.loading}
                    style={{ padding:'6px 14px',background:btn.primary?'#10b981':'rgba(255,255,255,0.06)',color:btn.primary?'#fff':'rgba(255,255,255,0.7)',border:`1px solid ${btn.primary?'transparent':'rgba(255,255,255,0.1)'}`,borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:5 }}>
                    {btn.loading?<div style={{ width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'db-spin 0.7s linear infinite' }}/>:<btn.icon size={12}/>}
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── SECTION TABS ── */}
            <div style={{ display:'flex',gap:0,padding:'0 20px',background:D.surface,borderBottom:`1px solid ${D.border}` }}>
              {tabs.map(t => (
                <button key={t} className="db-tab" onClick={()=>setActiveTab(t)}
                  style={{ padding:'10px 16px',background:'transparent',border:'none',borderBottom:`2px solid ${activeTab===t?'#10b981':'transparent'}`,cursor:'pointer',fontSize:12,fontWeight:activeTab===t?500:400,color:activeTab===t?'#10b981':'rgba(255,255,255,0.4)',textTransform:'capitalize',transition:'all 0.15s' }}>
                  {t==='ssl'?'SSL/TLS':t==='dns'?'DNS Records':t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ padding:20,display:'flex',flexDirection:'column',gap:16 }}>

              {/* ═══ OVERVIEW ═══ */}
              {activeTab==='overview' && scan && (
                <>
                  {/* Row 1: Gauge + Radar + KPI cards */}
                  <div style={{ display:'grid',gridTemplateColumns:'200px 200px 1fr',gap:14,alignItems:'stretch' }}>
                    {/* Gauge */}
                    <div style={{ ...card,padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
                      <Gauge score={scan.health_score} size={170}/>
                      <div style={{ fontSize:11,color:D.muted,textAlign:'center',marginTop:4 }}>Overall health score</div>
                    </div>
                    {/* Radar */}
                    <div style={{ ...card,padding:'16px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center' }}>
                      <RadarChart scores={scan} size={170}/>
                      <div style={{ fontSize:11,color:D.muted,textAlign:'center',marginTop:0 }}>Category breakdown</div>
                    </div>
                    {/* KPI grid */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'1fr 1fr',gap:10 }}>
                      {[
                        { label:'Critical issues', val:critical.length, color:'#ef4444', sub:critical.length===0?'All clear':'Fix immediately', icon:'⚠' },
                        { label:'Blacklist listings', val:scan.blacklists?.listed_count??0, color:scan.blacklists?.listed_count>0?'#ef4444':'#10b981', sub:scan.blacklists?.listed_count>0?'Email at risk':'Clean reputation', icon:'🚫' },
                        { label:'DNS records', val:scan.dns_records?.length??0, color:'#378ADD', sub:'Found this domain', icon:'📡' },
                        { label:'Propagation', val:`${[...Object.entries({us:scan.propagation?.records?.every(r=>r.us==='pass'),eu:scan.propagation?.records?.every(r=>r.eu==='pass'),apac:scan.propagation?.records?.every(r=>r.apac==='pass'),au:scan.propagation?.records?.every(r=>r.au==='pass')})].filter(([,v])=>v).length}/4`, color:'#a78bfa', sub:'Regions consistent', icon:'🌍' },
                      ].map(k => (
                        <div key={k.label} style={{ ...card,padding:'14px 16px',display:'flex',flexDirection:'column',justifyContent:'space-between' }}>
                          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                            <div style={{ fontSize:11,color:D.muted }}>{k.label}</div>
                            <span style={{ fontSize:16 }}>{k.icon}</span>
                          </div>
                          <div style={{ fontSize:28,fontWeight:600,color:k.color,lineHeight:1.1,margin:'6px 0 2px' }}>{k.val}</div>
                          <div style={{ fontSize:10,color:D.dim }}>{k.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Category bars */}
                  <div style={{ ...card,padding:'18px 20px' }}>
                    <div style={{ fontSize:13,fontWeight:500,color:D.text,marginBottom:14 }}>Score breakdown by category</div>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px 24px' }}>
                      {catData.map((c,i) => (
                        <div key={c.label}>
                          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                            <span style={{ fontSize:12,color:D.muted }}>{c.icon} {c.label}</span>
                            <span style={{ fontSize:12,fontWeight:600,color:c.color }}>{c.score}<span style={{ fontSize:10,color:D.dim,fontWeight:400 }}>/{c.max}</span></span>
                          </div>
                          <AnimBar pct={Math.round((c.score/c.max)*100)} color={c.color} delay={i*80} height={7}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 3: Issues + Monitor interval */}
                  <div style={{ display:'grid',gridTemplateColumns:'1fr auto',gap:14 }}>
                    <div style={card}>
                      <div style={{ padding:'12px 16px',borderBottom:`1px solid ${D.border}`,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                        <span style={{ fontSize:13,fontWeight:500,color:D.text }}>Issues to fix</span>
                        <div style={{ display:'flex',gap:6 }}>
                          {critical.length>0&&<span style={{ fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(239,68,68,0.15)',color:'#ef4444' }}>{critical.length} critical</span>}
                          {warns.length>0&&<span style={{ fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(245,158,11,0.15)',color:'#f59e0b' }}>{warns.length} warn</span>}
                        </div>
                      </div>
                      {issues.length===0?(
                        <div style={{ padding:'32px',textAlign:'center' }}>
                          <div style={{ fontSize:32,marginBottom:8 }}>✅</div>
                          <div style={{ fontSize:13,color:D.muted }}>All checks passing</div>
                        </div>
                      ):issues.map((iss,i)=>(
                        <div key={i} className="db-issue-row" style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'10px 16px',borderBottom:`1px solid ${D.border}` }}>
                          <div style={{ width:22,height:22,borderRadius:6,background:iss.severity==='critical'?'rgba(239,68,68,0.15)':iss.severity==='warn'?'rgba(245,158,11,0.15)':'rgba(96,165,250,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>
                            <AlertTriangle size={11} color={iss.severity==='critical'?'#ef4444':iss.severity==='warn'?'#f59e0b':'#60a5fa'}/>
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                              <span style={{ fontSize:12,fontWeight:600,color:D.text,fontFamily:'monospace' }}>{iss.type}</span>
                              <span style={{ fontSize:10,padding:'1px 6px',borderRadius:8,background:iss.severity==='critical'?'rgba(239,68,68,0.15)':iss.severity==='warn'?'rgba(245,158,11,0.15)':'rgba(96,165,250,0.15)',color:iss.severity==='critical'?'#ef4444':iss.severity==='warn'?'#f59e0b':'#60a5fa' }}>{iss.severity}</span>
                            </div>
                            <div style={{ fontSize:11,color:D.muted,marginBottom:iss.fix?4:0 }}>{iss.message}</div>
                            {iss.fix&&<div style={{ fontSize:10,fontFamily:'monospace',color:'rgba(16,185,129,0.8)',padding:'3px 8px',background:'rgba(16,185,129,0.06)',borderRadius:5,display:'inline-block',wordBreak:'break-all' }}>{iss.fix}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Monitor interval */}
                    <div style={{ ...card,padding:'16px',minWidth:160,display:'flex',flexDirection:'column',gap:8,alignSelf:'flex-start' }}>
                      <div style={{ fontSize:12,fontWeight:500,color:D.text,marginBottom:4 }}>Monitor interval</div>
                      {['1h','6h','24h','off'].map(iv=>(
                        <button key={iv} onClick={()=>updateInterval(selected.id,iv)}
                          style={{ padding:'8px 16px',background:selected.monitor_interval===iv?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${selected.monitor_interval===iv?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}`,borderRadius:8,color:selected.monitor_interval===iv?'#10b981':'rgba(255,255,255,0.5)',fontSize:12,fontWeight:500,cursor:'pointer',textAlign:'left' }}>
                          {iv==='off'?'Off (manual)':iv==='1h'?'Every hour':iv==='6h'?'Every 6h':'Every 24h'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ═══ EMAIL AUTH ═══ */}
              {activeTab==='email' && scan?.email_auth && (
                <div style={card}>
                  <div style={{ padding:'12px 16px',borderBottom:`1px solid ${D.border}` }}>
                    <span style={{ fontSize:13,fontWeight:500,color:D.text }}>Email authentication analysis</span>
                  </div>
                  {[
                    { name:'SPF',status:scan.email_auth.spf_status,val:scan.email_auth.spf_raw,note:scan.email_auth.spf_fix,lookups:scan.email_auth.spf_lookups },
                    { name:'DKIM',status:scan.email_auth.dkim_status,val:scan.email_auth.dkim_selector?`Selector: ${scan.email_auth.dkim_selector} · ${scan.email_auth.dkim_key_size||'?'}-bit`:null,note:scan.email_auth.dkim_note },
                    { name:'DMARC',status:scan.email_auth.dmarc_status,val:scan.email_auth.dmarc_raw,note:scan.email_auth.dmarc_fix,suggest:scan.email_auth.dmarc_suggestion },
                    { name:'BIMI',status:scan.email_auth.bimi_status||'Missing',val:scan.email_auth.bimi_raw,note:scan.email_auth.bimi_note },
                    { name:'MTA-STS',status:scan.email_auth.mta_sts_status||'Not configured',val:null,note:'TLS required for all inbound mail when enforced.' },
                    { name:'TLS-RPT',status:scan.email_auth.tls_rpt_status||'Not configured',val:null,note:'Enables delivery failure reports via email or HTTPS.' },
                  ].map((r,i)=>{
                    const s=r.status?.toLowerCase()
                    const pass=['pass','configured','enforced','active','detected'].some(p=>s?.includes(p))
                    const fail=['missing','fail','not'].some(p=>s?.includes(p))
                    const sc=pass?'#10b981':fail?'#ef4444':'#f59e0b'
                    return (
                      <div key={r.name} style={{ display:'flex',alignItems:'flex-start',gap:14,padding:'14px 16px',borderBottom:`1px solid ${D.border}` }}>
                        <div style={{ width:60,flexShrink:0 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:D.text,fontFamily:'monospace' }}>{r.name}</div>
                          <div style={{ width:36,height:3,borderRadius:2,background:sc,marginTop:5,boxShadow:`0 0 8px ${sc}80` }}/>
                        </div>
                        <div style={{ flex:1 }}>
                          {r.val&&<div style={{ fontSize:11,fontFamily:'monospace',color:'rgba(255,255,255,0.5)',marginBottom:4,wordBreak:'break-all',padding:'4px 8px',background:'rgba(255,255,255,0.03)',borderRadius:5 }}>{r.val}</div>}
                          {r.lookups!==undefined&&<div style={{ marginBottom:6 }}>
                            <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:D.muted,marginBottom:3 }}>
                              <span>DNS lookups</span><span style={{ color:r.lookups>=8?'#ef4444':r.lookups>=6?'#f59e0b':'#10b981' }}>{r.lookups}/10</span>
                            </div>
                            <AnimBar pct={(r.lookups/10)*100} color={r.lookups>=8?'#ef4444':r.lookups>=6?'#f59e0b':'#10b981'} height={4}/>
                          </div>}
                          {r.note&&<div style={{ fontSize:11,color:D.muted,lineHeight:1.5 }}>{r.note}</div>}
                          {r.suggest&&<div style={{ marginTop:6,padding:'5px 8px',background:'rgba(16,185,129,0.06)',borderRadius:6,fontSize:10,fontFamily:'monospace',color:'rgba(16,185,129,0.8)',wordBreak:'break-all' }}>✦ {r.suggest}</div>}
                        </div>
                        <div style={{ fontSize:11,padding:'3px 10px',borderRadius:8,background:`${sc}18`,color:sc,border:`1px solid ${sc}30`,fontWeight:500,flexShrink:0 }}>{r.status}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ═══ SSL ═══ */}
              {activeTab==='ssl' && scan?.ssl_info && (
                <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                  <div style={{ ...card,padding:'20px' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                      <div style={{ fontSize:32 }}>🔒</div>
                      <div>
                        <div style={{ fontSize:15,fontWeight:600,color:D.text }}>SSL/TLS Certificate</div>
                        <div style={{ fontSize:12,color:scan.ssl_info.overall_status==='Pass'?'#10b981':'#ef4444' }}>{scan.ssl_info.overall_status==='Pass'?'HTTPS connection successful':'HTTPS connection failed'}</div>
                      </div>
                      <div style={{ marginLeft:'auto',fontSize:11,padding:'4px 12px',borderRadius:10,background:scan.ssl_info.overall_status==='Pass'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)',color:scan.ssl_info.overall_status==='Pass'?'#10b981':'#ef4444',border:`1px solid ${scan.ssl_info.overall_status==='Pass'?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}` }}>{scan.ssl_info.overall_status}</div>
                    </div>
                    {scan.ssl_info.certs?.map((cert,i)=>(
                      <div key={i} style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
                        {[{l:'Domain',v:cert.domain},{l:'Protocol',v:cert.protocol||'TLS'},{l:'Key size',v:`${cert.key_size||'?'}-bit`},{l:'Chain',v:cert.chain_valid?'✓ Valid':'✗ Invalid'},{l:'CT log',v:cert.ct_log?'✓ Verified':'✗ Not found'},{l:'HSTS',v:cert.hsts||'Not configured'}].map(f=>(
                          <div key={f.l} style={{ padding:'12px 14px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:`1px solid ${D.border}` }}>
                            <div style={{ fontSize:10,color:D.muted,marginBottom:5 }}>{f.l}</div>
                            <div style={{ fontSize:13,fontWeight:500,color:D.text }}>{f.v}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div style={{ marginTop:14,padding:'10px 14px',background:'rgba(96,165,250,0.06)',border:'1px solid rgba(96,165,250,0.15)',borderRadius:8,fontSize:12,color:'rgba(96,165,250,0.8)' }}>
                      ℹ {scan.ssl_info.note||'Full certificate details available in browser developer tools.'}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ PROPAGATION ═══ */}
              {activeTab==='propagation' && scan?.propagation && (
                <div style={card}>
                  <div style={{ padding:'14px 16px',borderBottom:`1px solid ${D.border}`,display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <span style={{ fontSize:13,fontWeight:500,color:D.text }}>Global DNS propagation</span>
                    <span style={{ fontSize:11,padding:'3px 10px',borderRadius:8,background:scan.propagation.consistent?'rgba(16,185,129,0.15)':'rgba(245,158,11,0.15)',color:scan.propagation.consistent?'#10b981':'#f59e0b' }}>
                      {scan.propagation.consistent?'Fully consistent':'Inconsistencies detected'}
                    </span>
                  </div>
                  <div style={{ padding:16 }}>
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16 }}>
                      {[{key:'us',flag:'🇺🇸',name:'US West',sub:'Cloudflare 1.1.1.1'},{key:'eu',flag:'🇪🇺',name:'EU',sub:'Google 8.8.8.8'},{key:'apac',flag:'🌏',name:'APAC',sub:'OpenDNS'},{key:'au',flag:'🇦🇺',name:'Oceania',sub:'Quad9'},].map(reg=>{
                        const allPass = scan.propagation.records?.every(r=>r[reg.key]==='pass')
                        return (
                          <div key={reg.key} style={{ padding:'14px',background:'rgba(255,255,255,0.03)',borderRadius:10,border:`1px solid ${allPass?'rgba(16,185,129,0.2)':'rgba(245,158,11,0.2)'}` }}>
                            <div style={{ fontSize:24,marginBottom:4 }}>{reg.flag}</div>
                            <div style={{ fontSize:12,fontWeight:500,color:D.text }}>{reg.name}</div>
                            <div style={{ fontSize:10,color:D.muted,marginBottom:10 }}>{reg.sub}</div>
                            {scan.propagation.records?.map(rec=>(
                              <div key={rec.type} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:11,padding:'3px 0',borderBottom:`1px solid ${D.border}` }}>
                                <span style={{ fontFamily:'monospace',color:D.muted }}>{rec.type}</span>
                                <div style={{ width:8,height:8,borderRadius:'50%',background:rec[reg.key]==='pass'?'#10b981':'#f59e0b',boxShadow:`0 0 6px ${rec[reg.key]==='pass'?'#10b98170':'#f59e0b70'}` }}/>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ display:'flex',gap:16,fontSize:11,color:D.muted }}>
                      <span style={{ display:'flex',alignItems:'center',gap:5 }}><div style={{ width:8,height:8,borderRadius:'50%',background:'#10b981' }}/> Consistent across resolvers</span>
                      <span style={{ display:'flex',alignItems:'center',gap:5 }}><div style={{ width:8,height:8,borderRadius:'50%',background:'#f59e0b' }}/> Different values detected</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ BLACKLISTS ═══ */}
              {activeTab==='blacklists' && scan?.blacklists && (
                <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12 }}>
                    {[{l:'IP address',v:scan.blacklists.ip||'–',c:'#a78bfa'},{l:'Lists checked',v:scan.blacklists.results?.length||0,c:'#60a5fa'},{l:'Listed on',v:scan.blacklists.listed_count||0,c:scan.blacklists.listed_count>0?'#ef4444':'#10b981'}].map(s=>(
                      <div key={s.l} style={{ ...card,padding:'16px 18px' }}>
                        <div style={{ fontSize:11,color:D.muted,marginBottom:4 }}>{s.l}</div>
                        <div style={{ fontSize:26,fontWeight:600,color:s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={card}>
                    <div style={{ padding:'12px 16px',borderBottom:`1px solid ${D.border}` }}>
                      <span style={{ fontSize:13,fontWeight:500,color:D.text }}>Blacklist results</span>
                    </div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:0 }}>
                      {scan.blacklists.results?.map((bl,i)=>(
                        <div key={bl.name} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 16px',borderBottom:`1px solid ${D.border}`,background:bl.listed?'rgba(239,68,68,0.04)':'transparent' }}>
                          <span style={{ fontSize:11,fontFamily:'monospace',color:bl.listed?'#ef4444':'rgba(255,255,255,0.4)' }}>{bl.name}</span>
                          <div style={{ display:'flex',alignItems:'center',gap:5 }}>
                            <div style={{ width:6,height:6,borderRadius:'50%',background:bl.listed?'#ef4444':'#10b981',boxShadow:`0 0 6px ${bl.listed?'#ef444470':'#10b98170'}` }}/>
                            <span style={{ fontSize:10,color:bl.listed?'#ef4444':'#10b981',fontWeight:500 }}>{bl.listed?'Listed':'Clean'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ DNS RECORDS ═══ */}
              {activeTab==='dns' && scan?.dns_records && (
                <div style={card}>
                  <div style={{ padding:'12px 16px',borderBottom:`1px solid ${D.border}`,display:'flex',justifyContent:'space-between' }}>
                    <span style={{ fontSize:13,fontWeight:500,color:D.text }}>DNS records</span>
                    <span style={{ fontSize:12,color:D.muted }}>{scan.dns_records.length} records found</span>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
                      <thead>
                        <tr style={{ background:'rgba(255,255,255,0.02)' }}>
                          {['Type','Value','TTL','Status'].map(h=>(
                            <th key={h} style={{ textAlign:'left',padding:'8px 16px',fontSize:10,fontWeight:600,color:D.muted,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${D.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scan.dns_records.map((r,i)=>(
                          <tr key={i} style={{ borderBottom:`1px solid ${D.border}` }}>
                            <td style={{ padding:'9px 16px' }}><span style={{ fontSize:10,padding:'2px 8px',borderRadius:5,background:'rgba(96,165,250,0.15)',color:'#60a5fa',fontFamily:'monospace',fontWeight:600 }}>{r.type}</span></td>
                            <td style={{ padding:'9px 16px',fontFamily:'monospace',color:'rgba(255,255,255,0.5)',fontSize:11,maxWidth:360,wordBreak:'break-all' }}>{r.value}</td>
                            <td style={{ padding:'9px 16px',fontFamily:'monospace',color:D.muted,fontSize:11 }}>{r.ttl}s</td>
                            <td style={{ padding:'9px 16px' }}><span style={{ fontSize:10,padding:'2px 8px',borderRadius:5,background:'rgba(16,185,129,0.15)',color:'#10b981' }}>{r.status||'Pass'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {showAdd && <AddDomainModal user={user} onClose={()=>setShowAdd(false)} onSuccess={fetchDomains}/>}
      {deleteTarget && <DeleteModal domain={deleteTarget} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)} loading={deleteLoading}/>}
    </div>
  )
}
