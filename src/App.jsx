import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ScanResult from './pages/ScanResult'
import Dashboard from './pages/Dashboard'
import Tools from './pages/Tools'
import { Alerts, Reports, Settings } from './pages/Pages'
import './styles/globals.css'

export default function App() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('landing')
  const [scanDomain, setScanDomain] = useState('')
  const [scanType, setScanType] = useState('website')
  const [alertCount, setAlertCount] = useState(0)

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

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0d1117' }}>
      <div style={{ width:28, height:28, border:'3px solid rgba(16,185,129,0.2)', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const needsAuth = ['dashboard', 'tools', 'alerts', 'reports', 'settings'].includes(page)
  if (needsAuth && !user) { setPage('auth'); return null }

  return (
    <div style={{ background:'#0d1117', minHeight:'100vh' }}>
      <Nav page={page} setPage={setPage} alertCount={alertCount}/>
      {page === 'landing' && <Landing setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>}
      {page === 'auth' && <Auth setPage={setPage}/>}
      {page === 'scan' && <ScanResult domain={scanDomain} scanType={scanType} setPage={setPage} user={user}/>}
      {page === 'dashboard' && user && <Dashboard user={user} setPage={setPage} setScanDomain={setScanDomain} setScanType={setScanType}/>}
      {page === 'tools' && <Tools/>}
      {page === 'alerts' && user && <Alerts user={user}/>}
      {page === 'reports' && user && <Reports user={user}/>}
      {page === 'settings' && user && <Settings user={user}/>}
    </div>
  )
}
