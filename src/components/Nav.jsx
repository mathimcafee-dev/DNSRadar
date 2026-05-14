import { useState } from 'react'
import { Radar, Bell, ChevronDown, LogOut, Settings, LayoutDashboard, Wrench, FileBarChart, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Nav({ page, setPage, alertCount = 0 }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const ac = '#10b981'
  const NavBtn = ({ id, icon: Icon, label, badge }) => (
    <button onClick={() => setPage(id)}
      style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 11px',background:page===id?'rgba(16,185,129,0.12)':'transparent',border:`1px solid ${page===id?'rgba(16,185,129,0.25)':'transparent'}`,borderRadius:7,color:page===id?ac:'rgba(255,255,255,0.5)',fontSize:12,fontWeight:500,cursor:'pointer',transition:'all 0.15s' }}>
      {Icon&&<Icon size={13}/>}{label}
      {badge>0&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:8,background:'rgba(239,68,68,0.2)',color:'#ef4444',fontWeight:600}}>{badge}</span>}
    </button>
  )
  return (
    <nav style={{ background:'#0d1117',borderBottom:'1px solid rgba(255,255,255,0.08)',padding:'0 18px',height:'56px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer' }} onClick={() => setPage('landing')}>
        <div style={{ width:30,height:30,background:ac,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}><Radar size={16} color="#fff"/></div>
        <span style={{ fontSize:15,fontWeight:700,color:'#fff' }}>DomainRadar</span>
        <span style={{ fontSize:9,background:'rgba(16,185,129,0.15)',color:ac,padding:'1px 7px',borderRadius:10,fontWeight:600,border:'1px solid rgba(16,185,129,0.25)' }}>beta</span>
      </div>
      {user ? (
        <div style={{ display:'flex',alignItems:'center',gap:3 }}>
          <NavBtn id="dashboard" icon={LayoutDashboard} label="Dashboard"/>
          <NavBtn id="dmarc" icon={FileBarChart} label="DMARC"/>
          <NavBtn id="autofix" icon={Zap} label="Auto-Fix"/>
          <NavBtn id="tools" icon={Wrench} label="Tools"/>
          <NavBtn id="alerts" label="Alerts" badge={alertCount}/>
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
