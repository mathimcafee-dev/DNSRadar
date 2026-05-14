import { useState } from 'react'
import { Radar, LayoutDashboard, Shield, Zap, Lock, Wrench, Bell, FileText, Settings, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen, Activity } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const SECTIONS = [
  { items: [{ id:'dashboard', icon:LayoutDashboard, label:'Dashboard' }] },
  { label:'Email security', items: [
    { id:'dmarc',   icon:Shield, label:'DMARC Reports' },
    { id:'autofix', icon:Zap,    label:'DNS Auto-Fix'  },
  ]},
  { label:'Certificates', items: [
    { id:'ssl', icon:Lock, label:'SSL Certificates' },
  ]},
  { label:'Utilities', items: [
    { id:'tools',   icon:Wrench,   label:'Tools'         },
    { id:'alerts',  icon:Bell,     label:'Alerts', badge:true },
    { id:'reports', icon:FileText, label:'Daily Reports' },
  ]},
]

export default function Sidebar({ page, setPage, alertCount = 0, user }) {
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const w = collapsed ? 58 : 228

  return (
    <aside style={{ width:w, minWidth:w, height:'100vh', position:'sticky', top:0, background:'#0a0e1a', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', transition:'width 0.2s cubic-bezier(.4,0,.2,1)', overflow:'hidden', zIndex:100, fontFamily:"'Inter',-apple-system,sans-serif", flexShrink:0 }}>

      {/* Logo */}
      <div style={{ height:56, padding:collapsed?'0':'0 10px 0 16px', display:'flex', alignItems:'center', justifyContent:collapsed?'center':'space-between', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setPage(user?'dashboard':'landing')}>
            <div style={{ width:30, height:30, background:'linear-gradient(135deg,#00d97e,#00a862)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(0,217,126,0.3)', flexShrink:0 }}>
              <Radar size={15} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#f0f4ff', letterSpacing:'-0.02em' }}>DomainRadar</div>
              <div style={{ fontSize:9, color:'#00d97e', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:-1 }}>BETA</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width:30, height:30, background:'linear-gradient(135deg,#00d97e,#00a862)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 0 12px rgba(0,217,126,0.25)' }} onClick={() => setCollapsed(false)}>
            <Radar size={15} color="#fff"/>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', padding:4, borderRadius:6, lineHeight:0, transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.25)'}>
            <PanelLeftClose size={15}/>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'8px 0', scrollbarWidth:'none' }}>
        {user && SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom:4 }}>
            {section.label && !collapsed && (
              <div style={{ padding:'12px 16px 4px', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {section.label}
              </div>
            )}
            {si > 0 && collapsed && <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'8px 10px' }}/>}

            {section.items.map(item => {
              const active = page === item.id
              const hasBadge = item.badge && alertCount > 0
              return (
                <button key={item.id} onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}
                  style={{ width:collapsed?'100%':'calc(100% - 12px)', margin:collapsed?0:'0 6px', display:'flex', alignItems:'center', gap:9, padding:collapsed?'10px 0':'8px 10px', justifyContent:collapsed?'center':'flex-start', background:active?'rgba(0,217,126,0.1)':'transparent', border:`1px solid ${active?'rgba(0,217,126,0.18)':'transparent'}`, borderRadius:9, color:active?'#00d97e':'rgba(255,255,255,0.45)', fontSize:13, fontWeight:active?600:400, cursor:'pointer', transition:'all 0.12s', position:'relative', textAlign:'left', marginBottom:2, letterSpacing:active?'-0.01em':'normal' }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.45)' }}}>
                  {active && !collapsed && <span style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 2px 2px 0', background:'#00d97e', boxShadow:'0 0 8px rgba(0,217,126,0.6)' }}/>}
                  <item.icon size={15} style={{ flexShrink:0, color:active?'#00d97e':'rgba(255,255,255,0.35)', transition:'color 0.12s' }}/>
                  {!collapsed && <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>}
                  {hasBadge && !collapsed && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'rgba(255,94,94,0.15)', color:'#ff5e5e', fontWeight:700, border:'1px solid rgba(255,94,94,0.2)' }}>{alertCount>99?'99+':alertCount}</span>}
                  {hasBadge && collapsed && <span style={{ position:'absolute', top:6, right:8, width:7, height:7, borderRadius:'50%', background:'#ff5e5e', boxShadow:'0 0 6px rgba(255,94,94,0.6)' }}/>}
                </button>
              )
            })}
          </div>
        ))}

        {!user && (
          <div style={{ padding:'16px 8px', display:'flex', flexDirection:'column', gap:6 }}>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'#00d97e', color:'#021a0e', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:'-0.01em', boxShadow:'0 0 16px rgba(0,217,126,0.25)' }}>Start free</button>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, fontSize:13, cursor:'pointer' }}>Sign in</button>
          </div>
        )}
      </nav>

      {/* Bottom */}
      {user && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', padding:collapsed?'6px 0':'6px', flexShrink:0 }}>
          <button onClick={() => setPage('settings')} title={collapsed?'Settings':undefined}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'9px 0':'7px 10px', justifyContent:collapsed?'center':'flex-start', background:page==='settings'?'rgba(0,217,126,0.1)':'transparent', border:`1px solid ${page==='settings'?'rgba(0,217,126,0.18)':'transparent'}`, borderRadius:9, cursor:'pointer', color:page==='settings'?'#00d97e':'rgba(255,255,255,0.45)', fontSize:13, marginBottom:4, transition:'all 0.12s' }}
            onMouseEnter={e => { if (page!=='settings') { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.8)' }}}
            onMouseLeave={e => { if (page!=='settings') { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.45)' }}}>
            <Settings size={15} style={{ color:page==='settings'?'#00d97e':'rgba(255,255,255,0.35)', flexShrink:0 }}/>
            {!collapsed && 'Settings'}
          </button>

          <div style={{ position:'relative' }}>
            <button onClick={() => setUserOpen(o=>!o)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'7px 0':'8px 10px', justifyContent:collapsed?'center':'flex-start', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:9, cursor:'pointer', transition:'all 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,rgba(0,217,126,0.3),rgba(0,217,126,0.1))', color:'#00d97e', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, border:'1px solid rgba(0,217,126,0.25)' }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#f0f4ff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>{user.email?.split('@')[0]}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                  </div>
                  <ChevronDown size={12} color="rgba(255,255,255,0.3)" style={{ transform:userOpen?'rotate(180deg)':'none', transition:'transform 0.15s', flexShrink:0 }}/>
                </>
              )}
            </button>

            {userOpen && (
              <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0, background:'#141b2d', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, boxShadow:'0 -12px 32px rgba(0,0,0,0.5)', padding:'4px', zIndex:200, minWidth:180, animation:'scaleIn 0.15s ease' }}>
                <div style={{ padding:'8px 10px 6px', fontSize:11, color:'rgba(255,255,255,0.3)', borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:4 }}>{user.email}</div>
                <button onClick={() => { setPage('settings'); setUserOpen(false) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,0.7)', borderRadius:7 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  <Settings size={13} color="rgba(255,255,255,0.35)"/> Settings
                </button>
                <button onClick={() => { signOut(); setUserOpen(false) }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#ff5e5e', borderRadius:7 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,94,94,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='none'}>
                  <LogOut size={13}/> Sign out
                </button>
              </div>
            )}
          </div>

          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{ width:'100%', display:'flex', justifyContent:'center', padding:'8px 0', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', marginTop:4 }}
              onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
              <PanelLeftOpen size={14}/>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
