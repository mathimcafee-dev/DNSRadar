import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ScanResult from './pages/ScanResult'
import Dashboard from './pages/Dashboard'
import Tools from './pages/Tools'
import DmarcReports from './pages/DmarcReports'
import DnsAutoFix from './pages/DnsAutoFix'
import SslCertificates from './pages/SslCertificates'
import Settings from './pages/Settings'
import './styles/globals.css'

function Alerts({ user }) {
  const [alerts, setAlerts] = useState([])
  useEffect(() => {
    supabase.from('alerts').select('*, domains(domain_name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(({ data }) => setAlerts(data || []))
  }, [user])
  return (
    <div style={{ background:'#f7f8fa', minHeight:'100%', padding:28, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:20, letterSpacing:'-0.02em' }}>Alerts</h2>
      {alerts.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'48px', textAlign:'center', color:'#6b7280', fontSize:13 }}>No alerts yet — we'll notify you when anything changes.</div>
      ) : alerts.map(a => (
        <div key={a.id} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 16px', marginBottom:8, display:'flex', alignItems:'flex-start', gap:12, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:a.severity==='critical'?'#dc2626':a.severity==='warn'?'#d97706':'#2563eb', flexShrink:0, marginTop:5 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:2 }}>{a.domains?.domain_name} — {a.alert_type}</div>
            <div style={{ fontSize:12, color:'#374151' }}>{a.message}</div>
          </div>
          <div style={{ fontSize:11, color:'#9ca3af', flexShrink:0 }}>{new Date(a.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  )
}

function Reports({ user }) {
  return (
    <div style={{ background:'#f7f8fa', minHeight:'100%', padding:28, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:8, letterSpacing:'-0.02em' }}>Daily Reports</h2>
      <p style={{ fontSize:13, color:'#374151', marginBottom:20 }}>Automated daily email reports will appear here.</p>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'48px', textAlign:'center', color:'#6b7280', fontSize:13 }}>No reports generated yet</div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const AUTH_PAGES = ['dashboard','tools','dmarc','autofix','ssl','alerts','reports','settings']

  function getInitialPage() {
    const params = new URLSearchParams(window.location.search)
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

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f7f8fa' }}>
      <div style={{ width:28, height:28, border:'3px solid rgba(16,185,129,0.2)', borderTopColor:'#16a34a', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const needsAuth = ['dashboard','tools','dmarc','autofix','ssl','alerts','reports','settings'].includes(page)
  useEffect(() => { if (needsAuth && !user && !loading) setPage('auth') }, [needsAuth, user, loading])

  // Public pages — no sidebar
  if (page === 'landing') return <Landing setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>
  if (page === 'auth') return <Auth setPage={setPage}/>
  if (page === 'scan') return <ScanResult domain={scanDomain} scanType={scanType} setPage={setPage} user={user}/>

  const sharedDomainProps = { user, domains, selectedDomain, setSelectedDomain }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f7f8fa' }}>
      <Sidebar page={page} setPage={setPage} alertCount={alertCount} user={user}/>
      <main style={{ flex:1, minWidth:0, overflowY:'auto', minHeight:'100vh' }}>
        {page === 'dashboard' && <Dashboard {...sharedDomainProps} setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>}
        {page === 'dmarc'     && <DmarcReports user={user}/>}
        {page === 'autofix'   && <DnsAutoFix user={user} domains={domains} selectedDomain={selectedDomain} onScanTrigger={() => setPage('dashboard')}/>}
        {page === 'ssl'       && <SslCertificates user={user}/>}
        {page === 'tools'     && <Tools user={user}/>}
        {page === 'alerts'    && <Alerts user={user}/>}
        {page === 'reports'   && <Reports user={user}/>}
        {page === 'settings'  && <Settings user={user}/>}
      </main>
    </div>
  )
}
