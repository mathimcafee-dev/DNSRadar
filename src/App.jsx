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
import AuditReport from './pages/AuditReport'
import Reports from './pages/Reports'
import Pricing from './pages/Pricing'
import About from './pages/About'
import Developer from './pages/Developer'
import './styles/globals.css'
import ErrorBoundary from './components/ErrorBoundary'

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

  const filtered = filter === 'all' ? alerts : filter === 'unread' ? alerts.filter(a => !a.read) : alerts.filter(a => a.severity === filter)
  const unreadCount = alerts.filter(a => !a.read).length
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  const sevColor = s => s === 'critical' ? '#e53e3e' : s === 'warn' ? '#d97706' : '#0073d1'
  const sevBg = s => s === 'critical' ? '#fff5f5' : s === 'warn' ? '#fffbeb' : '#e8f3fc'
  const sevBd = s => s === 'critical' ? '#feb2b2' : s === 'warn' ? '#fcd34d' : '#a8d0f0'
  const formatType = t => t ? t.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Change detected'

  return (
    <div style={{ background:'#f4f6f8', minHeight:'100%', padding:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#1a2332', margin:0, letterSpacing:'-0.02em' }}>Alerts</h2>
          <div style={{ fontSize:12, color:'#8896a7', marginTop:3 }}>
            {unreadCount > 0 ? `${unreadCount} unread · ` : ''}{alerts.length} total
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-outline btn-sm">Mark all read</button>
        )}
      </div>

      {alerts.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Unread', value:unreadCount, color:'#0073d1' },
            { label:'Critical', value:criticalCount, color:'#e53e3e' },
            { label:'Total', value:alerts.length, color:'#1a2332' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ fontSize:11, color:'#8896a7', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:800, color:s.color, letterSpacing:'-0.03em' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
          {[
            { id:'all', label:'All' },
            { id:'unread', label:`Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { id:'critical', label:'Critical' },
            { id:'warn', label:'Warnings' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding:'5px 12px', background:filter===f.id?'#0073d1':'#ffffff', color:filter===f.id?'#ffffff':'#4a5568', border:`1px solid ${filter===f.id?'#a8d0f0':'#c8d6e5'}`, borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:48, color:'#8896a7', fontSize:13 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding:'48px', textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔔</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#1a2332', marginBottom:6 }}>
            {filter === 'all' ? 'No alerts yet' : `No ${filter} alerts`}
          </div>
          <div style={{ fontSize:13, color:'#8896a7' }}>
            {filter === 'all' ? "We'll notify you when DNS, SSL or security changes are detected." : 'Try switching to "All" to see other alerts.'}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filtered.map(a => (
            <div key={a.id} onClick={() => !a.read && markRead(a.id)}
              style={{ background:'#ffffff', border:`1px solid ${!a.read ? sevBd(a.severity) : '#e2e8f0'}`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12, cursor:!a.read?'pointer':'default', opacity: a.read ? 0.65 : 1, transition:'all 0.15s' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:sevColor(a.severity), flexShrink:0, marginTop:5 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap' }}>
                  {a.domains?.domain_name && (
                    <span style={{ fontSize:12, fontWeight:700, color:'#1a2332', fontFamily:'monospace' }}>{a.domains.domain_name}</span>
                  )}
                  <span style={{ fontSize:11, padding:'1px 7px', borderRadius:8, background:sevBg(a.severity), color:sevColor(a.severity), border:`1px solid ${sevBd(a.severity)}`, fontWeight:600 }}>
                    {a.severity}
                  </span>
                  <span style={{ fontSize:11, color:'#8896a7' }}>{formatType(a.alert_type)}</span>
                  {!a.read && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:'#e8f3fc', color:'#0073d1', fontWeight:600 }}>NEW</span>}
                </div>
                <div style={{ fontSize:12, color:'#4a5568', lineHeight:1.6, marginBottom:(a.before_val||a.after_val)?6:0 }}>{a.message}</div>
                {(a.before_val || a.after_val) && (
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {a.before_val && <span style={{ fontSize:11, fontFamily:'monospace', color:'#e53e3e', background:'#fff5f5', padding:'2px 7px', borderRadius:5 }}>Before: {a.before_val}</span>}
                    {a.after_val  && <span style={{ fontSize:11, fontFamily:'monospace', color:'#0073d1', background:'#e8f3fc', padding:'2px 7px', borderRadius:5 }}>After: {a.after_val}</span>}
                  </div>
                )}
              </div>
              <div style={{ fontSize:11, color:'#8896a7', flexShrink:0, textAlign:'right' }}>
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

  async function fetchDomainsFull() {
    if (!user) return
    const { data } = await supabase.from('domains')
      .select(`*, scan_results(id,health_score,score_dns,score_email,score_ssl,score_propagation,score_security,score_blacklist,email_auth,ssl_info,security,propagation,blacklists,issues,dns_records,scanned_at):scanned_at.desc.limit(1)`)
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setDomains(data || [])
    if (data?.length && !selectedDomain) setSelectedDomain(data[0])
  }

  useEffect(() => {
    if (!user) return
    fetchDomainsFull()
    // Realtime: refresh domains when a new scan_result is inserted
    const scanSub = supabase.channel('app-scan-results')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scan_results' }, () => {
        fetchDomainsFull()
      })
      .subscribe()
    // Realtime: refresh when domain is added/updated
    const domainSub = supabase.channel('app-domains')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domains', filter: `user_id=eq.${user.id}` }, () => {
        fetchDomainsFull()
      })
      .subscribe()
    return () => { scanSub.unsubscribe(); domainSub.unsubscribe() }
  }, [user])

  const needsAuth = ['dashboard','tools','dmarc','autofix','ssl','alerts','reports','settings'].includes(page)
  useEffect(() => { if (needsAuth && !user && !loading) setPage('auth') }, [needsAuth, user, loading])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f4f6f8' }}>
      <div style={{ width:28, height:28, border:'3px solid #e5e7eb', borderTopColor:'#0073d1', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Public pages — no sidebar
  if (page === 'landing')   return <Landing setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>
  if (page === 'pricing')   return <Pricing setPage={setPage}/>
  if (page === 'about')     return <About setPage={setPage}/>
  if (page === 'developer') return <Developer setPage={setPage}/>
  if (page === 'auth') return <Auth setPage={setPage}/>
  if (page === 'scan') return <ScanResult domain={scanDomain} scanType={scanType} setPage={setPage} user={user}/>
  if (page.startsWith('share:')) {
    const shareId = page.replace('share:', '')
    return <SharedScan shareId={shareId} setPage={setPage}/>
  }
  if (needsAuth && !user) return null

  const sharedDomainProps = { user, domains, selectedDomain, setSelectedDomain }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f4f6f8' }}>
      <Sidebar page={page} setPage={setPage} alertCount={alertCount} user={user} domains={domains} selectedDomain={selectedDomain} onDomainSelect={d=>{setSelectedDomain(d);setPage('dashboard')}}/>
      <main style={{ flex:1, minWidth:0, overflowY:'auto', minHeight:'100vh', paddingBottom:'env(safe-area-inset-bottom)' }} key={page}>
        <ErrorBoundary>
        <div className="page-enter" style={{minHeight:'100%'}}>
        {page === 'dashboard' && <Dashboard {...sharedDomainProps} setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>}
        {page === 'dmarc'     && <DmarcReports user={user}/>}
        {page === 'autofix'   && <DnsAutoFix user={user} domains={domains} selectedDomain={selectedDomain} onScanTrigger={() => setPage('dashboard')}/>}
        {page === 'ssl'       && <SslCertificates user={user}/>}
        {page === 'tools'     && <Tools user={user}/>}
        {page === 'alerts'    && <Alerts user={user}/>}
        {page === 'reports'   && <Reports user={user}/>}
        {page === 'settings'  && <Settings user={user}/>}
        {page === 'audit'     && <AuditReport setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>}
        </div>
        </ErrorBoundary>
      </main>
    </div>
  )
}
