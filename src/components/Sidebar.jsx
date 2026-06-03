import { useState, useEffect } from 'react'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { Radar, LayoutDashboard, Shield, Zap, Lock, Wrench, Bell, FileText, Settings, LogOut, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const SECTIONS = [
  { items: [{ id:'dashboard', icon:LayoutDashboard, label:'Dashboard' }] },
  { label:'Email Security', items: [
    { id:'dmarc',   icon:Shield, label:'DMARC Reports' },
    { id:'autofix', icon:Zap,    label:'DNS Auto-Fix'  },
  ]},
  { label:'Certificates', items: [
    { id:'ssl', icon:Lock, label:'SSL Certificates' },
  ]},
  { label:'Utilities', items: [
    { id:'tools',   icon:Wrench,   label:'Tools'        },
    { id:'alerts',  icon:Bell,     label:'Alerts', badge:true },
    { id:'reports', icon:FileText, label:'Daily Reports' },
  ]},
]

const SB = '#0073d1'   // sidebar blue
const SA = '#005fa8'   // active/hover
const ST = 'rgba(255,255,255,0.7)'  // secondary text
const SD = 'rgba(255,255,255,0.15)' // divider

export default function Sidebar({ page, setPage, alertCount = 0, user }) {
  const { signOut } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  const effectiveCollapsed = isMobile ? false : (isTablet ? true : collapsed)
  const w = effectiveCollapsed ? 56 : 228

  return (
  <>
    <aside style={{ width:w, minWidth:w, height:'100vh', position:'sticky', top:0, background:SB, display:'flex', flexDirection:'column', transition:'width 0.2s ease', overflow:'hidden', zIndex:100, flexShrink:0, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>

      {/* Logo */}
      <div style={{ height:56, padding:effectiveCollapsed?'0 12px':'0 14px', display:'flex', alignItems:'center', justifyContent:effectiveCollapsed?'center':'space-between', borderBottom:`1px solid ${SD}`, flexShrink:0 }}>
        {!effectiveCollapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer' }} onClick={() => setPage(user?'dashboard':'landing')}>
            <div style={{ width:28, height:28, background:'rgba(255,255,255,0.2)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Radar size={14} color="#fff" strokeWidth={2.5}/>
            </div>
            <span style={{ fontSize:14, fontWeight:800, color:'#fff', letterSpacing:'-0.02em' }}>DomainRadar</span>
          </div>
        )}
        {isMobile ? null : effectiveCollapsed && (
          <div style={{ width:28, height:28, background:'rgba(255,255,255,0.2)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} onClick={() => setCollapsed(false)}>
            <Radar size={14} color="#fff" strokeWidth={2.5}/>
          </div>
        )}
        {!effectiveCollapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', padding:4, lineHeight:0, borderRadius:4 }}>
            <ChevronRight size={13}/>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'10px 0', scrollbarWidth:'none' }}>
        {user && SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom:2 }}>
            {section.label && !collapsed && (
              <div style={{ padding:'10px 16px 4px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {section.label}
              </div>
            )}
            {si > 0 && collapsed && <div style={{ height:1, background:SD, margin:'5px 10px' }}/>}
            {section.items.map(item => {
              const active = page === item.id
              const hasBadge = item.badge && alertCount > 0
              return (
                <div key={item.id} style={{ padding:'1px 8px' }}>
                  <button onClick={() => setPage(item.id)} title={effectiveCollapsed ? item.label : undefined}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:effectiveCollapsed?'9px 0':'8px 10px', justifyContent:effectiveCollapsed?'center':'flex-start', background:active?SA:'transparent', border:'none', borderRadius:6, color:active?'#fff':'rgba(255,255,255,0.75)', fontSize:13, fontWeight:active?700:400, cursor:'pointer', transition:'all 0.12s', position:'relative', fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}
                    onMouseEnter={e => { if(!active){ e.currentTarget.style.background=SA; e.currentTarget.style.color='#fff' }}}
                    onMouseLeave={e => { if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.75)' }}}>
                    <item.icon size={15} style={{ flexShrink:0 }}/>
                    {!collapsed && <span style={{ flex:1, textAlign:'left' }}>{item.label}</span>}
                    {hasBadge && !effectiveCollapsed && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'rgba(255,255,255,0.2)', color:'#fff', fontWeight:700 }}>{alertCount > 99 ? '99+' : alertCount}</span>}
                    {hasBadge && effectiveCollapsed && <span style={{ position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:'#fff' }}/>}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
        {!user && (
          <div style={{ padding:'16px 10px', display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'#fff', color:SB, border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>Start free</button>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'transparent', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, fontSize:13, cursor:'pointer' }}>Sign in</button>
          </div>
        )}
      </nav>

      {/* Bottom */}
      {user && (
        <div style={{ borderTop:`1px solid ${SD}`, padding:isMobile?'0':effectiveCollapsed?'6px 0':'6px 8px', flexShrink:0 }}>
          <div style={{ marginBottom:4, padding:'1px 0' }}>
            <button onClick={() => setPage('settings')}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:effectiveCollapsed?'9px 0':'8px 10px', justifyContent:effectiveCollapsed?'center':'flex-start', background:page==='settings'?SA:'transparent', border:'none', borderRadius:6, cursor:'pointer', color:page==='settings'?'#fff':'rgba(255,255,255,0.75)', fontSize:13, fontFamily:"'Plus Jakarta Sans',system-ui", transition:'all 0.12s' }}
              onMouseEnter={e => { if(page!=='settings'){ e.currentTarget.style.background=SA; e.currentTarget.style.color='#fff' }}}
              onMouseLeave={e => { if(page!=='settings'){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.75)' }}}>
              <Settings size={15}/>
              {!collapsed && 'Settings'}
            </button>
          </div>

          <div style={{ position:'relative' }}>
            <button onClick={() => setUserOpen(o=>!o)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:effectiveCollapsed?'7px 0':'8px 10px', justifyContent:effectiveCollapsed?'center':'flex-start', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, cursor:'pointer', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.3)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              {!effectiveCollapsed && (
                <>
                  <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email?.split('@')[0]}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                  </div>
                  <ChevronDown size={12} color="rgba(255,255,255,0.5)" style={{ flexShrink:0, transform:userOpen?'rotate(180deg)':'none', transition:'transform 0.15s' }}/>
                </>
              )}
            </button>

            {userOpen && (
              <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', padding:'4px', zIndex:200, minWidth:190 }}>
                <div style={{ padding:'8px 10px 6px', fontSize:11, color:'#64748b', borderBottom:'1px solid #f1f5f9', marginBottom:4 }}>{user.email}</div>
                {[
                  { label:'Settings', icon:Settings, fn:()=>{setPage('settings');setUserOpen(false)}, color:'#374151' },
                  { label:'Sign out', icon:LogOut,   fn:()=>{signOut();setUserOpen(false)},           color:'#dc2626' },
                ].map(item => (
                  <button key={item.label} onClick={item.fn}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'none', border:'none', cursor:'pointer', fontSize:13, color:item.color, borderRadius:6, fontFamily:"'Plus Jakarta Sans',system-ui", transition:'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <item.icon size={13}/> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isMobile ? null : effectiveCollapsed && (
            <button onClick={() => setCollapsed(false)} style={{ width:'100%', display:'flex', justifyContent:'center', padding:'8px 0', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', marginTop:4 }}>
              <ChevronRight size={13} style={{ transform:'rotate(180deg)' }}/>
            </button>
          )}
        </div>
      )}
    </aside>

    {/* Mobile bottom nav */}
    {isMobile && user && (
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, height:60, background:'#0073d1', display:'flex', alignItems:'center', justifyContent:'space-around', zIndex:200, borderTop:'1px solid rgba(255,255,255,0.15)', paddingBottom:'env(safe-area-inset-bottom)' }}>
        {[
          { id:'dashboard', icon:LayoutDashboard, label:'Home' },
          { id:'dmarc',     icon:Shield,          label:'DMARC' },
          { id:'ssl',       icon:Lock,            label:'SSL'   },
          { id:'tools',     icon:Wrench,          label:'Tools' },
          { id:'alerts',    icon:Bell,            label:'Alerts', badge:true },
        ].map(item => {
          const active = page === item.id
          const hasBadge = item.badge && alertCount > 0
          return (
            <button key={item.id} onClick={() => setPage(item.id)}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 0', background:'none', border:'none', cursor:'pointer', color: active ? '#ffffff' : 'rgba(255,255,255,0.6)', position:'relative' }}>
              <item.icon size={20} strokeWidth={active ? 2.5 : 1.8}/>
              <span style={{ fontSize:9, fontWeight: active ? 700 : 400, letterSpacing:'0.02em' }}>{item.label}</span>
              {hasBadge && <span style={{ position:'absolute', top:6, right:'calc(50% - 14px)', width:6, height:6, borderRadius:'50%', background:'#ffffff' }}/>}
              {active && <span style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:24, height:2, background:'#ffffff', borderRadius:1 }}/>}
            </button>
          )
        })}
      </nav>
    )}
  </>
  )
}
