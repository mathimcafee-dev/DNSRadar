import { useState, useEffect, useRef } from 'react'
import { Radar, LayoutDashboard, Shield, Zap, Lock, Wrench, Bell, FileText, Settings, LogOut, ChevronDown, ChevronRight, Globe, Plus, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useWindowWidth } from '../hooks/useWindowWidth'
import { supabase } from '../lib/supabase'

const SB = '#0073d1'
const SA = '#005fa8'
const SD = 'rgba(255,255,255,0.13)'

// ── Grouped nav structure ─────────────────────────────────────────────
const NAV = [
  { id:'dashboard', icon:LayoutDashboard, label:'Dashboard', single:true },
  {
    group:'Email Security',
    items:[
      { id:'dmarc',   icon:Shield, label:'DMARC Reports',
        sub:[ { label:'Aggregate reports', tab:'reports' }, { label:'Policy wizard', tab:'wizard' }, { label:'RUA setup', tab:'setup' } ]
      },
      { id:'autofix', icon:Zap,    label:'DNS Auto-Fix' },
      { id:'tools',   icon:Wrench, label:'Tools' },
    ]
  },
  {
    group:'Certificates',
    items:[ { id:'ssl', icon:Lock, label:'SSL Certificates' } ]
  },
  {
    group:'Monitoring',
    items:[
      { id:'alerts',  icon:Bell,     label:'Alerts', badge:true },
      { id:'reports', icon:FileText, label:'Reports' },
    ]
  },
]

// ── Domain switcher ───────────────────────────────────────────────────
function DomainSwitcher({ domains, selectedDomain, onSelect, collapsed }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  if (!domains?.length) return null

  const sc = d => {
    const s = d.scan_results?.[0]?.health_score
    return s == null ? '#8896a7' : s >= 70 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444'
  }

  if (collapsed) return (
    <div style={{ margin:'8px auto', width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} onClick={() => onSelect && setOpen(o => !o)}>
      <Globe size={14} color="#fff"/>
    </div>
  )

  return (
    <div ref={ref} style={{ margin:'10px 8px 6px', position:'relative' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ background: open ? '#fff' : 'rgba(255,255,255,0.14)', borderRadius: open ? '8px 8px 0 0' : 8, padding:'8px 10px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', transition:'background 0.15s' }}>
        <div style={{ width:22, height:22, background: open ? '#e8f3fc' : 'rgba(255,255,255,0.2)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Globe size={12} color={open ? SB : '#fff'}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10, color: open ? '#8896a7' : 'rgba(255,255,255,0.55)', marginBottom:1 }}>Active domain</div>
          <div style={{ fontSize:12, fontWeight:700, color: open ? SB : '#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {selectedDomain?.domain_name || 'Select domain'}
          </div>
        </div>
        <ChevronDown size={12} color={open ? '#8896a7' : 'rgba(255,255,255,0.5)'} style={{ transform: open ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', flexShrink:0 }}/>
      </div>

      {open && (
        <div style={{ position:'absolute', left:0, right:0, top:'100%', background:'#fff', borderRadius:'0 0 10px 10px', border:'1px solid #e2e8f0', borderTop:'1px solid #f1f5f9', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:300, overflow:'hidden' }}>
          <div style={{ fontSize:10, color:'#8896a7', padding:'7px 12px 4px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>All domains</div>
          {domains.map(d => {
            const active = d.id === selectedDomain?.id
            const score = d.scan_results?.[0]?.health_score
            const issues = d.scan_results?.[0]?.issues?.length || 0
            return (
              <div key={d.id} onClick={() => { onSelect(d); setOpen(false) }}
                style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:9, cursor:'pointer', background: active ? '#e8f3fc' : 'transparent', transition:'background 0.1s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:sc(d), flexShrink:0 }}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color: active ? '#0059a5' : '#1a2332', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.domain_name}</div>
                  <div style={{ fontSize:10, color:'#8896a7', marginTop:1 }}>
                    {score != null ? `Score ${score}` : 'Not scanned'}
                    {issues > 0 ? ` · ${issues} issue${issues > 1 ? 's' : ''}` : ''}
                  </div>
                </div>
                {active && <Check size={12} color={SB}/>}
              </div>
            )
          })}
          <div style={{ borderTop:'1px solid #f1f5f9', padding:'4px' }}>
            <div onClick={() => { setOpen(false); }} style={{ padding:'7px 12px', display:'flex', alignItems:'center', gap:6, cursor:'pointer', color:SB, fontSize:12, fontWeight:500, borderRadius:6 }}
              onMouseEnter={e => e.currentTarget.style.background='#f0f7ff'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <Plus size={13}/> Add new domain
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Setup progress ────────────────────────────────────────────────────
function SetupProgress({ domains, collapsed, setPage }) {
  const [expanded, setExpanded] = useState(true)

  if (!domains?.length) return null

  const d = domains[0]
  const scan = d.scan_results?.[0]

  const steps = [
    { id:'domain',    label:'Add your domain',         done: true },
    { id:'verify',    label:'Verify ownership',         done: !!d.verified },
    { id:'scan',      label:'Run first scan',           done: !!scan },
    { id:'monitor',   label:'Enable monitoring',        done: d.monitor_interval && d.monitor_interval !== 'off' },
    { id:'dmarc',     label:'Configure DMARC policy',   done: scan?.email_auth?.dmarc_status === 'Pass' },
  ]

  const done = steps.filter(s => s.done).length
  if (done === steps.length) return null // hide when all complete

  const pct = Math.round((done / steps.length) * 100)

  if (collapsed) return (
    <div style={{ margin:'6px auto 4px', width:32, height:4, background:'rgba(255,255,255,0.2)', borderRadius:2 }}>
      <div style={{ height:'100%', width:`${pct}%`, background:'#fff', borderRadius:2 }}/>
    </div>
  )

  return (
    <div style={{ margin:'0 8px 8px', background:'rgba(255,255,255,0.12)', borderRadius:10, overflow:'hidden' }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding:'9px 12px', display:'flex', alignItems:'center', gap:7, cursor:'pointer', borderBottom: expanded ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 12l5 5L20 5"/></svg>
        <span style={{ fontSize:12, color:'#fff', fontWeight:600, flex:1 }}>Get started</span>
        <span style={{ fontSize:11, fontWeight:700, background:'rgba(255,255,255,0.2)', color:'#fff', padding:'1px 7px', borderRadius:10 }}>{done}/{steps.length}</span>
        <ChevronDown size={11} color="rgba(255,255,255,0.6)" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
      </div>

      {expanded && (
        <div style={{ padding:'6px 4px' }}>
          {steps.map((s, i) => {
            const isActive = !s.done && steps.slice(0, i).every(p => p.done)
            return (
              <div key={s.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 10px', borderRadius:7, background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent', marginBottom:1, opacity: (!s.done && !isActive) ? 0.45 : 1 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: s.done ? '#fff' : isActive ? 'rgba(255,255,255,0.2)' : 'transparent', border: s.done ? 'none' : `2px solid ${isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}` }}>
                  {s.done && <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2 6l3 3 5-7" stroke={SB} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize:11, color: s.done ? 'rgba(255,255,255,0.5)' : '#fff', fontWeight: isActive ? 600 : 400, textDecoration: s.done ? 'line-through' : 'none', flex:1 }}>{s.label}</span>
                {isActive && <ChevronRight size={11} color="rgba(255,255,255,0.7)"/>}
              </div>
            )
          })}
          <div style={{ margin:'6px 10px 4px', height:3, background:'rgba(255,255,255,0.2)', borderRadius:2 }}>
            <div style={{ height:'100%', width:`${pct}%`, background:'#fff', borderRadius:2, transition:'width 0.5s ease' }}/>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────────
export default function Sidebar({ page, setPage, alertCount = 0, user, domains = [], selectedDomain, onDomainSelect }) {
  const { signOut } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({ 'Email Security': true, 'Certificates': false, 'Monitoring': true })
  const [expandedItems, setExpandedItems] = useState({ dmarc: false })
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  const effCollapsed = isMobile ? false : (isTablet ? true : collapsed)
  const w = effCollapsed ? 56 : 234
  const userRef = useRef(null)

  useEffect(() => {
    if (!userOpen) return
    const h = e => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [userOpen])

  function toggleGroup(g) { setExpandedGroups(s => ({ ...s, [g]: !s[g] })) }
  function toggleItem(id) { setExpandedItems(s => ({ ...s, [id]: !s[id] })) }

  const NavItem = ({ item, depth = 0 }) => {
    const active = page === item.id
    const hasSub = item.sub?.length > 0
    const subOpen = expandedItems[item.id]

    return (
      <>
        <div
          onClick={() => { if (hasSub && !effCollapsed) { toggleItem(item.id) } else { setPage(item.id) } }}
          title={effCollapsed ? item.label : undefined}
          style={{ display:'flex', alignItems:'center', gap:8, padding: effCollapsed ? '9px 0' : '7px 10px', justifyContent: effCollapsed ? 'center' : 'flex-start', background: active ? SA : 'transparent', borderRadius:7, color: active ? '#fff' : 'rgba(255,255,255,0.72)', fontSize:13, fontWeight: active ? 700 : 400, cursor:'pointer', transition:'all 0.12s', margin:'1px 8px', position:'relative' }}
          onMouseEnter={e => { if (!active) { e.currentTarget.style.background = SA; e.currentTarget.style.color = '#fff' }}}
          onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)' }}}>
          <item.icon size={15} style={{ flexShrink:0 }}/>
          {!effCollapsed && <>
            <span style={{ flex:1 }}>{item.label}</span>
            {item.badge && alertCount > 0 && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'rgba(255,255,255,0.2)', color:'#fff', fontWeight:700 }}>{alertCount > 99 ? '99+' : alertCount}</span>}
            {hasSub && <ChevronDown size={11} color="rgba(255,255,255,0.5)" style={{ transform: subOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>}
          </>}
          {item.badge && alertCount > 0 && effCollapsed && <span style={{ position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:'#fff' }}/>}
        </div>

        {hasSub && subOpen && !effCollapsed && (
          <div style={{ marginLeft:8, marginRight:8, borderLeft:'2px solid rgba(255,255,255,0.15)', marginLeft:20, paddingLeft:6, marginBottom:2 }}>
            {item.sub.map(s => (
              <div key={s.label} style={{ padding:'5px 10px', fontSize:11, color:'rgba(255,255,255,0.65)', cursor:'pointer', borderRadius:6, fontWeight:400, transition:'all 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.background = 'transparent' }}>
                {s.label}
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <aside style={{ width: isMobile ? 0 : w, minWidth: isMobile ? 0 : w, height:'100vh', position:'sticky', top:0, background:SB, display:'flex', flexDirection:'column', transition:'width 0.2s ease', overflow: isMobile ? 'hidden' : 'hidden', zIndex:100, flexShrink:0, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>

        {/* Logo */}
        <div style={{ height:52, padding: effCollapsed ? '0 12px' : '0 14px', display:'flex', alignItems:'center', justifyContent: effCollapsed ? 'center' : 'space-between', borderBottom:`1px solid ${SD}`, flexShrink:0 }}>
          {!effCollapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer' }} onClick={() => setPage(user ? 'dashboard' : 'landing')}>
              <div style={{ width:28, height:28, background:'rgba(255,255,255,0.2)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Radar size={14} color="#fff" strokeWidth={2.5}/>
              </div>
              <span style={{ fontSize:14, fontWeight:800, color:'#fff', letterSpacing:'-.02em' }}>DomainRadar</span>
            </div>
          )}
          {effCollapsed && (
            <div style={{ width:28, height:28, background:'rgba(255,255,255,0.2)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} onClick={() => setCollapsed(false)}>
              <Radar size={14} color="#fff" strokeWidth={2.5}/>
            </div>
          )}
          {!effCollapsed && !isMobile && !isTablet && (
            <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', padding:4, lineHeight:0, borderRadius:4 }}>
              <ChevronRight size={13}/>
            </button>
          )}
        </div>

        {/* Domain switcher */}
        {user && <DomainSwitcher domains={domains} selectedDomain={selectedDomain} onSelect={d => { onDomainSelect?.(d); setPage('dashboard') }} collapsed={effCollapsed}/>}

        {/* Setup progress */}
        {user && <SetupProgress domains={domains} collapsed={effCollapsed} setPage={setPage}/>}

        {/* Nav */}
        <nav style={{ flex:1, overflowY:'auto', padding:'6px 0', scrollbarWidth:'none' }}>
          {user && NAV.map((entry, i) => {
            if (entry.single) return <NavItem key={entry.id} item={entry}/>
            const isExpanded = expandedGroups[entry.group] !== false

            return (
              <div key={entry.group}>
                {!effCollapsed && (
                  <div onClick={() => toggleGroup(entry.group)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 16px 3px', cursor:'pointer' }}>
                    <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em' }}>{entry.group}</span>
                    <ChevronDown size={10} color="rgba(255,255,255,0.3)" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
                  </div>
                )}
                {effCollapsed && i > 0 && <div style={{ height:1, background:SD, margin:'5px 10px' }}/>}
                {(isExpanded || effCollapsed) && entry.items.map(item => (
                  <NavItem key={item.id} item={item}/>
                ))}
              </div>
            )
          })}

          {!user && (
            <div style={{ padding:'16px 10px', display:'flex', flexDirection:'column', gap:8 }}>
              <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'#fff', color:SB, border:'none', borderRadius:6, fontSize:13, fontWeight:700, cursor:'pointer' }}>Start free</button>
              <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'transparent', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, fontSize:13, cursor:'pointer' }}>Sign in</button>
            </div>
          )}
        </nav>

        {/* Bottom */}
        {user && (
          <div style={{ borderTop:`1px solid ${SD}`, padding: effCollapsed ? '6px 0' : '6px 8px', flexShrink:0 }}>
            <div style={{ marginBottom:4 }}>
              <button onClick={() => setPage('settings')}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding: effCollapsed ? '9px 0' : '8px 10px', justifyContent: effCollapsed ? 'center' : 'flex-start', background: page==='settings' ? SA : 'transparent', border:'none', borderRadius:6, cursor:'pointer', color: page==='settings' ? '#fff' : 'rgba(255,255,255,0.72)', fontSize:13, fontFamily:"'Plus Jakarta Sans',system-ui", transition:'all 0.12s' }}
                onMouseEnter={e => { if(page!=='settings'){e.currentTarget.style.background=SA;e.currentTarget.style.color='#fff'} }}
                onMouseLeave={e => { if(page!=='settings'){e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,0.72)'} }}>
                <Settings size={15}/>
                {!effCollapsed && 'Settings'}
              </button>
            </div>

            <div ref={userRef} style={{ position:'relative' }}>
              <button onClick={() => setUserOpen(o => !o)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding: effCollapsed ? '7px 0' : '8px 10px', justifyContent: effCollapsed ? 'center' : 'flex-start', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, cursor:'pointer', transition:'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,0.3)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                  {user.email?.[0]?.toUpperCase()}
                </div>
                {!effCollapsed && <>
                  <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email?.split('@')[0]}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                  </div>
                  <ChevronDown size={12} color="rgba(255,255,255,0.5)" style={{ flexShrink:0, transform:userOpen?'rotate(180deg)':'none', transition:'transform 0.15s' }}/>
                </>}
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

            {effCollapsed && !isMobile && !isTablet && (
              <button onClick={() => setCollapsed(false)} style={{ width:'100%', display:'flex', justifyContent:'center', padding:'8px 0', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.5)', marginTop:4 }}>
                <ChevronRight size={13} style={{ transform:'rotate(180deg)' }}/>
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      {isMobile && user && (
        <nav style={{ position:'fixed', bottom:0, left:0, right:0, height:60, background:SB, display:'flex', alignItems:'center', justifyContent:'space-around', zIndex:200, borderTop:'1px solid rgba(255,255,255,0.15)' }}>
          {[
            { id:'dashboard', icon:LayoutDashboard, label:'Home' },
            { id:'dmarc',     icon:Shield,          label:'DMARC' },
            { id:'ssl',       icon:Lock,            label:'SSL'   },
            { id:'tools',     icon:Wrench,          label:'Tools' },
            { id:'alerts',    icon:Bell,            label:'Alerts', badge:true },
          ].map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 0', background:'none', border:'none', cursor:'pointer', color: active ? '#ffffff' : 'rgba(255,255,255,0.6)', position:'relative' }}>
                <item.icon size={20} strokeWidth={active ? 2.5 : 1.8}/>
                <span style={{ fontSize:9, fontWeight: active ? 700 : 400 }}>{item.label}</span>
                {item.badge && alertCount > 0 && <span style={{ position:'absolute', top:6, right:'calc(50% - 14px)', width:6, height:6, borderRadius:'50%', background:'#fff' }}/>}
                {active && <span style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:24, height:2, background:'#fff', borderRadius:1 }}/>}
              </button>
            )
          })}
        </nav>
      )}
    </>
  )
}
