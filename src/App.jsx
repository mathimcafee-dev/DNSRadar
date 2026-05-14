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
    <div style={{ background:'#f8f9fa', minHeight:'100%', padding:24, fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:16 }}>Alerts</h2>
      {alerts.length === 0 ? (
        <div style={{ background:'#fff', border:'1px solid #e9ecef', borderRadius:12, padding:'48px', textAlign:'center', color:'#6b7280', fontSize:13 }}>No alerts yet — we'll notify you when anything changes</div>
      ) : alerts.map(a => (
        <div key={a.id} style={{ background:'#fff', border:'1px solid #e9ecef', borderRadius:10, padding:'12px 16px', marginBottom:8, display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:a.severity==='critical'?'#ef4444':a.severity==='warn'?'#f59e0b':'#3b82f6', flexShrink:0, marginTop:5 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:2 }}>{a.domains?.domain_name} — {a.alert_type}</div>
            <div style={{ fontSize:12, color:'#6b7280' }}>{a.message}</div>
          </div>
          <div style={{ fontSize:11, color:'#9ca3af' }}>{new Date(a.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  )
}

function Reports({ user }) {
  return (
    <div style={{ background:'#f8f9fa', minHeight:'100%', padding:24, fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:8 }}>Daily Reports</h2>
      <p style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>Automated daily email reports will appear here.</p>
      <div style={{ background:'#fff', border:'1px solid #e9ecef', borderRadius:12, padding:'48px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>No reports generated yet</div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('landing')
  const [scanDomain, setScanDomain] = useState('')
  const [scanType, setScanType] = useState('website')
  const [alertCount, setAlertCount] = useState(0)
  const [domains, setDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pg = params.get('page')
    if (pg) { setPage(pg); window.history.replaceState({}, '', '/') }
  }, [])

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
    supabase.from('domains').select(`*, scan_results(id,health_score,score_dns,score_email,score_ssl,score_propagation,score_security,score_blacklist,email_auth,ssl_info,security,propagation,blacklists,issues,dns_records,scanned_at)`).eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setDomains(data || [])
      if (data?.length && !selectedDomain) setSelectedDomain(data[0])
    })
  }, [user, page])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f8f9fa' }}>
      <div style={{ width:28, height:28, border:'3px solid #e9ecef', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const needsAuth = ['dashboard','tools','dmarc','autofix','ssl','alerts','reports','settings'].includes(page)
  if (needsAuth && !user) { setPage('auth'); return null }

  // Public pages — no sidebar
  if (page === 'landing') return <Landing setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>
  if (page === 'auth') return <Auth setPage={setPage}/>
  if (page === 'scan') return <ScanResult domain={scanDomain} scanType={scanType} setPage={setPage} user={user}/>

  const sharedDomainProps = { user, domains, selectedDomain, setSelectedDomain }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8f9fa' }}>
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
