import { useState } from 'react'
import { Radar, LayoutDashboard, Shield, Zap, Lock, Wrench, Bell, FileText, Settings, LogOut, ChevronDown, ChevronRight, Plus, Mail, Search } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const SECTIONS = [
  { items: [{ id:'dashboard', icon:LayoutDashboard, label:'Dashboard' }] },
  { label:'Protect', items: [
    { id:'dmarc',   icon:Shield, label:'DMARC Reports' },
    { id:'autofix', icon:Zap,    label:'DNS Auto-Fix'  },
    { id:'ssl',     icon:Lock,   label:'SSL Certificates' },
  ]},
  { label:'Build', items: [
    { id:'tools',  icon:Wrench, label:'Tools & Generators' },
  ]},
  { label:'Track', items: [
    { id:'alerts',  icon:Bell,     label:'Alerts', badge:true },
    { id:'reports', icon:FileText, label:'Daily Reports' },
  ]},
]

function scoreColor(s) {
  if (!s) return '#6b7280'
  if (s >= 70) return '#16a34a'
  if (s >= 50) return '#d97706'
  return '#dc2626'
}

export default function Sidebar({ page, setPage, alertCount = 0, user, domains = [], selectedDomain, setSelectedDomain }) {
  const { signOut } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const w = collapsed ? 60 : 240
  const F = "'Inter',system-ui,sans-serif"

  return (
    <aside style={{ width:w, minWidth:w, height:'100vh', position:'sticky', top:0, background:'#111827', borderRight:'1px solid #1f2937', display:'flex', flexDirection:'column', transition:'width 0.2s cubic-bezier(.4,0,.2,1)', overflow:'hidden', zIndex:100, flexShrink:0, fontFamily:F }}>

      {/* Logo */}
      <div style={{ height:56, padding:collapsed?'0':'0 12px 0 16px', display:'flex', alignItems:'center', justifyContent:collapsed?'center':'space-between', borderBottom:'1px solid #1f2937', flexShrink:0 }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setPage(user?'dashboard':'landing')}>
            <div style={{ width:32, height:32, background:'#16a34a', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Radar size={16} color="#fff" strokeWidth={2.5}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'#f9fafb', letterSpacing:'-0.03em' }}>DomainRadar</div>
              <div style={{ fontSize:9, color:'#374151', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>DNS Intelligence</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ width:32, height:32, background:'#16a34a', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }} onClick={() => setCollapsed(false)}>
            <Radar size={16} color="#fff" strokeWidth={2.5}/>
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#4b5563', padding:4, borderRadius:6, lineHeight:0 }}
            onMouseEnter={e => e.currentTarget.style.color='#9ca3af'}
            onMouseLeave={e => e.currentTarget.style.color='#4b5563'}>
            <ChevronRight size={14}/>
          </button>
        )}
      </div>

      {/* Search bar */}
      {!collapsed && (
        <div style={{ padding:'10px 10px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#0d1117', border:'1px solid #1f2937', borderRadius:8, padding:'7px 10px', cursor:'text' }}>
            <Search size={13} color="#4b5563" style={{ flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#4b5563', flex:1 }}>Search features…</span>
            <span style={{ fontSize:10, color:'#374151', background:'#1f2937', padding:'1px 5px', borderRadius:4, fontFamily:'monospace' }}>⌘K</span>
          </div>
        </div>
      )}

      {/* Nav sections */}
      <nav style={{ flex:1, overflowY:'auto', padding:'8px 0', scrollbarWidth:'none' }}>
        {user && SECTIONS.map((section, si) => (
          <div key={si} style={{ marginBottom:2 }}>
            {section.label && !collapsed && (
              <div style={{ padding:'10px 16px 4px', fontSize:9, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.12em' }}>
                {section.label}
              </div>
            )}
            {si > 0 && collapsed && <div style={{ height:1, background:'#1f2937', margin:'6px 10px' }}/>}
            {section.items.map(item => {
              const active = page === item.id
              const hasBadge = item.badge && alertCount > 0
              return (
                <div key={item.id} style={{ padding:'2px 8px' }}>
                  <button onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'9px 0':'8px 10px', justifyContent:collapsed?'center':'flex-start', background:active?'#1f2937':'transparent', border:`1px solid ${active?'#374151':'transparent'}`, borderRadius:8, color:active?'#f9fafb':'#9ca3af', fontSize:13, fontWeight:active?600:400, cursor:'pointer', transition:'all 0.12s', position:'relative', fontFamily:F }}
                    onMouseEnter={e => { if(!active){e.currentTarget.style.background='#1f2937';e.currentTarget.style.color='#f9fafb'}}}
                    onMouseLeave={e => { if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#9ca3af'}}}>
                    {active && !collapsed && <span style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 2px 2px 0', background:'#4ade80' }}/>}
                    <item.icon size={15} style={{ flexShrink:0, color:active?'#4ade80':'#6b7280' }}/>
                    {!collapsed && <span style={{ flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>}
                    {hasBadge && !collapsed && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:10, background:'rgba(239,68,68,0.2)', color:'#fca5a5', fontWeight:700, border:'1px solid rgba(239,68,68,0.3)' }}>{alertCount>99?'99+':alertCount}</span>}
                    {hasBadge && collapsed && <span style={{ position:'absolute', top:6, right:8, width:6, height:6, borderRadius:'50%', background:'#ef4444' }}/>}
                  </button>
                </div>
              )
            })}
          </div>
        ))}

        {/* Domain list */}
        {user && !collapsed && domains.length > 0 && (
          <div style={{ margin:'10px 8px 4px' }}>
            <div style={{ fontSize:9, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.12em', padding:'0 4px 6px' }}>Domains</div>
            <div style={{ background:'#0d1117', border:'1px solid #1f2937', borderRadius:10, overflow:'hidden' }}>
              {domains.slice(0,5).map(d => {
                const scan = d.scan_results?.[0]
                const score = scan?.health_score
                const critical = scan?.issues?.filter(i=>i.severity==='critical').length || 0
                const isSelected = selectedDomain?.id === d.id
                const c = scoreColor(score)
                return (
                  <div key={d.id} onClick={() => { setSelectedDomain(d); setPage('dashboard') }}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderBottom:'1px solid #1f2937', cursor:'pointer', background:isSelected?'#1f2937':'transparent', transition:'background 0.12s' }}
                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background='rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background='transparent' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0, animation: isSelected&&score>=70 ? 'pulse-dot 2s ease-in-out infinite' : 'none' }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, fontWeight:isSelected?600:500, color:isSelected?'#f9fafb':'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'monospace' }}>{d.domain_name}</div>
                      <div style={{ fontSize:10, color:'#4b5563', marginTop:1 }}>
                        {!d.verified ? 'Pending verify' : score ? `Score ${score}${critical>0?` · ${critical} critical`:''}` : 'Not scanned'}
                      </div>
                    </div>
                    {score && <div style={{ fontSize:12, fontWeight:800, color:c, letterSpacing:'-0.04em' }}>{score}</div>}
                  </div>
                )
              })}
              <div onClick={() => { /* open add modal via dashboard */ setPage('dashboard') }}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 11px', cursor:'pointer', color:'#374151', fontSize:11, fontWeight:500 }}
                onMouseEnter={e => e.currentTarget.style.color='#9ca3af'}
                onMouseLeave={e => e.currentTarget.style.color='#374151'}>
                <Plus size={12}/> Add domain
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div style={{ padding:'16px 10px', display:'flex', flexDirection:'column', gap:7 }}>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Start free</button>
            <button onClick={() => setPage('auth')} style={{ padding:'9px', background:'#1f2937', color:'#6b7280', border:'1px solid #374151', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:F }}>Sign in</button>
          </div>
        )}
      </nav>

      {/* Bottom */}
      {user && (
        <div style={{ borderTop:'1px solid #1f2937', padding:collapsed?'6px 0':'6px 8px', flexShrink:0 }}>
          <div style={{ padding:'2px 0', marginBottom:4 }}>
            <button onClick={() => setPage('settings')} title={collapsed?'Settings':undefined}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'9px 0':'8px 10px', justifyContent:collapsed?'center':'flex-start', background:page==='settings'?'#1f2937':'transparent', border:`1px solid ${page==='settings'?'#374151':'transparent'}`, borderRadius:8, cursor:'pointer', color:page==='settings'?'#f9fafb':'#9ca3af', fontSize:13, fontFamily:F, transition:'all 0.12s' }}
              onMouseEnter={e => { if(page!=='settings'){e.currentTarget.style.background='#1f2937';e.currentTarget.style.color='#f9fafb'}}}
              onMouseLeave={e => { if(page!=='settings'){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#9ca3af'}}}>
              <Settings size={15} style={{ flexShrink:0, color:page==='settings'?'#4ade80':'#6b7280' }}/>
              {!collapsed && 'Settings'}
            </button>
          </div>

          {/* User card */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setUserOpen(o=>!o)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:collapsed?'7px 0':'8px 10px', justifyContent:collapsed?'center':'flex-start', background:'#1f2937', border:'1px solid #374151', borderRadius:9, cursor:'pointer', transition:'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background='#374151'}
              onMouseLeave={e => e.currentTarget.style.background='#1f2937'}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(22,163,74,0.15)', color:'#4ade80', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0, border:'1px solid rgba(74,222,128,0.2)' }}>
                {user.email?.[0]?.toUpperCase()}
              </div>
              {!collapsed && (
                <>
                  <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#f9fafb', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email?.split('@')[0]}</div>
                    <div style={{ fontSize:10, color:'#4b5563' }}>Free plan · {domains.length} domain{domains.length!==1?'s':''}</div>
                  </div>
                  <ChevronDown size={12} color="#4b5563" style={{ flexShrink:0, transform:userOpen?'rotate(180deg)':'none', transition:'transform 0.15s' }}/>
                </>
              )}
            </button>
            {userOpen && (
              <div style={{ position:'absolute', bottom:'calc(100% + 6px)', left:0, right:0, background:'#1f2937', border:'1px solid #374151', borderRadius:10, boxShadow:'0 -8px 24px rgba(0,0,0,0.4)', padding:'4px', zIndex:200, minWidth:190 }}>
                <div style={{ padding:'8px 10px 6px', fontSize:11, color:'#4b5563', borderBottom:'1px solid #374151', marginBottom:4 }}>{user.email}</div>
                {[
                  { label:'Settings', icon:Settings, fn:()=>{setPage('settings');setUserOpen(false)}, color:'#9ca3af' },
                  { label:'Sign out', icon:LogOut,   fn:()=>{signOut();setUserOpen(false)},           color:'#fca5a5' },
                ].map(item => (
                  <button key={item.label} onClick={item.fn}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'none', border:'none', cursor:'pointer', fontSize:12, color:item.color, borderRadius:7, fontFamily:F }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <item.icon size={13}/> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {collapsed && (
            <button onClick={() => setCollapsed(false)} style={{ width:'100%', display:'flex', justifyContent:'center', padding:'8px 0', background:'none', border:'none', cursor:'pointer', color:'#4b5563', marginTop:4 }}
              onMouseEnter={e => e.currentTarget.style.color='#9ca3af'}
              onMouseLeave={e => e.currentTarget.style.color='#4b5563'}>
              <ChevronRight size={14} style={{ transform:'rotate(180deg)' }}/>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
