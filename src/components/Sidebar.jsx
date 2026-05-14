import { useState } from 'react'
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
    { id:'tools',   icon:Wrench,   label:'Tools'         },
    { id:'alerts',  icon:Bell,     label:'Alerts', badge: true },
    { id:'reports', icon:FileText, label:'Daily Reports' },
  ]},
]

export default function Sidebar({ page, setPage, alertCount = 0, user }) {
  const { signOut } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const w = collapsed ? 60 : 232

  return (
    <aside style={{
      width: w, minWidth: w, height: '100vh', position: 'sticky', top: 0,
      background: '#ffffff',
      borderRight: '1px solid #1e2535',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
      overflow: 'hidden', zIndex: 100, flexShrink: 0,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>

      {/* Logo */}
      <div style={{ height: 58, padding: collapsed ? '0' : '0 12px 0 18px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid #1e2535', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setPage(user ? 'dashboard' : 'landing')}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #00e5a0 0%, #00b87a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Radar size={16} color="#021812" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>DomainRadar</div>
              <div style={{ fontSize: 9, color: '#00e5a0', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>BETA</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #00e5a0 0%, #00b87a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setCollapsed(false)}>
            <Radar size={16} color="#021812" strokeWidth={2.5}/>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a3347', padding: 4, borderRadius: 6, lineHeight: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#8993ac'}
            onMouseLeave={e => e.currentTarget.style.color = '#2a3347'}>
            <ChevronRight size={14}/>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0', scrollbarWidth: 'none' }}>
        {user && SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom: 2 }}>
            {section.label && !collapsed && (
              <div style={{ padding: '10px 18px 4px', fontSize: 10, fontWeight: 700, color: '#2a3347', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {section.label}
              </div>
            )}
            {si > 0 && collapsed && (
              <div style={{ height: '1px', background: '#1e2535', margin: '6px 10px' }}/>
            )}
            {section.items.map(item => {
              const active = page === item.id
              const hasBadge = item.badge && alertCount > 0
              return (
                <div key={item.id} style={{ padding: collapsed ? '2px 6px' : '2px 8px' }}>
                  <button
                    onClick={() => setPage(item.id)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: collapsed ? '9px 0' : '8px 12px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      background: active ? 'rgba(0,229,160,0.1)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(0,229,160,0.2)' : 'transparent'}`,
                      borderRadius: 8,
                      color: active ? '#00e5a0' : '#8993ac',
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.13s', position: 'relative',
                      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0f4ff' }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8993ac' }}}>
                    {active && !collapsed && (
                      <span style={{ position: 'absolute', left: -1, top: '22%', bottom: '22%', width: 3, borderRadius: '0 3px 3px 0', background: '#00e5a0' }}/>
                    )}
                    <item.icon size={15} style={{ flexShrink: 0, color: active ? '#00e5a0' : 'inherit' }}/>
                    {!collapsed && <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                    {hasBadge && !collapsed && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'rgba(255,77,106,0.15)', color: '#ff4d6a', fontWeight: 700, border: '1px solid rgba(255,77,106,0.25)' }}>
                        {alertCount > 99 ? '99+' : alertCount}
                      </span>
                    )}
                    {hasBadge && collapsed && (
                      <span style={{ position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: '50%', background: '#ff4d6a' }}/>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
        {!user && (
          <div style={{ padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={() => setPage('auth')} style={{ padding: '10px', background: '#00e5a0', color: '#ffffff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', system-ui" }}>
              Start free
            </button>
            <button onClick={() => setPage('auth')} style={{ padding: '10px', background: '#f7f8fa', color: '#8993ac', border: '1px solid #1e2535', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', system-ui" }}>
              Sign in
            </button>
          </div>
        )}
      </nav>

      {/* Bottom */}
      {user && (
        <div style={{ borderTop: '1px solid #1e2535', padding: collapsed ? '8px 0' : '8px', flexShrink: 0 }}>
          <div style={{ padding: collapsed ? '2px 6px' : '2px 0', marginBottom: 4 }}>
            <button onClick={() => setPage('settings')} title={collapsed ? 'Settings' : undefined}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '9px 0' : '8px 12px', justifyContent: collapsed ? 'center' : 'flex-start', background: page === 'settings' ? 'rgba(0,229,160,0.1)' : 'transparent', border: `1px solid ${page === 'settings' ? 'rgba(0,229,160,0.2)' : 'transparent'}`, borderRadius: 8, cursor: 'pointer', color: page === 'settings' ? '#00e5a0' : '#8993ac', fontSize: 13, fontFamily: "'Plus Jakarta Sans', system-ui", transition: 'all 0.13s' }}
              onMouseEnter={e => { if (page !== 'settings') { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0f4ff' }}}
              onMouseLeave={e => { if (page !== 'settings') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8993ac' }}}>
              <Settings size={15} style={{ flexShrink: 0, color: page === 'settings' ? '#00e5a0' : 'inherit' }}/>
              {!collapsed && 'Settings'}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setUserOpen(o => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: collapsed ? '8px 0' : '9px 12px', justifyContent: collapsed ? 'center' : 'flex-start', background: '#161b23', border: '1px solid #1e2535', borderRadius: 10, cursor: 'pointer', transition: 'background 0.13s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1d2330'}
              onMouseLeave={e => e.currentTarget.style.background = '#161b23'}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,229,160,0.25), rgba(0,229,160,0.08))', color: '#00e5a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, border: '1px solid rgba(0,229,160,0.2)', fontFamily: "'Plus Jakarta Sans', system-ui" }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{user.email?.split('@')[0]}</div>
                    <div style={{ fontSize: 10, color: '#4a5470', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  </div>
                  <ChevronDown size={12} color="#2a3347" style={{ flexShrink: 0, transform: userOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}/>
                </>
              )}
            </button>

            {userOpen && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0, background: '#161b23', border: '1px solid #2a3347', borderRadius: 12, boxShadow: '0 -16px 40px rgba(0,0,0,0.6)', padding: '6px', zIndex: 200, minWidth: 190 }}>
                <div style={{ padding: '8px 12px 8px', fontSize: 11, color: '#4a5470', borderBottom: '1px solid #1e2535', marginBottom: 4 }}>{user.email}</div>
                {[
                  { label: 'Settings', icon: Settings, fn: () => { setPage('settings'); setUserOpen(false) }, color: '#8993ac' },
                  { label: 'Sign out', icon: LogOut, fn: () => { signOut(); setUserOpen(false) }, color: '#ff4d6a' },
                ].map(item => (
                  <button key={item.label} onClick={item.fn}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: item.color, borderRadius: 8, fontFamily: "'Plus Jakarta Sans', system-ui", fontWeight: 500 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <item.icon size={14}/> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{ width: '100%', marginTop: 6, display: 'flex', justifyContent: 'center', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: '#2a3347' }}
              onMouseEnter={e => e.currentTarget.style.color = '#8993ac'}
              onMouseLeave={e => e.currentTarget.style.color = '#2a3347'}>
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }}/>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
