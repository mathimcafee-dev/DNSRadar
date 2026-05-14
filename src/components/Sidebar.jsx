import { useState } from 'react'
import { Radar, LayoutDashboard, Shield, Zap, Lock, Wrench, Bell, FileText, Settings, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const SECTIONS = [
  { label: 'Main', items: [{ id:'dashboard', icon:LayoutDashboard, label:'Dashboard' }] },
  { label: 'Email security', items: [
    { id:'dmarc',   icon:Shield,   label:'DMARC Reports' },
    { id:'autofix', icon:Zap,      label:'DNS Auto-Fix'  },
  ]},
  { label: 'Certificates', items: [
    { id:'ssl', icon:Lock, label:'SSL Certificates' },
  ]},
  { label: 'Utilities', items: [
    { id:'tools',   icon:Wrench,   label:'Tools'         },
    { id:'alerts',  icon:Bell,     label:'Alerts', badge:true },
    { id:'reports', icon:FileText, label:'Daily Reports' },
  ]},
]

export default function Sidebar({ page, setPage, alertCount = 0, user }) {
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const w = collapsed ? 56 : 224

  return (
    <aside style={{ width:w, minWidth:w, height:'100vh', position:'sticky', top:0, background:'#fff', borderRight:'1px solid #e9ecef', display:'flex', flexDirection:'column', transition:'width 0.2s ease', overflow:'hidden', zIndex:100, fontFamily:"'Inter',-apple-system,sans-serif" }}>

      {/* Logo */}
      <div style={{ height:52, padding:collapsed?'0':'0 10px 0 14px', display:'flex', alignItems:'center', justifyContent:collapsed?'center':'space-between', borderBottom:'1px solid #f1f3f5', flexShrink:0 }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer' }} onClick={() => setPage(user?'dashboard':'landing')}>
            <div style={{ width:28, height:28, background:'#10b981', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Radar size={14} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#111827', letterSpacing:'-0.01em' }}>DomainRadar</div>
              <div style={{ fontSize:9, color:'#10b981', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>BETA</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width:28, height:28, background:'#10b981', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} onClick={() => setCollapsed(false)}>
            <Radar size={14} color="#fff"/>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:4, lineHeight:0, borderRadius:5 }}>
            <PanelLeftClose size={15}/>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, overflowY:'auto', padding:'6px 0', scrollbarWidth:'none' }}>
        {user && SECTIONS.map((section, si) => (
          <div key={section.label} style={{ marginBottom:2 }}>
            {si > 0 && !collapsed && (
              <div style={{ padding:'10px 14px 3px', fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {section.label}
              </div>
            )}
            {si > 0 && collapsed && <div style={{ height:1, background:'#f1f3f5', margin:'6px 8px' }}/>}

            {section.items.map(item => {
              const active = page === item.id
              const hasBadge = item.badge && alertCount > 0
              return (
                <button key={item.id} onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}
                  style={{ width:collapsed?'100%':'calc(100% - 12px)', margin:collapsed?0:'0 6px', display:'flex', alignItems:'center', gap:9, padding:collapsed?'9px 0':'7px 10px', justifyContent:collapsed?'center':'flex-start', background:active?'#f0fdf4':'transparent', border:'none', borderRadius:8, color:active?'#059669':'#6b7280', fontSize:13, fontWeight:active?600:400, cursor:'pointer', transition:'background 0.1s', position:'relative', textAlign:'left' }}>
                  {active && !collapsed && <span style={{ position:'absolute', left:0, top:'18%', bottom:'18%', width:3, borderRadius:'0 2px 2px 0', background:'#10b981' }}/>}
                  <item.icon size={15} style={{ flexShrink:0, color:active?'#10b981':'#9ca3af' }}/>
                  {!collapsed && <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>}
                  {hasBadge && !collapsed && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'#fef2f2', color:'#ef4444', fontWeight:700, border:'1px solid #fecaca' }}>{alertCount>99?'99+':alertCount}</span>}
                  {hasBadge && collapsed && <span style={{ position:'absolute', top:7, right:9, width:6, height:6, borderRadius:'50%', background:'#ef4444' }}/>}
                </button>
              )
            })}
          </div>
        ))}

        {!user && (
          <div style={{ padding:'16px 10px', display:'flex', flexDirection:'column', gap:6 }}>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'#10b981', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>Start free</button>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, cursor:'pointer' }}>Sign in</button>
          </div>
        )}
      </nav>

      {/* Bottom: settings + user */}
      {user && (
        <div style={{ borderTop:'1px solid #f1f3f5', padding:collapsed?'6px 0':'6px', flexShrink:0 }}>
          <button onClick={() => setPage('settings')} title={collapsed?'Settings':undefined}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'8px 0':'7px 10px', justifyContent:collapsed?'center':'flex-start', background:page==='settings'?'#f0fdf4':'transparent', border:'none', borderRadius:8, cursor:'pointer', color:page==='settings'?'#059669':'#6b7280', fontSize:13, marginBottom:4 }}>
            <Settings size={15} style={{ color:page==='settings'?'#10b981':'#9ca3af' }}/>
            {!collapsed && 'Settings'}
          </button>

          <div style={{ position:'relative' }}>
            <button onClick={() => setUserMenuOpen(o=>!o)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:collapsed?'7px 0':'7px 8px', justifyContent:collapsed?'center':'flex-start', background:'#f9fafb', border:'1px solid #e9ecef', borderRadius:8, cursor:'pointer' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'#d1fae5', color:'#059669', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email?.split('@')[0]}</div>
                    <div style={{ fontSize:10, color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                  </div>
                  <ChevronDown size={12} color="#9ca3af"/>
                </>
              )}
            </button>

            {userMenuOpen && (
              <div style={{ position:'absolute', bottom:'110%', left:0, right:0, background:'#fff', border:'1px solid #e9ecef', borderRadius:10, boxShadow:'0 -8px 24px rgba(0,0,0,0.08)', padding:'4px 0', zIndex:200, minWidth:180 }}>
                <div style={{ padding:'8px 12px 6px', fontSize:11, color:'#9ca3af', borderBottom:'1px solid #f1f3f5', marginBottom:3 }}>{user.email}</div>
                <button onClick={() => { setPage('settings'); setUserMenuOpen(false) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#374151' }}>
                  <Settings size={13} color="#9ca3af"/> Settings
                </button>
                <button onClick={() => { signOut(); setUserMenuOpen(false) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#ef4444' }}>
                  <LogOut size={13}/> Sign out
                </button>
              </div>
            )}
          </div>

          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{ width:'100%', display:'flex', justifyContent:'center', padding:'8px 0', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', marginTop:4 }}>
              <PanelLeftOpen size={14}/>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
