import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ScanResult from './pages/ScanResult'
import SharedScan from './pages/SharedScan'
import Dashboard from './pages/Dashboard'
import Tools from './pages/Tools'
import DmarcReports from './pages/DmarcReports'
import DnsAutoFix from './pages/DnsAutoFix'
import SslCertificates from './pages/SslCertificates'
import Settings from './pages/Settings'
import './styles/globals.css'

function Alerts({ user }) {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  async function fetchAlerts() {
    const { data } = await supabase.from('alerts')
      .select('*, domains(domain_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setAlerts(data || [])
    setLoading(false)
  }

  async function markAllRead() {
    await supabase.from('alerts').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  async function markRead(id) {
    await supabase.from('alerts').update({ read: true }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  useEffect(() => { fetchAlerts() }, [user])

  const F = "'Inter',system-ui,sans-serif"
  const filtered = filter === 'all' ? alerts : filter === 'unread' ? alerts.filter(a => !a.read) : alerts.filter(a => a.severity === filter)
  const unreadCount = alerts.filter(a => !a.read).length
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  const sevColor = s => s === 'critical' ? '#dc2626' : s === 'warn' ? '#d97706' : '#2563eb'
  const sevBg = s => s === 'critical' ? '#fef2f2' : s === 'warn' ? '#fffbeb' : '#eff6ff'
  const sevBd = s => s === 'critical' ? '#fecaca' : s === 'warn' ? '#fde68a' : '#bfdbfe'

  // Format alert_type into readable label
  const formatType = t => t ? t.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Change detected'

  return (
    <div style={{ background:'#f7f8fa', minHeight:'100%', padding:28, fontFamily:F }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0, letterSpacing:'-0.02em' }}>Alerts</h2>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>
            {unreadCount > 0 ? `${unreadCount} unread · ` : ''}{alerts.length} total
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            style={{ padding:'7px 14px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12, fontWeight:500, color:'#374151', cursor:'pointer', fontFamily:F }}>
            Mark all read
          </button>
        )}
      </div>

      {/* Stats */}
      {alerts.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Unread', value:unreadCount, color:'#2563eb' },
            { label:'Critical', value:criticalCount, color:'#dc2626' },
            { label:'Total', value:alerts.length, color:'#374151' },
          ].map(s => (
            <div key={s.label} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 16px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', animation:'scaleIn 0.18s ease both', transition:'all 0.15s' }}>
              <div style={{ fontSize:11, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:800, color:s.color, letterSpacing:'-0.03em' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {alerts.length > 0 && (
        <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
          {[
            { id:'all', label:'All' },
            { id:'unread', label:`Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { id:'critical', label:'Critical' },
            { id:'warn', label:'Warnings' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding:'5px 12px', background:filter===f.id?'#111827':'#fff', color:filter===f.id?'#fff':'#374151', border:`1px solid ${filter===f.id?'#111827':'#e5e7eb'}`, borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:F }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Alert list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:'#6b7280', fontSize:13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔔</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#111827', marginBottom:6 }}>
            {filter === 'all' ? 'No alerts yet' : `No ${filter} alerts`}
          </div>
          <div style={{ fontSize:13, color:'#6b7280' }}>
            {filter === 'all' ? "We'll notify you when DNS, SSL or security changes are detected." : 'Try switching to "All" to see other alerts.'}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filtered.map(a => (
            <div key={a.id} onClick={() => !a.read && markRead(a.id)}
              style={{ background:'#fff', border:`1px solid ${!a.read ? sevBd(a.severity) : '#e5e7eb'}`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12, boxShadow:'0 1px 3px rgba(0,0,0,0.04)', cursor:!a.read?'pointer':'default', opacity: a.read ? 0.75 : 1, transition:'all 0.15s', animation:'fadeIn 0.2s ease both' }}>
              {/* Severity dot */}
              <div style={{ width:8, height:8, borderRadius:'50%', background:sevColor(a.severity), flexShrink:0, marginTop:5 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap' }}>
                  {a.domains?.domain_name && (
                    <span style={{ fontSize:12, fontWeight:700, color:'#111827', fontFamily:'monospace' }}>{a.domains.domain_name}</span>
                  )}
                  <span style={{ fontSize:11, padding:'1px 7px', borderRadius:8, background:sevBg(a.severity), color:sevColor(a.severity), border:`1px solid ${sevBd(a.severity)}`, fontWeight:600 }}>
                    {a.severity}
                  </span>
                  <span style={{ fontSize:11, color:'#6b7280' }}>{formatType(a.alert_type)}</span>
                  {!a.read && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#eff6ff', color:'#2563eb', fontWeight:600 }}>NEW</span>}
                </div>
                <div style={{ fontSize:12, color:'#374151', lineHeight:1.6, marginBottom: (a.before_val||a.after_val) ? 6 : 0 }}>{a.message}</div>
                {(a.before_val || a.after_val) && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {a.before_val && <span style={{ fontSize:11, fontFamily:'monospace', color:'#dc2626', background:'#fef2f2', padding:'2px 7px', borderRadius:5 }}>Before: {a.before_val}</span>}
                    {a.after_val  && <span style={{ fontSize:11, fontFamily:'monospace', color:'#16a34a', background:'#f0fdf4', padding:'2px 7px', borderRadius:5 }}>After: {a.after_val}</span>}
                  </div>
                )}
              </div>
              <div style={{ fontSize:11, color:'#9ca3af', flexShrink:0, textAlign:'right' }}>
                <div>{new Date(a.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</div>
                <div>{new Date(a.created_at).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Reports({ user }) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(true)
  const F = "'Inter',system-ui,sans-serif"

  useEffect(() => {
    supabase.from('report_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false })
      .limit(30)
      .then(({ data }) => { setSnapshots(data || []); setLoading(false) })
  }, [user])

  const card = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', marginBottom:10 }

  return (
    <div style={{ background:'#f7f8fa', minHeight:'100%', padding:28, fontFamily:F }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', margin:0, letterSpacing:'-0.02em' }}>Daily Reports</h2>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>Automated daily summaries of your domain health</div>
        </div>
      </div>

      {/* Info banner about email reports */}
      <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
        <span style={{ fontSize:16 }}>📧</span>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#1d4ed8', marginBottom:2 }}>Daily email digest</div>
          <div style={{ fontSize:12, color:'#1e40af', lineHeight:1.6 }}>
            A daily health summary is emailed to you every morning. Make sure email alerts are enabled in <strong>Settings → Notifications</strong> and your Supabase secrets are configured.
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:'#6b7280', fontSize:13 }}>Loading…</div>
      ) : snapshots.length === 0 ? (
        <div style={{ ...card, padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#111827', marginBottom:6 }}>No reports yet</div>
          <div style={{ fontSize:13, color:'#6b7280', maxWidth:360, margin:'0 auto', lineHeight:1.6 }}>
            Reports are generated daily once you have monitored domains. Come back tomorrow to see your first summary.
          </div>
        </div>
      ) : snapshots.map(s => {
        const domains = s.domains_json || []
        const scoreColor = s.avg_score >= 70 ? '#16a34a' : s.avg_score >= 50 ? '#d97706' : '#dc2626'
        return (
          <div key={s.id} style={card}>
            <div style={{ padding:'12px 16px', background:'#fafafa', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>
                  {new Date(s.report_date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </span>
                {s.critical_count > 0 && (
                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', fontWeight:600 }}>{s.critical_count} critical</span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:20, fontWeight:800, color:scoreColor }}>{s.avg_score}</span>
                {s.avg_score_delta !== null && s.avg_score_delta !== undefined && s.avg_score_delta !== 0 && (
                  <span style={{ fontSize:11, color: s.avg_score_delta > 0 ? '#16a34a' : '#dc2626', fontWeight:600 }}>
                    {s.avg_score_delta > 0 ? '↑' : '↓'}{Math.abs(s.avg_score_delta)}
                  </span>
                )}
                <span style={{ fontSize:11, color:'#6b7280' }}>avg score</span>
              </div>
            </div>
            <div style={{ padding:'10px 16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom: domains.length > 0 ? 12 : 0 }}>
                {[
                  { label:'Domains', value: s.domain_count || 0 },
                  { label:'Issues', value: s.total_issues || 0, color: (s.total_issues||0) > 0 ? '#d97706' : '#16a34a' },
                  { label:'Critical', value: s.critical_count || 0, color: (s.critical_count||0) > 0 ? '#dc2626' : '#16a34a' },
                ].map(m => (
                  <div key={m.label} style={{ textAlign:'center', padding:'8px', background:'#f9fafb', borderRadius:8 }}>
                    <div style={{ fontSize:18, fontWeight:700, color: m.color || '#111827' }}>{m.value}</div>
                    <div style={{ fontSize:11, color:'#6b7280' }}>{m.label}</div>
                  </div>
                ))}
              </div>
              {domains.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {domains.slice(0,5).map((d, i) => (
                    <span key={i} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'#f1f5f9', color:'#374151', fontFamily:'monospace', border:'1px solid #e2e8f0' }}>
                      {d.domain_name || d} {d.health_score ? `· ${d.health_score}` : ''}
                    </span>
                  ))}
                  {domains.length > 5 && <span style={{ fontSize:11, color:'#9ca3af' }}>+{domains.length-5} more</span>}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const AUTH_PAGES = ['dashboard','tools','dmarc','autofix','ssl','alerts','reports','settings']

  function getInitialPage() {
    const params = new URLSearchParams(window.location.search)
    // Handle shared scan link
    const shareId = params.get('share')
    if (shareId) {
      window.history.replaceState({}, '', '/')
      return 'share:' + shareId
    }
    const pg = params.get('page')
    if (pg) { window.history.replaceState({}, '', '/'); return pg }
    try {
      const saved = localStorage.getItem('dr_page')
      if (saved && AUTH_PAGES.includes(saved)) return saved
    } catch(e) {}
    return 'landing'
  }

  const [page, setPageRaw] = useState(getInitialPage)
  const [scanDomain, setScanDomain] = useState('')
  const [scanType, setScanType] = useState('website')
  const [alertCount, setAlertCount] = useState(0)
  const [domains, setDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState(null)

  function setPage(pg) {
    setPageRaw(pg)
    try {
      if (AUTH_PAGES.includes(pg)) localStorage.setItem('dr_page', pg)
      else localStorage.removeItem('dr_page')
    } catch(e) {}
  }

  useEffect(() => {
    if (user && (page === 'landing' || page === 'auth')) setPage('dashboard')
  }, [user])

  useEffect(() => {
    if (!user) return
    const fetchCount = async () => {
      const { count } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
      setAlertCount(count || 0)
    }
    fetchCount()
    const sub = supabase.channel('alerts-count').on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `user_id=eq.${user.id}` }, fetchCount).subscribe()
    return () => sub.unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user) return
    supabase.from('domains').select(`*, scan_results(id,health_score,score_dns,score_email,score_ssl,score_propagation,score_security,score_blacklist,email_auth,ssl_info,security,propagation,blacklists,issues,dns_records,scanned_at):scanned_at.desc.limit(1)`).eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setDomains(data || [])
      if (data?.length && !selectedDomain) setSelectedDomain(data[0])
    })
  }, [user])

  const needsAuth = ['dashboard','tools','dmarc','autofix','ssl','alerts','reports','settings'].includes(page)
  useEffect(() => { if (needsAuth && !user && !loading) setPage('auth') }, [needsAuth, user, loading])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f7f8fa' }}>
      <div style={{ width:28, height:28, border:'3px solid #e5e7eb', borderTopColor:'#16a34a', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Public pages — no sidebar
  if (page === 'landing') return <Landing setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>
  if (page === 'auth') return <Auth setPage={setPage}/>
  if (page === 'scan') return <ScanResult domain={scanDomain} scanType={scanType} setPage={setPage} user={user}/>
  if (page.startsWith('share:')) {
    const shareId = page.replace('share:', '')
    return <SharedScan shareId={shareId} setPage={setPage}/>
  }
  if (needsAuth && !user) return null

  const sharedDomainProps = { user, domains, selectedDomain, setSelectedDomain }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f7f8fa' }}>
      <Sidebar page={page} setPage={setPage} alertCount={alertCount} user={user} domains={domains} selectedDomain={selectedDomain} setSelectedDomain={setSelectedDomain}/>
      <main style={{ flex:1, minWidth:0, overflowY:'auto', minHeight:'100vh' }} key={page}>
        <div className="page-enter" style={{minHeight:'100%'}}>
        {page === 'dashboard' && <Dashboard {...sharedDomainProps} setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>}
        {page === 'dmarc'     && <DmarcReports user={user}/>}
        {page === 'autofix'   && <DnsAutoFix user={user} domains={domains} selectedDomain={selectedDomain} onScanTrigger={() => setPage('dashboard')}/>}
        {page === 'ssl'       && <SslCertificates user={user}/>}
        {page === 'tools'     && <Tools user={user}/>}
        {page === 'alerts'    && <Alerts user={user}/>}
        {page === 'reports'   && <Reports user={user}/>}
        {page === 'settings'  && <Settings user={user}/>}
        </div>
      </main>
    </div>
  )
}
