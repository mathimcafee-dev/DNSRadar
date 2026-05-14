import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ScanResult from './pages/ScanResult'
import Dashboard from './pages/Dashboard'
import Tools from './pages/Tools'
import DmarcReports from './pages/DmarcReports'
import DnsAutoFix from './pages/DnsAutoFix'
import Settings from './pages/Settings'
import './styles/globals.css'

function Alerts({ user }) {
  const [alerts, setAlerts] = useState([])
  useEffect(() => {
    supabase.from('alerts').select('*, domains(domain_name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50).then(({ data }) => setAlerts(data || []))
  }, [user])
  const D = { bg:'#0d1117',surface:'#161b22',border:'rgba(255,255,255,0.08)',text:'#e6edf3',muted:'rgba(255,255,255,0.5)' }
  return (
    <div style={{ background:D.bg, minHeight:'100%', padding:20, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <h2 style={{ fontSize:17, fontWeight:700, color:D.text, marginBottom:16 }}>Alerts</h2>
      {alerts.length === 0 ? (
        <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, padding:'48px', textAlign:'center', color:D.muted, fontSize:13 }}>No alerts yet — we'll notify you when anything changes</div>
      ) : alerts.map(a => (
        <div key={a.id} style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'12px 16px', marginBottom:8, display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:a.severity==='critical'?'#ef4444':a.severity==='warn'?'#f59e0b':'#3b82f6', flexShrink:0, marginTop:4 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, color:D.text, marginBottom:2 }}>{a.domains?.domain_name} — {a.alert_type}</div>
            <div style={{ fontSize:11, color:D.muted }}>{a.message}</div>
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>{new Date(a.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  )
}

function Reports({ user }) {
  const D = { bg:'#0d1117',surface:'#161b22',border:'rgba(255,255,255,0.08)',text:'#e6edf3',muted:'rgba(255,255,255,0.5)' }
  return (
    <div style={{ background:D.bg, minHeight:'100%', padding:20, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <h2 style={{ fontSize:17, fontWeight:700, color:D.text, marginBottom:8 }}>Reports</h2>
      <p style={{ fontSize:13, color:D.muted, marginBottom:20 }}>Automated daily email reports will appear here. PDF export is available from the Dashboard for each domain.</p>
      <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, padding:'48px', textAlign:'center', color:D.muted, fontSize:13 }}>No reports generated yet</div>
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

  // Load domains for shared context
  useEffect(() => {
    if (!user) return
    supabase.from('domains').select(`*, scan_results(id,health_score,score_dns,score_email,score_ssl,score_propagation,score_security,score_blacklist,email_auth,ssl_info,security,propagation,blacklists,issues,dns_records,scanned_at)`).eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setDomains(data || [])
      if (data?.length && !selectedDomain) setSelectedDomain(data[0])
    })
  }, [user, page])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0d1117' }}>
      <div style={{ width:28, height:28, border:'3px solid rgba(16,185,129,0.2)', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const needsAuth = ['dashboard', 'tools', 'dmarc', 'autofix', 'alerts', 'reports', 'settings'].includes(page)
  if (needsAuth && !user) { setPage('auth'); return null }

  const sharedDomainProps = { user, domains, selectedDomain, setSelectedDomain }

  return (
    <div style={{ background:'#0d1117', minHeight:'100vh' }}>
      <Nav page={page} setPage={setPage} alertCount={alertCount}/>
      {page === 'landing' && <Landing setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>}
      {page === 'auth' && <Auth setPage={setPage}/>}
      {page === 'scan' && <ScanResult domain={scanDomain} scanType={scanType} setPage={setPage} user={user}/>}
      {page === 'dashboard' && user && <Dashboard {...sharedDomainProps} setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>}
      {page === 'tools' && <Tools/>}
      {page === 'dmarc' && user && <DmarcReports user={user} selectedDomain={selectedDomain}/>}
      {page === 'autofix' && user && <DnsAutoFix user={user} domains={domains} selectedDomain={selectedDomain} onScanTrigger={() => setPage('dashboard')}/>}
      {page === 'alerts' && user && <Alerts user={user}/>}
      {page === 'reports' && user && <Reports user={user}/>}
      {page === 'settings' && user && <Settings user={user}/>}
    </div>
  )
}
