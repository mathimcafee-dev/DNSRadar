import { useState } from 'react'
import { Radar, LayoutDashboard, Shield, Zap, Lock, Wrench, Bell, FileText, Settings, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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
    { id:'tools',   icon:Wrench,   label:'Tools'         },
    { id:'alerts',  icon:Bell,     label:'Alerts', badge:true },
    { id:'reports', icon:FileText, label:'Daily Reports' },
  ]},
]

const S = {
  wrap:   { display:'flex', alignItems:'center', gap:9, cursor:'pointer' },
  logo:   { width:30, height:30, background:'linear-gradient(135deg,#22d9a0,#16a878)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 16px rgba(34,217,160,0.25)' },
  name:   { fontSize:14, fontWeight:800, color:'#f1f5ff', letterSpacing:'-0.03em', fontFamily:"'Syne',system-ui,sans-serif" },
  beta:   { fontSize:9, color:'#10e898', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginTop:-1 },
}

export default function Sidebar({ page, setPage, alertCount = 0, user }) {
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const w = collapsed ? 58 : 230

  function navBtn(item) {
    const active = page === item.id
    const hasBadge = item.badge && alertCount > 0
    return (
      <button key={item.id} onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}
        style={{
          width: collapsed ? '100%' : 'calc(100% - 12px)',
          margin: collapsed ? 0 : '0 6px',
          display:'flex', alignItems:'center', gap:9,
          padding: collapsed ? '10px 0' : '8px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: active ? 'rgba(34,217,160,0.1)' : 'transparent',
          border: active ? '1px solid rgba(34,217,160,0.18)' : '1px solid transparent',
          borderRadius: 9,
          color: active ? '#10e898' : '#8b95b0',
          fontSize:13, fontWeight: active ? 600 : 400,
          cursor:'pointer', transition:'all 0.12s',
          position:'relative', textAlign:'left',
          fontFamily:"'DM Sans',system-ui,sans-serif",
        }}
        onMouseEnter={e => { if(!active){ e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='rgba(255,255,255,0.85)' }}}
        onMouseLeave={e => { if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#8b95b0' }}}>
        {active && !collapsed && <span style={{ position:'absolute', left:0, top:'18%', bottom:'18%', width:3, borderRadius:'0 2px 2px 0', background:'#10e898', boxShadow:'0 0 8px rgba(34,217,160,0.7)' }}/>}
        <item.icon size={15} style={{ flexShrink:0, color: active ? '#10e898' : 'rgba(255,255,255,0.3)', transition:'color 0.12s' }}/>
        {!collapsed && <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>}
        {hasBadge && !collapsed && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'rgba(255,107,107,0.15)', color:'#ff5757', fontWeight:700, border:'1px solid rgba(255,107,107,0.2)' }}>{alertCount > 99 ? '99+' : alertCount}</span>}
        {hasBadge && collapsed && <span style={{ position:'absolute', top:6, right:9, width:6, height:6, borderRadius:'50%', background:'#ff5757' }}/>}
      </button>
    )
  }

  return (
    <aside style={{ width:w, minWidth:w, height:'100vh', position:'sticky', top:0, background:'#16191f', borderRight:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', transition:'width 0.2s cubic-bezier(.4,0,.2,1)', overflow:'hidden', zIndex:100, flexShrink:0 }}>

      {/* Logo row */}
      <div style={{ height:56, padding:collapsed?'0':'0 10px 0 16px', display:'flex', alignItems:'center', justifyContent:collapsed?'center':'space-between', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
        {!collapsed && (
          <div style={S.wrap} onClick={() => setPage(user?'dashboard':'landing')}>
            <div style={S.logo}><Radar size={15} color="#fff"/></div>
            <div><div style={S.name}>DomainRadar</div><div style={S.beta}>Beta</div></div>
          </div>
        )}
        {collapsed && (
          <div style={{ ...S.logo, cursor:'pointer' }} onClick={() => setCollapsed(false)}>
            <Radar size={15} color="#fff"/>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', padding:4, borderRadius:6, lineHeight:0, transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
            <PanelLeftClose size={14}/>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'8px 0', scrollbarWidth:'none' }}>
        {user && SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom:4 }}>
            {section.label && !collapsed && (
              <div style={{ padding:'12px 16px 3px', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.18)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {section.label}
              </div>
            )}
            {si > 0 && collapsed && <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'8px 10px' }}/>}
            {section.items.map(navBtn)}
          </div>
        ))}
        {!user && (
          <div style={{ padding:'16px 8px', display:'flex', flexDirection:'column', gap:6 }}>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'#10e898', color:'#021a10', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif" }}>Start free</button>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',system-ui,sans-serif" }}>Sign in</button>
          </div>
        )}
      </nav>

      {/* Bottom */}
      {user && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', padding:collapsed?'6px 0':'6px', flexShrink:0 }}>
          <button onClick={() => setPage('settings')} title={collapsed?'Settings':undefined}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'9px 0':'7px 10px', justifyContent:collapsed?'center':'flex-start', background:page==='settings'?'rgba(34,217,160,0.1)':'transparent', border:page==='settings'?'1px solid rgba(34,217,160,0.18)':'1px solid transparent', borderRadius:9, cursor:'pointer', color:page==='settings'?'#10e898':'#8b95b0', fontSize:13, marginBottom:4, fontFamily:"'DM Sans',system-ui,sans-serif", transition:'all 0.12s' }}
            onMouseEnter={e => { if(page!=='settings'){e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='rgba(255,255,255,0.85)'}}}
            onMouseLeave={e => { if(page!=='settings'){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#8b95b0'}}}>
            <Settings size={15} style={{ color:page==='settings'?'#10e898':'rgba(255,255,255,0.3)', flexShrink:0 }}/>
            {!collapsed && 'Settings'}
          </button>

          <div style={{ position:'relative' }}>
            <button onClick={() => setUserOpen(o=>!o)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'7px 0':'8px 10px', justifyContent:collapsed?'center':'flex-start', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, cursor:'pointer', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,rgba(34,217,160,0.3),rgba(34,217,160,0.1))', color:'#10e898', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, border:'1px solid rgba(34,217,160,0.2)', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#f1f5ff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.02em' }}>{user.email?.split('@')[0]}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.28)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                  </div>
                  <ChevronDown size={12} color="rgba(255,255,255,0.25)" style={{ transform:userOpen?'rotate(180deg)':'none', transition:'transform 0.15s', flexShrink:0 }}/>
                </>
              )}
            </button>
            {userOpen && (
              <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0, background:'#1c2028', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, boxShadow:'0 -12px 32px rgba(0,0,0,0.6)', padding:'4px', zIndex:200, minWidth:180 }}>
                <div style={{ padding:'8px 10px 6px', fontSize:11, color:'rgba(255,255,255,0.28)', borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:4 }}>{user.email}</div>
                {[
                  { label:'Settings', icon:Settings, action:() => { setPage('settings'); setUserOpen(false) }, color:'rgba(255,255,255,0.7)' },
                  { label:'Sign out', icon:LogOut, action:() => { signOut(); setUserOpen(false) }, color:'#ff5757' },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'none', border:'none', cursor:'pointer', fontSize:12, color:item.color, borderRadius:7, fontFamily:"'DM Sans',system-ui,sans-serif" }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <item.icon size={13}/> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{ width:'100%', display:'flex', justifyContent:'center', padding:'8px 0', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.18)', marginTop:4 }}
              onMouseEnter={e => e.currentTarget.style.color='#8b95b0'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.18)'}>
              <PanelLeftOpen size={14}/>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
