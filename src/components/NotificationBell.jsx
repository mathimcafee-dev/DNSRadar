import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'

const SEV_COLOR = s => s === 'critical' ? '#e53e3e' : s === 'warn' ? '#d97706' : '#0073d1'
const SEV_BG    = s => s === 'critical' ? '#fff5f5' : s === 'warn' ? '#fffbeb' : '#e8f3fc'
const SEV_BD    = s => s === 'critical' ? '#feb2b2' : s === 'warn' ? '#fcd34d' : '#a8d0f0'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationBell({ user, setPage }) {
  const [open, setOpen]     = useState(false)
  const [alerts, setAlerts] = useState([])
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  async function fetchAlerts() {
    const { data } = await supabase.from('alerts')
      .select('*, domains(domain_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)
    setAlerts(data || [])
    setUnread((data || []).filter(a => !a.read).length)
  }

  async function markAll() {
    await supabase.from('alerts').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
    setUnread(0)
  }

  async function markOne(id) {
    await supabase.from('alerts').update({ read: true }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
    setUnread(prev => Math.max(0, prev - 1))
  }

  useEffect(() => {
    if (!user) return
    fetchAlerts()
    const sub = supabase.channel('bell-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts', filter: `user_id=eq.${user.id}` }, () => fetchAlerts())
      .subscribe()
    return () => sub.unsubscribe()
  }, [user])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button onClick={() => { setOpen(o => !o); if (!open) fetchAlerts() }}
        style={{ position:'relative', width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background: open ? '#e8f3fc' : '#ffffff', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', transition:'all 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background='#f0f7ff'}
        onMouseLeave={e => e.currentTarget.style.background=open?'#e8f3fc':'#ffffff'}>
        <Bell size={15} color="#4a5568"/>
        {unread > 0 && (
          <span style={{ position:'absolute', top:-4, right:-4, minWidth:16, height:16, background:'#e53e3e', color:'#ffffff', fontSize:9, fontWeight:700, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', border:'2px solid #ffffff' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:360, background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:300, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ padding:'12px 16px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafbfc' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#1a2332' }}>Notifications {unread > 0 && <span style={{ fontSize:11, color:'#e53e3e', fontWeight:600 }}>· {unread} new</span>}</span>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {unread > 0 && (
                <button onClick={markAll} style={{ fontSize:11, color:'#0073d1', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontWeight:500, padding:0 }}>
                  <CheckCheck size={12}/> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8896a7', padding:0, lineHeight:0 }}>
                <X size={14}/>
              </button>
            </div>
          </div>

          {/* Alert list */}
          <div style={{ maxHeight:380, overflowY:'auto' }}>
            {alerts.length === 0 ? (
              <div style={{ padding:'32px 16px', textAlign:'center' }}>
                <Bell size={28} color="#c8d6e5" style={{ marginBottom:8 }}/>
                <div style={{ fontSize:13, color:'#8896a7' }}>No notifications yet</div>
                <div style={{ fontSize:11, color:'#c8d6e5', marginTop:4 }}>We'll notify you when DNS or SSL changes are detected</div>
              </div>
            ) : alerts.map(a => (
              <div key={a.id} onClick={() => !a.read && markOne(a.id)}
                style={{ padding:'10px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:10, cursor:!a.read?'pointer':'default', background:!a.read?'#fafbff':'#ffffff', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background='#f0f7ff'}
                onMouseLeave={e => e.currentTarget.style.background=!a.read?'#fafbff':'#ffffff'}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:SEV_COLOR(a.severity), flexShrink:0, marginTop:4 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
                    {a.domains?.domain_name && (
                      <span style={{ fontSize:11, fontWeight:700, color:'#1a2332', fontFamily:'monospace' }}>{a.domains.domain_name}</span>
                    )}
                    <span style={{ fontSize:10, padding:'1px 6px', borderRadius:6, background:SEV_BG(a.severity), color:SEV_COLOR(a.severity), border:`1px solid ${SEV_BD(a.severity)}`, fontWeight:600 }}>{a.severity}</span>
                    {!a.read && <span style={{ fontSize:9, padding:'1px 5px', borderRadius:4, background:'#e8f3fc', color:'#0073d1', fontWeight:700 }}>NEW</span>}
                  </div>
                  <div style={{ fontSize:11, color:'#4a5568', lineHeight:1.5 }}>{a.message}</div>
                  <div style={{ fontSize:10, color:'#c8d6e5', marginTop:3 }}>{timeAgo(a.created_at)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid #e2e8f0', background:'#fafbfc' }}>
            <button onClick={() => { setPage('alerts'); setOpen(false) }}
              style={{ width:'100%', padding:'7px', background:'#ffffff', color:'#0073d1', border:'1px solid #a8d0f0', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='#e8f3fc'}
              onMouseLeave={e => e.currentTarget.style.background='#ffffff'}>
              View all alerts <ExternalLink size={11}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
