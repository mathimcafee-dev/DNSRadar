import { useState, useRef, useEffect } from 'react'
import { Radar, Bell, ChevronDown, LogOut, Settings, LayoutDashboard, Wrench, Shield, Lock, Zap, FileText } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Nav({ page, setPage, alertCount = 0 }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)
  const ac = '#10b981'

  useEffect(() => {
    function handleClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const NavBtn = ({ id, icon: Icon, label, badge }) => (
    <button onClick={() => setPage(id)}
      style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:page===id?'rgba(16,185,129,0.12)':'transparent',border:`1px solid ${page===id?'rgba(16,185,129,0.25)':'transparent'}`,borderRadius:7,color:page===id?ac:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:page===id?500:400,cursor:'pointer',transition:'all 0.15s',whiteSpace:'nowrap' }}>
      {Icon&&<Icon size={13}/>}{label}
      {badge>0&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:8,background:'rgba(239,68,68,0.2)',color:'#ef4444',fontWeight:600,marginLeft:2}}>{badge}</span>}
    </button>
  )

  const MORE_PAGES = ['dmarc','autofix','ssl','reports']
  const moreActive = MORE_PAGES.includes(page)

  return (
    <nav style={{ background:'#0d1117',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'0 16px',height:'56px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }} onClick={() => setPage(user?'dashboard':'landing')}>
        <div style={{ width:30,height:30,background:ac,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}><Radar size={16} color="#fff"/></div>
        <span style={{ fontSize:15,fontWeight:700,color:'#fff' }}>DomainRadar</span>
        <span style={{ fontSize:9,background:'rgba(16,185,129,0.15)',color:ac,padding:'1px 7px',borderRadius:10,fontWeight:600,border:'1px solid rgba(16,185,129,0.25)' }}>beta</span>
      </div>

      {user ? (
        <div style={{ display:'flex',alignItems:'center',gap:2 }}>
          <NavBtn id="dashboard" icon={LayoutDashboard} label="Dashboard"/>
          <NavBtn id="tools" icon={Wrench} label="Tools"/>
          <NavBtn id="alerts" label="Alerts" badge={alertCount}/>

          {/* More dropdown */}
          <div ref={moreRef} style={{ position:'relative' }}>
            <button onClick={() => setMoreOpen(o=>!o)}
              style={{ display:'flex',alignItems:'center',gap:4,padding:'5px 11px',background:moreActive?'rgba(16,185,129,0.12)':'transparent',border:`1px solid ${moreActive?'rgba(16,185,129,0.25)':'transparent'}`,borderRadius:7,color:moreActive?ac:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:400,cursor:'pointer',transition:'all 0.15s' }}>
              More <ChevronDown size={11} style={{ transform: moreOpen?'rotate(180deg)':'none', transition:'transform 0.15s' }}/>
            </button>
            {moreOpen && (
              <div style={{ position:'absolute',right:0,top:'110%',width:210,background:'#1a2035',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,boxShadow:'0 12px 32px rgba(0,0,0,0.4)',padding:'6px',zIndex:200 }}>
                <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',padding:'4px 8px 6px',textTransform:'uppercase',letterSpacing:'0.07em' }}>Email security</div>
                <MenuItem icon={Shield} label="DMARC Reports" id="dmarc" page={page} setPage={id=>{setPage(id);setMoreOpen(false)}} ac={ac}/>
                <MenuItem icon={Zap} label="DNS Auto-fix" id="autofix" page={page} setPage={id=>{setPage(id);setMoreOpen(false)}} ac={ac}/>
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)',margin:'6px 0' }}/>
                <div style={{ fontSize:10,color:'rgba(255,255,255,0.3)',padding:'4px 8px 6px',textTransform:'uppercase',letterSpacing:'0.07em' }}>Certificates</div>
                <MenuItem icon={Lock} label="SSL Certificates" id="ssl" page={page} setPage={id=>{setPage(id);setMoreOpen(false)}} ac={ac}/>
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)',margin:'6px 0' }}/>
                <MenuItem icon={FileText} label="Daily Reports" id="reports" page={page} setPage={id=>{setPage(id);setMoreOpen(false)}} ac={ac}/>
              </div>
            )}
          </div>

          {/* User menu */}
          <div style={{ position:'relative',marginLeft:4 }}>
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:7,cursor:'pointer' }}>
              <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(16,185,129,0.2)',color:ac,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700 }}>{user.email?.[0]?.toUpperCase()}</div>
              <ChevronDown size={11} color="rgba(255,255,255,0.4)"/>
            </button>
            {menuOpen && (
              <div style={{ position:'absolute',right:0,top:'110%',width:200,background:'#1a2035',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,boxShadow:'0 12px 32px rgba(0,0,0,0.4)',padding:'4px 0',zIndex:200 }}>
                <div style={{ padding:'8px 14px 6px',fontSize:11,color:'rgba(255,255,255,0.4)' }}>{user.email}</div>
                <hr style={{ border:'none',borderTop:'1px solid rgba(255,255,255,0.08)',margin:'4px 0' }}/>
                <button onClick={() => { setPage('settings');setMenuOpen(false) }} style={{ width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'rgba(255,255,255,0.7)' }}><Settings size={13}/> Settings</button>
                <button onClick={() => { signOut();setMenuOpen(false) }} style={{ width:'100%',display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#ef4444' }}><LogOut size={13}/> Sign out</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={() => setPage('auth')} style={{ padding:'6px 16px',background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:7,fontSize:12,fontWeight:500,cursor:'pointer' }}>Sign in</button>
          <button onClick={() => setPage('auth')} style={{ padding:'6px 16px',background:ac,color:'#fff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer' }}>Start free</button>
        </div>
      )}
    </nav>
  )
}

function MenuItem({ icon: Icon, label, id, page, setPage, ac }) {
  const active = page === id
  return (
    <button onClick={() => setPage(id)}
      style={{ width:'100%',display:'flex',alignItems:'center',gap:9,padding:'7px 10px',background:active?'rgba(16,185,129,0.12)':'none',border:'none',borderRadius:7,cursor:'pointer',fontSize:13,color:active?ac:'rgba(255,255,255,0.7)',fontWeight:active?500:400,textAlign:'left' }}>
      <Icon size={13} color={active?ac:'rgba(255,255,255,0.4)'}/>
      {label}
    </button>
  )
}
