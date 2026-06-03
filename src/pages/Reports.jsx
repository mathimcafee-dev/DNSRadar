import { useState, useEffect } from 'react'
import { Shield, Ban, Lock, TrendingUp, CheckCircle, History, Mail, Globe, AlertTriangle, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

const F = "'Plus Jakarta Sans',system-ui,sans-serif"

const REPORT_DEFS = {
  advanced: [
    {
      id:'email-auth',
      icon:Shield, iconColor:'#0073d1', iconBg:'#e8f3fc',
      title:'Email authentication',
      desc:'SPF, DKIM, DMARC pass/fail status across all domains. Compliance with Google/Yahoo 2024 requirements.',
      tag:'All domains',
    },
    {
      id:'blacklist',
      icon:Ban, iconColor:'#e53e3e', iconBg:'#fff5f5',
      title:'Blacklist status',
      desc:'Which domains are listed on which blacklists. Listed count, clean count, delist links included.',
      tag:'Live data',
    },
    {
      id:'ssl-certs',
      icon:Lock, iconColor:'#7c3aed', iconBg:'#f5f3ff',
      title:'SSL certificates',
      desc:'All certs across monitored domains. Expiry dates, issuer, days remaining. Sorted by nearest expiry.',
      tag:'All domains',
    },
    {
      id:'dns-trend',
      icon:TrendingUp, iconColor:'#d97706', iconBg:'#fffbeb',
      title:'DNS health trend',
      desc:'Score history across all domains. Identify which domains improved or regressed over time.',
      tag:'History',
    },
  ],
  standard: [
    {
      id:'enforcement',
      icon:CheckCircle, iconColor:'#16a34a', iconBg:'#f0fdf4',
      title:'Enforcement status',
      desc:'DMARC policy level (none/quarantine/reject) for every domain at a glance.',
    },
    {
      id:'events-log',
      icon:History, iconColor:'#8896a7', iconBg:'#f8fafc',
      title:'Events log',
      desc:'All DNS changes, scan triggers, alerts and configuration events in chronological order.',
    },
  ],
}

// ── Individual report views ──────────────────────────────────────────
function EmailAuthReport({ user }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('domains')
      .select('domain_name, scan_results(health_score,score_email,email_auth,scanned_at)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setRows((data || []).map(d => ({ domain: d.domain_name, scan: d.scan_results?.[0] })))
        setLoading(false)
      })
  }, [user])

  const statusChip = (status, good) => {
    const ok = good === true || status === 'Pass'
    const bad = status === 'Missing' || status === 'Fail' || good === false
    const bg = ok ? '#e8f3fc' : bad ? '#fff5f5' : '#f8fafc'
    const color = ok ? '#0059a5' : bad ? '#c53030' : '#8896a7'
    const bd = ok ? '#a8d0f0' : bad ? '#feb2b2' : '#e2e8f0'
    return <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10, background:bg, color, border:`1px solid ${bd}`, whiteSpace:'nowrap' }}>{status || '–'}</span>
  }

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#8896a7', fontSize:13 }}>Loading…</div>

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Domains', val:rows.length, color:'#0073d1' },
          { label:'SPF passing', val:rows.filter(r=>r.scan?.email_auth?.spf_status==='Pass').length, color:'#16a34a' },
          { label:'DMARC enforced', val:rows.filter(r=>['quarantine','reject'].includes(r.scan?.email_auth?.dmarc_raw?.match(/p=(\w+)/)?.[1])).length, color:'#0073d1' },
        ].map(s => (
          <div key={s.label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:'#8896a7', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr style={{ background:'#fafbfc' }}>
            {['Domain','Health','SPF','DKIM','DMARC','Policy','Last scan'].map(h => (
              <th key={h} style={{ textAlign:'left', padding:'9px 14px', fontSize:10, fontWeight:700, color:'#8896a7', borderBottom:'1.5px solid #e2e8f0', textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const ea = row.scan?.email_auth || {}
            const policy = ea.dmarc_raw?.match(/p=(\w+)/)?.[1] || '–'
            const policyColor = policy === 'reject' ? '#16a34a' : policy === 'quarantine' ? '#d97706' : '#8896a7'
            return (
              <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', background: i%2 ? '#fafbfc' : '#fff' }}>
                <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:600, color:'#1a2332', fontSize:12 }}>{row.domain}</td>
                <td style={{ padding:'10px 14px' }}>
                  {row.scan ? <span style={{ fontSize:13, fontWeight:800, color: row.scan.health_score >= 70 ? '#0073d1' : row.scan.health_score >= 50 ? '#d97706' : '#e53e3e' }}>{row.scan.health_score}</span> : <span style={{ color:'#c8d6e5' }}>–</span>}
                </td>
                <td style={{ padding:'10px 14px' }}>{statusChip(ea.spf_status || '–')}</td>
                <td style={{ padding:'10px 14px' }}>{statusChip(ea.dkim_status || '–')}</td>
                <td style={{ padding:'10px 14px' }}>{statusChip(ea.dmarc_status || '–')}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ fontSize:11, fontWeight:700, color:policyColor, textTransform:'uppercase', fontFamily:'monospace' }}>{policy}</span></td>
                <td style={{ padding:'10px 14px', color:'#8896a7', fontSize:11 }}>
                  {row.scan?.scanned_at ? new Date(row.scan.scanned_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '–'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EnforcementReport({ user }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('domains')
      .select('domain_name, verified, monitor_interval, scan_results(health_score,email_auth,scanned_at)')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setRows(data || [])
        setLoading(false)
      })
  }, [user])

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#8896a7', fontSize:13 }}>Loading…</div>

  const policyLevel = p => ({ 'reject':3, 'quarantine':2, 'none':1 }[p] || 0)
  const policyColor = p => p === 'reject' ? '#16a34a' : p === 'quarantine' ? '#d97706' : p === 'none' ? '#8896a7' : '#e53e3e'
  const policyBg = p => p === 'reject' ? '#f0fdf4' : p === 'quarantine' ? '#fffbeb' : '#f8fafc'

  const enforced = rows.filter(r => ['reject','quarantine'].includes(r.scan_results?.[0]?.email_auth?.dmarc_raw?.match(/p=(\w+)/)?.[1]))
  const pct = rows.length ? Math.round((enforced.length / rows.length) * 100) : 0

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Total domains', val:rows.length, color:'#1a2332' },
          { label:'Enforced (reject)', val:rows.filter(r=>r.scan_results?.[0]?.email_auth?.dmarc_raw?.includes('p=reject')).length, color:'#16a34a' },
          { label:'Quarantine', val:rows.filter(r=>r.scan_results?.[0]?.email_auth?.dmarc_raw?.includes('p=quarantine')).length, color:'#d97706' },
          { label:'% compliant', val:`${pct}%`, color: pct === 100 ? '#16a34a' : pct >= 50 ? '#d97706' : '#e53e3e' },
        ].map(s => (
          <div key={s.label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:'#8896a7', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr style={{ background:'#fafbfc' }}>
            {['Domain','DMARC policy','Enforcement level','Status'].map(h => (
              <th key={h} style={{ textAlign:'left', padding:'9px 14px', fontSize:10, fontWeight:700, color:'#8896a7', borderBottom:'1.5px solid #e2e8f0', textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => {
            const policy = d.scan_results?.[0]?.email_auth?.dmarc_raw?.match(/p=(\w+)/)?.[1] || 'missing'
            const level = policyLevel(policy)
            return (
              <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', background: i%2 ? '#fafbfc' : '#fff' }}>
                <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:600, color:'#1a2332' }}>{d.domain_name}</td>
                <td style={{ padding:'10px 14px' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:policyBg(policy), color:policyColor(policy), border:`1px solid ${policyColor(policy)}28`, fontFamily:'monospace' }}>
                    p={policy}
                  </span>
                </td>
                <td style={{ padding:'10px 14px' }}>
                  <div style={{ display:'flex', gap:3 }}>
                    {[1,2,3].map(l => (
                      <div key={l} style={{ width:28, height:5, borderRadius:3, background: l <= level ? policyColor(policy) : '#e2e8f0' }}/>
                    ))}
                  </div>
                </td>
                <td style={{ padding:'10px 14px' }}>
                  {level >= 2
                    ? <span style={{ fontSize:11, fontWeight:600, color:'#16a34a' }}>✓ Enforced</span>
                    : level === 1 ? <span style={{ fontSize:11, fontWeight:600, color:'#d97706' }}>⚠ Monitoring only</span>
                    : <span style={{ fontSize:11, fontWeight:600, color:'#e53e3e' }}>✗ Not configured</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EventsLogReport({ user }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('alerts')
      .select('*, domains(domain_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending:false })
      .limit(50)
      .then(({ data }) => { setAlerts(data || []); setLoading(false) })
  }, [user])

  const sevColor = s => s === 'critical' ? '#e53e3e' : s === 'warn' ? '#d97706' : '#0073d1'
  const sevBg = s => s === 'critical' ? '#fff5f5' : s === 'warn' ? '#fffbeb' : '#e8f3fc'

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#8896a7', fontSize:13 }}>Loading…</div>

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Total events', val:alerts.length, color:'#1a2332' },
          { label:'Critical', val:alerts.filter(a=>a.severity==='critical').length, color:'#e53e3e' },
          { label:'Unread', val:alerts.filter(a=>!a.read).length, color:'#0073d1' },
        ].map(s => (
          <div key={s.label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:'#8896a7', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
      {alerts.length === 0 ? (
        <div style={{ padding:'48px', textAlign:'center', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
          <History size={32} color="#c8d6e5" style={{ marginBottom:10 }}/>
          <div style={{ fontSize:14, fontWeight:600, color:'#1a2332', marginBottom:4 }}>No events yet</div>
          <div style={{ fontSize:12, color:'#8896a7' }}>Events are generated when DNS changes or issues are detected.</div>
        </div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'#fafbfc' }}>
              {['Date','Domain','Event','Severity','Details'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'9px 14px', fontSize:10, fontWeight:700, color:'#8896a7', borderBottom:'1.5px solid #e2e8f0', textTransform:'uppercase', letterSpacing:'0.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={a.id} style={{ borderBottom:'1px solid #f1f5f9', background: i%2 ? '#fafbfc' : '#fff', opacity: a.read ? 0.7 : 1 }}>
                <td style={{ padding:'9px 14px', color:'#8896a7', fontSize:11, whiteSpace:'nowrap' }}>
                  {new Date(a.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                </td>
                <td style={{ padding:'9px 14px', fontFamily:'monospace', fontWeight:600, color:'#1a2332', fontSize:11 }}>{a.domains?.domain_name || '–'}</td>
                <td style={{ padding:'9px 14px', color:'#4a5568', maxWidth:260 }}>{a.message}</td>
                <td style={{ padding:'9px 14px' }}>
                  <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:10, background:sevBg(a.severity), color:sevColor(a.severity), border:`1px solid ${sevColor(a.severity)}28` }}>{a.severity}</span>
                </td>
                <td style={{ padding:'9px 14px', fontFamily:'monospace', fontSize:10, color:'#8896a7' }}>
                  {a.before_val && <div>Before: {a.before_val?.slice(0,40)}</div>}
                  {a.after_val  && <div>After: {a.after_val?.slice(0,40)}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Report card grid ──────────────────────────────────────────────────
function ReportCard({ def, onClick }) {
  return (
    <div onClick={onClick} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'20px', display:'flex', alignItems:'flex-start', gap:16, cursor:'pointer', transition:'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#a8d0f0'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,115,209,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ width:46, height:46, borderRadius:12, background:def.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <def.icon size={22} color={def.iconColor}/>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#1a2332' }}>{def.title}</span>
          {def.tag && <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:20, background:'#e8f3fc', color:'#0059a5', border:'1px solid #a8d0f0' }}>{def.tag}</span>}
        </div>
        <div style={{ fontSize:12, color:'#4a5568', lineHeight:1.65 }}>{def.desc}</div>
      </div>
      <ChevronRight size={16} color="#c8d6e5" style={{ flexShrink:0, marginTop:4 }}/>
    </div>
  )
}

// ── Main Reports page ─────────────────────────────────────────────────
export default function Reports({ user }) {
  const [active, setActive] = useState(null)

  const def = active ? [...REPORT_DEFS.advanced, ...REPORT_DEFS.standard].find(d => d.id === active) : null

  function renderReport() {
    if (active === 'email-auth') return <EmailAuthReport user={user}/>
    if (active === 'enforcement') return <EnforcementReport user={user}/>
    if (active === 'events-log') return <EventsLogReport user={user}/>
    return (
      <div style={{ padding:'60px', textAlign:'center', color:'#8896a7' }}>
        <def.icon size={40} color="#c8d6e5" style={{ marginBottom:12 }}/>
        <div style={{ fontSize:14, fontWeight:600, color:'#1a2332', marginBottom:6 }}>{def.title}</div>
        <div style={{ fontSize:13, color:'#8896a7', maxWidth:360, margin:'0 auto', lineHeight:1.6 }}>This report view is coming soon. The data is already available — we're building the display layer.</div>
      </div>
    )
  }

  if (active && def) return (
    <div style={{ background:'#f4f6f8', minHeight:'100%', padding:24, fontFamily:F }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => setActive(null)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:7, fontSize:12, color:'#4a5568', cursor:'pointer', fontFamily:F }}>
          <ArrowLeft size={13}/> All reports
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:def.iconBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <def.icon size={16} color={def.iconColor}/>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#1a2332' }}>{def.title}</div>
            <div style={{ fontSize:11, color:'#8896a7' }}>{def.desc}</div>
          </div>
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
        {renderReport()}
      </div>
    </div>
  )

  return (
    <div style={{ background:'#f4f6f8', minHeight:'100%', padding:24, fontFamily:F }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:'#1a2332', margin:0, marginBottom:4, letterSpacing:'-0.02em' }}>Reports</h2>
        <p style={{ fontSize:13, color:'#8896a7', margin:0 }}>Live reports across all your monitored domains</p>
      </div>

      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#8896a7', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:12 }}>Advanced reports</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {REPORT_DEFS.advanced.map(def => <ReportCard key={def.id} def={def} onClick={() => setActive(def.id)}/>)}
        </div>
      </div>

      <div>
        <div style={{ fontSize:11, fontWeight:700, color:'#8896a7', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:12 }}>Standard reports</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {REPORT_DEFS.standard.map(def => (
            <div key={def.id} onClick={() => setActive(def.id)} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'16px 18px', cursor:'pointer', display:'flex', gap:12, alignItems:'flex-start', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#a8d0f0'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ width:32, height:32, borderRadius:8, background:def.iconBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <def.icon size={16} color={def.iconColor}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#1a2332', marginBottom:3 }}>{def.title}</div>
                <div style={{ fontSize:12, color:'#4a5568', lineHeight:1.55 }}>{def.desc}</div>
              </div>
              <ChevronRight size={14} color="#c8d6e5" style={{ flexShrink:0, marginTop:2 }}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
