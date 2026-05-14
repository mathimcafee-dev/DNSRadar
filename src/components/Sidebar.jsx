import { useState } from 'react'
import {
  Radar, LayoutDashboard, Shield, Zap, Lock, Wrench,
  Bell, FileText, Settings, LogOut, ChevronDown, ChevronRight
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const ac = '#10b981'
const D = {
  bg: '#0b0f14',
  surface: '#111827',
  border: 'rgba(255,255,255,0.07)',
  text: '#e2e8f0',
  muted: 'rgba(255,255,255,0.4)',
  dim: 'rgba(255,255,255,0.2)',
}

const SECTIONS = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Email security',
    items: [
      { id: 'dmarc',   icon: Shield,       label: 'DMARC Reports' },
      { id: 'autofix', icon: Zap,          label: 'DNS Auto-Fix' },
    ]
  },
  {
    label: 'Certificates',
    items: [
      { id: 'ssl',     icon: Lock,         label: 'SSL Certificates' },
    ]
  },
  {
    label: 'Utilities',
    items: [
      { id: 'tools',   icon: Wrench,       label: 'Tools' },
      { id: 'alerts',  icon: Bell,         label: 'Alerts', badge: true },
      { id: 'reports', icon: FileText,     label: 'Daily Reports' },
    ]
  },
]

export default function Sidebar({ page, setPage, alertCount = 0, user }) {
  const { signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const w = collapsed ? 60 : 220

  return (
    <aside style={{
      width: w,
      minWidth: w,
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: D.bg,
      borderRight: `1px solid ${D.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
      zIndex: 100,
      fontFamily: "'DM Sans','Inter',system-ui,sans-serif",
    }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '18px 0' : '18px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${D.border}`,
        cursor: 'pointer',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setPage(user ? 'dashboard' : 'landing')}>
          <div style={{
            width: 30, height: 30, background: ac, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Radar size={15} color="#fff"/>
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: D.text, lineHeight: 1.2 }}>DomainRadar</div>
              <div style={{ fontSize: 9, color: ac, fontWeight: 600, letterSpacing: '0.04em' }}>BETA</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.dim, padding: 2, lineHeight: 0 }}>
            <ChevronRight size={14}/>
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ position: 'absolute', right: -10, top: 22, background: D.surface, border: `1px solid ${D.border}`, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: D.muted }}>
            <ChevronRight size={11} style={{ transform: 'rotate(180deg)' }}/>
          </button>
        )}
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '8px 0' : '8px 0', scrollbarWidth: 'none' }}>
        {user && SECTIONS.map((section, si) => (
          <div key={section.label}>
            {/* Section label */}
            {!collapsed && (
              <div style={{
                padding: '12px 16px 4px',
                fontSize: 10,
                fontWeight: 600,
                color: D.dim,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {section.label}
              </div>
            )}
            {collapsed && si > 0 && (
              <div style={{ height: 1, background: D.border, margin: '8px 10px' }}/>
            )}

            {/* Items */}
            {section.items.map(item => {
              const active = page === item.id
              const badge = item.badge && alertCount > 0

              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: collapsed ? '9px 0' : '8px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    margin: collapsed ? '0' : '1px 8px',
                    width: collapsed ? '100%' : 'calc(100% - 16px)',
                    background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
                    borderRadius: 8,
                    color: active ? ac : D.muted,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    position: 'relative',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = D.text }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = active ? ac : D.muted }}
                >
                  {/* Active indicator bar */}
                  {active && !collapsed && (
                    <div style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: 2, background: ac,
                    }}/>
                  )}

                  <item.icon size={15} style={{ flexShrink: 0 }}/>

                  {!collapsed && (
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}

                  {badge && !collapsed && (
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 10,
                      background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 700,
                    }}>
                      {alertCount > 99 ? '99+' : alertCount}
                    </span>
                  )}
                  {badge && collapsed && (
                    <div style={{
                      position: 'absolute', top: 6, right: 8,
                      width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                    }}/>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        {!user && (
          <div style={{ padding: '20px 16px' }}>
            <button onClick={() => setPage('auth')} style={{
              width: '100%', padding: '9px', background: ac, color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 8,
            }}>Start free</button>
            <button onClick={() => setPage('auth')} style={{
              width: '100%', padding: '9px', background: 'rgba(255,255,255,0.06)',
              color: D.muted, border: `1px solid ${D.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer',
            }}>Sign in</button>
          </div>
        )}
      </nav>

      {/* Bottom: Settings + User */}
      {user && (
        <div style={{ borderTop: `1px solid ${D.border}`, padding: collapsed ? '8px 0' : '8px', flexShrink: 0 }}>
          {/* Settings */}
          <button
            onClick={() => setPage('settings')}
            title={collapsed ? 'Settings' : undefined}
            style={{
              width: collapsed ? '100%' : '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '9px 0' : '8px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: page === 'settings' ? 'rgba(16,185,129,0.1)' : 'transparent',
              border: `1px solid ${page === 'settings' ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
              borderRadius: 8, cursor: 'pointer',
              color: page === 'settings' ? ac : D.muted,
              fontSize: 13, marginBottom: 4,
            }}
          >
            <Settings size={15} style={{ flexShrink: 0 }}/>
            {!collapsed && <span>Settings</span>}
          </button>

          {/* User card */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 9,
                padding: collapsed ? '8px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${D.border}`,
                borderRadius: 8, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(16,185,129,0.2)', color: ac,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email?.split('@')[0]}
                    </div>
                    <div style={{ fontSize: 9, color: D.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  </div>
                  <ChevronDown size={12} color={D.dim}/>
                </>
              )}
            </button>

            {userMenuOpen && (
              <div style={{
                position: 'absolute', bottom: '110%', left: 0, right: 0,
                background: '#1a2332', border: `1px solid ${D.border}`,
                borderRadius: 10, boxShadow: '0 -8px 24px rgba(0,0,0,0.4)',
                padding: '4px 0', zIndex: 200,
              }}>
                <div style={{ padding: '8px 14px 6px', fontSize: 11, color: D.muted, borderBottom: `1px solid ${D.border}`, marginBottom: 4 }}>
                  {user.email}
                </div>
                <button onClick={() => { setPage('settings'); setUserMenuOpen(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: D.text }}>
                  <Settings size={13}/> Settings
                </button>
                <button onClick={() => { signOut(); setUserMenuOpen(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#ef4444' }}>
                  <LogOut size={13}/> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
