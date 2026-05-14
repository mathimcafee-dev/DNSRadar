import { useState } from 'react'
import { Radar, Bell, ChevronDown, LogOut, Settings, LayoutDashboard, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Nav({ page, setPage, alertCount = 0 }) {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #E9ECEF',
      padding: '0 24px', height: '56px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, background: 'var(--green)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Radar size={18} color="#fff" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)' }}>DomainRadar</span>
        <span style={{
          fontSize: 10, background: '#EAF3DE', color: 'var(--green-text)',
          padding: '1px 7px', borderRadius: 10, fontWeight: 500, border: '1px solid var(--green-mid)',
        }}>beta</span>
      </div>

      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('dashboard')}
            style={{ color: page === 'dashboard' ? 'var(--green)' : undefined }}>
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('alerts')}
            style={{ color: page === 'alerts' ? 'var(--green)' : undefined, position: 'relative' }}>
            <Bell size={14} /> Alerts
            {alertCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 7, height: 7, background: 'var(--red)', borderRadius: '50%',
              }} />
            )}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('reports')}>
            Reports
          </button>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost btn-sm"
              onClick={() => setMenuOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: '#EAF3DE', color: 'var(--green-text)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
              }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              <ChevronDown size={12} />
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', width: 180,
                background: '#fff', border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)',
                padding: '4px 0', zIndex: 200,
              }}>
                <div style={{ padding: '8px 14px 4px', fontSize: 11, color: 'var(--gray-600)' }}>
                  {user.email}
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--gray-100)', margin: '4px 0' }} />
                <button onClick={() => { setPage('settings'); setMenuOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--gray-700)' }}>
                  <Settings size={13} /> Settings
                </button>
                <button onClick={() => { signOut(); setMenuOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--red-text)' }}>
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage('auth')}>Sign in</button>
          <button className="btn btn-primary btn-sm" onClick={() => setPage('auth')}>Start free</button>
        </div>
      )}
    </nav>
  )
}
