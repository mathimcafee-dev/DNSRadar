import { useState, useEffect } from 'react'
import { Plus, Globe, Trash2, RefreshCw, ExternalLink, Shield, Pause, Play, Clock, Mail, Lock, Ban, AlertTriangle, CheckCircle, Zap, FileDown, Share2, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddDomainModal from '../components/AddDomainModal'
import ScoreHistoryChart from '../components/ScoreHistoryChart'
import DmarcJourney from '../components/DmarcJourney'
import { timeAgo, getScoreColor } from '../lib/scoreEngine'

// ─── Auto-fix button ──────────────────────────────────────────────────
function AutoFixButton({ domainId, issueType, fixValue, domainName }) {
  const [state, setState] = useState('idle') // idle | loading | success | error | no-cred
  const [cred, setCred] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const RECORD_MAP = {
    SPF:  { type:'TXT', name:'@', getValue:(v,d)=>v },
    DMARC:{ type:'TXT', name:(d)=>`_dmarc.${d}`, getValue:(v,d)=>v },
    CAA:  { type:'CAA', name:'@', getValue:(v,d)=>v },
  }
  const mapping = RECORD_MAP[issueType]
  if (!mapping) return null

  async function loadCred() {
    const { data } = await supabase.from('dns_credentials').select('id,provider,label,verified').eq('user_id', (await supabase.auth.getUser()).data.user?.id).limit(1)
    if (!data?.length) { setState('no-cred'); return }
    setCred(data[0]); setShowConfirm(true)
  }

  async function execute() {
    setState('loading'); setShowConfirm(false)
    const { data: { session } } = await supabase.auth.getSession()
    const recordName = typeof mapping.name === 'function' ? mapping.name(domainName) : `${mapping.name === '@' ? domainName : mapping.name}`
    const res = await supabase.functions.invoke('dns-autofix', {
      body: { credential_id: cred.id, domain_id: domainId, action:'create', record_type:mapping.type, record_name:recordName, record_content:fixValue, record_ttl:300 },
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    setState(res.data?.success ? 'success' : 'error')
    if (res.data?.success) setTimeout(() => setState('idle'), 4000)
  }

  if (state === 'no-cred') return (
    <a href="#" onClick={e=>{e.preventDefault();setState('idle')}} style={{fontSize:10,color:'#f59e0b',textDecoration:'none',whiteSpace:'nowrap'}}>
      Add DNS credentials in Settings →
    </a>
  )

  return (
    <div style={{flexShrink:0}}>
      {showConfirm && (
        <div style={{position:'absolute',right:16,zIndex:50,background:'#fff',border:'1px solid #e9ecef',borderRadius:10,padding:'12px 14px',width:260,boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'#fff',marginBottom:5}}>Push to {cred?.provider}?</div>
          <div style={{fontSize:10,fontFamily:'monospace',color:'#6b7280',marginBottom:2}}>Type: {mapping.type} · Name: {typeof mapping.name==='function'?mapping.name(domainName):mapping.name}</div>
          <div style={{fontSize:10,fontFamily:'monospace',color:'rgba(16,185,129,0.8)',background:'rgba(16,185,129,0.06)',padding:'4px 8px',borderRadius:5,marginBottom:10,wordBreak:'break-all'}}>{fixValue?.slice(0,80)}</div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={execute} style={{flex:1,padding:'6px',background:'#10b981',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:600}}>Confirm push</button>
            <button onClick={()=>setShowConfirm(false)} style={{padding:'6px 10px',background:'#f3f4f6',color:'#4b5563',border:'none',borderRadius:6,cursor:'pointer',fontSize:11}}>Cancel</button>
          </div>
        </div>
      )}
      <button onClick={state==='idle'?loadCred:undefined} disabled={state==='loading'||state==='success'}
        style={{padding:'4px 10px',background:state==='success'?'rgba(16,185,129,0.15)':state==='error'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.12)',border:`1px solid ${state==='success'?'rgba(16,185,129,0.3)':state==='error'?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)'}`,borderRadius:6,color:state==='success'?'#10b981':state==='error'?'#ef4444':'#f59e0b',fontSize:10,fontWeight:600,cursor:state==='idle'?'pointer':'default',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4}}>
        {state==='loading'&&<div style={{width:10,height:10,border:'2px solid rgba(245,158,11,0.3)',borderTopColor:'#f59e0b',borderRadius:'50%',animation:'dsh-spin 0.7s linear infinite'}}/>}
        {state==='idle'&&'⚡ Fix auto'}
        {state==='loading'&&'Pushing…'}
        {state==='success'&&'✓ Pushed!'}
        {state==='error'&&'✗ Failed'}
      </button>
    </div>
  )
}

// ─── Gauge SVG ────────────────────────────────────────────────────────
function Gauge({ score, size = 160 }) {
  const r = size * 0.36; const cx = size/2; const cy = size*0.54
  const sa = -210; const ea = 30; const arc = ea - sa
  const pct = Math.min(Math.max((score||0)/100,0),1)
  const ang = sa + arc * pct
  const rad = a => (a*Math.PI)/180
  const path = (a1,a2,rv) => {
    const x1=cx+rv*Math.cos(rad(a1)),y1=cy+rv*Math.sin(rad(a1))
    const x2=cx+rv*Math.cos(rad(a2)),y2=cy+rv*Math.sin(rad(a2))
    return `M${x1} ${y1} A${rv} ${rv} 0 ${(a2-a1)>180?1:0} 1 ${x2} ${y2}`
  }
  const nx=cx+r*0.7*Math.cos(rad(ang)),ny=cy+r*0.7*Math.sin(rad(ang))
  const c=score>=70?'#10b981':score>=50?'#f59e0b':'#ef4444'
  const label=score>=90?'Excellent':score>=70?'Good':score>=50?'Fair':'Critical'
  return (
    <svg width={size} height={size*0.68} viewBox={`0 0 ${size} ${size*0.68}`}>
      {[...Array(9)].map((_,i)=>{
        const a=sa+(arc/8)*i
        const x1=cx+(r+5)*Math.cos(rad(a)),y1=cy+(r+5)*Math.sin(rad(a))
        const x2=cx+(r+10)*Math.cos(rad(a)),y2=cy+(r+10)*Math.sin(rad(a))
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e9ecef" strokeWidth={i%4===0?2:1}/>
      })}
      <path d={path(sa,ea,r)} fill="none" stroke="#f3f4f6" strokeWidth={size*0.065} strokeLinecap="round"/>
      <path d={path(sa,ang,r)} fill="none" stroke={c} strokeWidth={size*0.065} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={r*0.38} fill={`${c}14`}/>
      <text x={cx} y={cy-2} textAnchor="middle" fill={c} fontSize={size*0.2} fontWeight="700" fontFamily="system-ui">{score??'–'}</text>
      <text x={cx} y={cy+size*0.09} textAnchor="middle" fill="#9ca3af" fontSize={size*0.085} fontFamily="system-ui">{label}</text>
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={c} strokeWidth={1.5} strokeLinecap="round" opacity={0.7}/>
      <circle cx={nx} cy={ny} r={3} fill={c}/>
      <circle cx={cx} cy={cy} r={4} fill={c} opacity={0.4}/>
    </svg>
  )
}

// ─── Animated bar ─────────────────────────────────────────────────────
function AnimBar({ pct, color, delay=0, h=6 }) {
  const [w,setW]=useState(0)
  useEffect(()=>{const t=setTimeout(()=>setW(pct),100+delay);return()=>clearTimeout(t)},[pct])
  return (
    <div style={{height:h,background:'#f3f4f6',borderRadius:h/2,overflow:'hidden'}}>
      <div style={{height:'100%',borderRadius:h/2,width:`${w}%`,background:color,transition:'width 1s cubic-bezier(.4,0,.2,1)'}}/>
    </div>
  )
}

// ─── Share button ─────────────────────────────────────────────────────
function ShareButton({ domain, scanId }) {
  const [copied,setCopied]=useState(false)
  async function share() {
    if (!scanId) return
    const { data } = await supabase.from('public_scan_shares')
      .insert({ scan_result_id: scanId, domain_name: domain })
      .select('id').single()
    if (data?.id) {
      await navigator.clipboard.writeText(`${window.location.origin}/share/${data.id}`)
      setCopied(true); setTimeout(()=>setCopied(false),2500)
    }
  }
  return (
    <button onClick={share}
      style={{padding:'6px 14px',background:'#f3f4f6',color:'#374151',border:'1px solid #e9ecef',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:5}}>
      {copied?<><Check size={12} color="#10b981"/>Copied!</>:<><Share2 size={12}/>Share</>}
    </button>
  )
}

// ─── Delete modal ─────────────────────────────────────────────────────
function DeleteModal({ domain, onConfirm, onCancel, loading }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onCancel()}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,backdropFilter:'blur(4px)'}}>
      <div style={{background:'#fff',border:'1px solid #e9ecef',borderRadius:16,maxWidth:400,width:'100%',margin:'0 16px',padding:24}}>
        <div style={{fontSize:16,fontWeight:700,color:'#fff',marginBottom:8}}>Delete domain?</div>
        <div style={{fontSize:13,color:'#6b7280',marginBottom:20}}>
          Permanently delete <span style={{color:'#ef4444',fontFamily:'monospace'}}>{domain?.domain_name}</span> and all scan history.
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'8px 16px',background:'#f3f4f6',color:'#374151',border:'1px solid #e9ecef',borderRadius:8,cursor:'pointer',fontSize:13}}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{padding:'8px 16px',background:'#ef4444',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500}}>
            {loading?'Deleting…':'Delete forever'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────
function SBadge({ status }) {
  const s=(status||'').toLowerCase()
  const pass=['pass','valid','clean','present','consistent','signed','enforced','active','blocked','configured','pass'].some(p=>s.includes(p))
  const fail=['missing','fail','error','listed','not signed','not configured'].some(p=>s.includes(p))
  const warn=!pass&&!fail
  return (
    <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:`rgba(${pass?'16,185,129':fail?'239,68,68':'245,158,11'},0.15)`,color:pass?'#10b981':fail?'#ef4444':'#f59e0b',fontWeight:500,whiteSpace:'nowrap'}}>
      {status||'–'}
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────
export default function Dashboard({ user, setPage, setScanDomain, setScanType, onDomainSelect }) {
  const [domains,setDomains]=useState([])
  const [loading,setLoading]=useState(true)
  const [showAdd,setShowAdd]=useState(false)
  const [scanning,setScanning]=useState({})
  const [selected,setSelected]=useState(null)
  const [deleteTarget,setDeleteTarget]=useState(null)
  const [deleteLoading,setDeleteLoading]=useState(false)
  const [activeTab,setActiveTab]=useState('overview')

  useEffect(()=>{if(user)fetchDomains()},[user])

  async function fetchDomains() {
    setLoading(true)
    const {data}=await supabase.from('domains')
      .select(`*, scan_results(id,health_score,score_dns,score_email,score_ssl,score_propagation,score_security,score_blacklist,email_auth,ssl_info,security,propagation,blacklists,issues,dns_records,scanned_at)`)
      .eq('user_id',user.id).order('created_at',{ascending:false})
    setDomains(data||[])
    if(data?.length&&!selected){setSelected(data[0]);onDomainSelect?.(data[0])}
    else if(selected) setSelected(s=>data?.find(d=>d.id===s?.id)||data?.[0]||null)
    setLoading(false)
  }

  async function triggerScan(domain) {
    setScanning(s=>({...s,[domain.id]:true}))
    try {
      await supabase.functions.invoke('dns-scan',{body:{domain:domain.domain_name,scan_type:'website',save_to_db:true,domain_id:domain.id}})
      await fetchDomains()
    } finally {setScanning(s=>({...s,[domain.id]:false}))}
  }

  async function confirmDelete() {
    setDeleteLoading(true)
    await supabase.from('domains').delete().eq('id',deleteTarget.id)
    setDeleteLoading(false); setDeleteTarget(null)
    if(selected?.id===deleteTarget.id) setSelected(null)
    fetchDomains()
  }

  async function updateInterval(id,interval) {
    await supabase.from('domains').update({monitor_interval:interval}).eq('id',id)
    fetchDomains()
  }

  const scan=selected?.scan_results?.[0]
  const issues=scan?.issues||[]
  const critical=issues.filter(i=>i.severity==='critical')
  const warns=issues.filter(i=>i.severity==='warn')

  const D={bg:'#f8f9fa',surface:'#ffffff',surface2:'#f9fafb',border:'#e9ecef',text:'#111827',muted:'#6b7280',dim:'#9ca3af'}
  const card={background:D.surface,border:`1px solid ${D.border}`,borderRadius:12,overflow:'hidden'}
  const cardHd={padding:'11px 16px',borderBottom:`1px solid ${D.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',background:D.surface2}

  const cats=scan?[
    {label:'DNS records',icon:Globe,color:'#3b82f6',bg:'#1e3a5f',score:scan.score_dns,max:25},
    {label:'Email auth',icon:Mail,color:'#ef4444',bg:'#3d1515',score:scan.score_email,max:30},
    {label:'SSL / TLS',icon:Lock,color:'#10b981',bg:'#d1fae5',score:scan.score_ssl,max:20},
    {label:'Propagation',icon:Globe,color:'#f59e0b',bg:'#3d2d0a',score:scan.score_propagation,max:10},
    {label:'Security',icon:Shield,color:'#a78bfa',bg:'#2d1f4d',score:scan.score_security,max:10},
    {label:'Blacklists',icon:Ban,color:'#ef4444',bg:'#3d1515',score:scan.score_blacklist,max:5},
  ]:[]

  const tabs=['overview','email','ssl','propagation','blacklists','dns']

  return (
    <div style={{display:'flex',height:'calc(100vh - 56px)',background:D.bg,fontFamily:"'DM Sans','Inter',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        .dsh-row:hover{background:#f9fafb!important}
        .dsh-tab:hover{color:#1f2937!important}
        .dsh-btn:hover{background:#f3f4f6!important}
        .dsh-issue:hover{background:#f9fafb!important}
        @keyframes dsh-spin{to{transform:rotate(360deg)}}
        @media print{
          .no-print{display:none!important}
          body{background:#fff!important}
          .print-card{break-inside:avoid;background:#fff!important;border:1px solid #e5e7eb!important;color:#111!important}
        }
      `}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <div className="no-print" style={{width:220,flexShrink:0,background:D.surface,borderRight:`1px solid ${D.border}`,display:'flex',flexDirection:'column'}}>
        <div style={{padding:12,borderBottom:`1px solid ${D.border}`}}>
          <button onClick={()=>setShowAdd(true)}
            style={{width:'100%',padding:'8px 12px',background:'rgba(16,185,129,0.15)',border:'1px solid rgba(16,185,129,0.3)',borderRadius:8,color:'#10b981',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
            <Plus size={14}/> Add domain
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
          <div style={{fontSize:10,fontWeight:600,color:D.dim,textTransform:'uppercase',letterSpacing:'0.08em',padding:'4px 14px 6px'}}>Domains</div>
          {loading?[1,2].map(i=><div key={i} style={{margin:'4px 10px',height:44,borderRadius:8,background:'#f9fafb'}}/>)
          :domains.map(d=>{
            const s=d.scan_results?.[0]; const score=s?.health_score; const isActive=selected?.id===d.id
            const sc=score>=70?'#10b981':score>=50?'#f59e0b':'#ef4444'
            const critCount=s?.issues?.filter(i=>i.severity==='critical').length||0
            return (
              <div key={d.id} className="dsh-row" onClick={()=>{setSelected(d); onDomainSelect?.(d); setActiveTab('overview')}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',cursor:'pointer',background:isActive?'rgba(16,185,129,0.07)':'transparent',borderLeft:`2px solid ${isActive?'#10b981':'transparent'}`}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:d.paused?'rgba(255,255,255,0.2)':!d.verified?'#f59e0b':sc,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:D.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.domain_name}</div>
                  <div style={{fontSize:10,color:D.muted}}>{!d.verified?'Pending verification':d.paused?'Paused':`${critCount>0?`${critCount} critical · `:''}${d.monitor_interval}`}</div>
                </div>
                {score!=null&&<span style={{fontSize:13,fontWeight:700,color:sc}}>{score}</span>}
                <div onClick={e=>{e.stopPropagation();setDeleteTarget(d)}} style={{color:'#9ca3af',cursor:'pointer',padding:2}}><Trash2 size={11}/></div>
              </div>
            )
          })}
        </div>
        {domains.length>0&&(()=>{
          const scored=domains.filter(d=>d.scan_results?.[0])
          const avg=scored.length?Math.round(scored.reduce((a,d)=>a+(d.scan_results[0].health_score||0),0)/scored.length):0
          const c=avg>=70?'#10b981':avg>=50?'#f59e0b':'#ef4444'
          return (
            <div style={{padding:'10px 14px',borderTop:`1px solid ${D.border}`}}>
              <div style={{fontSize:10,color:D.dim,marginBottom:4}}>Fleet avg score</div>
              <div style={{fontSize:22,fontWeight:700,color:c,lineHeight:1,marginBottom:5}}>{avg||'–'}</div>
              <AnimBar pct={avg} color={c} h={3}/>
              <div style={{fontSize:10,color:D.dim,marginTop:4}}>{domains.length} domain{domains.length>1?'s':''} · {domains.filter(d=>d.scan_results?.[0]?.issues?.some(i=>i.severity==='critical')).length} with critical issues</div>
            </div>
          )
        })()}
      </div>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <div style={{flex:1,overflowY:'auto',background:D.bg}}>
        {!selected?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:16}}>
            <Shield size={56} color="#e5e7eb"/>
            <div style={{fontSize:18,fontWeight:500,color:'rgba(255,255,255,0.25)'}}>Add a domain to get started</div>
            <button onClick={()=>setShowAdd(true)} style={{padding:'10px 24px',background:'#10b981',color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:7}}><Plus size={15}/> Add your first domain</button>
          </div>
        ):(
          <div>
            {/* ── DOMAIN HEADER ── */}
            <div className="no-print" style={{padding:'14px 20px',borderBottom:`1px solid ${D.border}`,background:D.surface}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                    <h2 style={{fontSize:17,fontWeight:700,color:D.text,margin:0}}>{selected.domain_name}</h2>
                    {selected.verified&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(16,185,129,0.15)',color:'#10b981',border:'1px solid rgba(16,185,129,0.25)',fontWeight:500}}>Verified</span>}
                    {selected.paused&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#f3f4f6',color:D.muted,fontWeight:500}}>Paused</span>}
                    {critical.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(239,68,68,0.15)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)',fontWeight:500}}>{critical.length} critical</span>}
                    {warns.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'rgba(245,158,11,0.15)',color:'#f59e0b',fontWeight:500}}>{warns.length} warnings</span>}
                  </div>
                  <div style={{fontSize:11,color:D.muted,display:'flex',gap:14,flexWrap:'wrap',marginBottom:10}}>
                    {scan?.blacklists?.ip&&<span style={{fontFamily:'monospace',color:'rgba(255,255,255,0.3)'}}>{scan.blacklists.ip}</span>}
                    <span>{selected.monitor_interval} monitoring</span>
                    {scan?.scanned_at&&<span>Scanned {timeAgo(scan.scanned_at)}</span>}
                  </div>
                  {/* Sub-nav tabs */}
                  <div style={{display:'flex',gap:0,borderBottom:`1px solid ${D.border}`,marginBottom:-14}}>
                    {tabs.map(t=>(
                      <button key={t} className="dsh-tab" onClick={()=>setActiveTab(t)}
                        style={{padding:'8px 14px',background:'transparent',border:'none',borderBottom:`2px solid ${activeTab===t?'#10b981':'transparent'}`,cursor:'pointer',fontSize:12,fontWeight:activeTab===t?600:400,color:activeTab===t?'#10b981':'rgba(255,255,255,0.4)',textTransform:'capitalize',transition:'all 0.15s',marginBottom:-1}}>
                        {t==='ssl'?'SSL/TLS':t==='dns'?'DNS Records':t.charAt(0).toUpperCase()+t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Score gauge */}
                {scan&&<Gauge score={scan.health_score} size={130}/>}
                {/* Actions */}
                <div style={{display:'flex',flexDirection:'column',gap:6,alignSelf:'flex-start'}}>
                  <button onClick={()=>triggerScan(selected)} disabled={scanning[selected.id]}
                    style={{padding:'6px 14px',background:'#10b981',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5}}>
                    {scanning[selected.id]?<><div style={{width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'dsh-spin 0.7s linear infinite'}}/>Scanning…</>:<><RefreshCw size={12}/>Scan now</>}
                  </button>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {[
                      {icon:selected.paused?Play:Pause,label:selected.paused?'Resume':'Pause',fn:async()=>{await supabase.from('domains').update({paused:!selected.paused}).eq('id',selected.id);fetchDomains()}},
                      {icon:ExternalLink,label:'Report',fn:()=>{setScanDomain(selected.domain_name);setScanType('website');setPage('scan')}},
                      {icon:FileDown,label:'PDF',fn:()=>window.print()},
                    ].map(b=>(
                      <button key={b.label} className="dsh-btn" onClick={b.fn}
                        style={{padding:'5px 10px',background:'#f3f4f6',color:'rgba(255,255,255,0.65)',border:'1px solid #e9ecef',borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:500,display:'flex',alignItems:'center',gap:4,transition:'background 0.15s'}}>
                        <b.icon size={11}/>{b.label}
                      </button>
                    ))}
                    {scan?.id&&<ShareButton domain={selected.domain_name} scanId={scan.id}/>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>

              {/* ══ OVERVIEW ══════════════════════════════════ */}
              {activeTab==='overview'&&scan&&(
                <>
                  {/* KPI row */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
                    {[
                      {label:'Health score',val:scan.health_score,color:getScoreColor(scan.health_score),sub:'out of 100',pct:scan.health_score},
                      {label:'Critical issues',val:critical.length,color:critical.length>0?'#ef4444':'#10b981',sub:critical.length>0?'Fix immediately':'All clear',pct:Math.min(critical.length*25,100)},
                      {label:'Blacklisted',val:`${scan.blacklists?.listed_count||0}/${scan.blacklists?.results?.length||0}`,color:(scan.blacklists?.listed_count||0)>0?'#ef4444':'#10b981',sub:'blacklists',pct:(scan.blacklists?.listed_count||0)>0?60:100},
                      {label:'DNS records',val:scan.dns_records?.length||0,color:'#3b82f6',sub:'records found',pct:100},
                    ].map(k=>(
                      <div key={k.label} className="print-card" style={{...card,padding:'13px 16px'}}>
                        <div style={{fontSize:11,color:D.muted,marginBottom:4}}>{k.label}</div>
                        <div style={{fontSize:24,fontWeight:700,color:k.color,lineHeight:1}}>{k.val}</div>
                        <div style={{fontSize:10,color:D.dim,marginTop:4}}>{k.sub}</div>
                        <div style={{height:3,background:'#f3f4f6',borderRadius:2,marginTop:8}}>
                          <div style={{height:'100%',width:`${k.pct}%`,borderRadius:2,background:k.color,transition:'width 0.8s ease'}}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Score history + Category breakdown */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div className="print-card" style={{...card,padding:'14px 16px'}}>
                      <div style={{fontSize:12,fontWeight:600,color:D.text,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                        <span style={{width:3,height:14,background:'#10b981',borderRadius:2,display:'inline-block'}}/>
                        Score history
                      </div>
                      <ScoreHistoryChart domainId={selected.id}/>
                    </div>
                    <div className="print-card" style={{...card}}>
                      <div style={{...cardHd}}>
                        <span style={{fontSize:12,fontWeight:600,color:D.text}}>Score breakdown</span>
                        <span style={{fontSize:10,color:D.dim}}>weighted 0–100</span>
                      </div>
                      <div style={{padding:'8px 16px'}}>
                        {cats.map((c,i)=>(
                          <div key={c.label} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                            <div style={{width:26,height:26,borderRadius:7,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              <c.icon size={13} color={c.color}/>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                                <span style={{fontSize:11,color:D.muted}}>{c.label}</span>
                                <span style={{fontSize:11,fontWeight:700,color:c.color}}>{c.score}<span style={{fontSize:10,color:D.dim,fontWeight:400}}>/{c.max}</span></span>
                              </div>
                              <AnimBar pct={Math.round((c.score/c.max)*100)} color={c.color} delay={i*80} h={5}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* DMARC Journey */}
                  <div className="print-card" style={{...card}}>
                    <div style={{...cardHd}}>
                      <span style={{fontSize:12,fontWeight:600,color:D.text}}>DMARC enforcement journey</span>
                      <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'rgba(239,68,68,0.15)',color:'#ef4444'}}>
                        Currently: p={scan.email_auth?.dmarc_raw?.match(/p=(\w+)/)?.[1]||'none'}
                      </span>
                    </div>
                    <DmarcJourney
                      currentPolicy={scan.email_auth?.dmarc_raw?.match(/p=(\w+)/)?.[1]||'none'}
                      onGenerate={()=>setPage('tools')}
                    />
                  </div>

                  {/* Issues */}
                  <div className="print-card" style={{...card}}>
                    <div style={{...cardHd}}>
                      <span style={{fontSize:12,fontWeight:600,color:D.text}}>Issues to fix</span>
                      <div style={{display:'flex',gap:5}}>
                        {critical.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'rgba(239,68,68,0.15)',color:'#ef4444'}}>{critical.length} critical</span>}
                        {warns.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'rgba(245,158,11,0.15)',color:'#f59e0b'}}>{warns.length} warnings</span>}
                      </div>
                    </div>
                    {issues.length===0?(
                      <div style={{padding:'32px',textAlign:'center'}}><CheckCircle size={32} color="#10b981" style={{marginBottom:8}}/><div style={{fontSize:13,color:D.muted}}>All checks passing</div></div>
                    ):issues.map((iss,i)=>(
                      <div key={i} className="dsh-issue" style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 16px',borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                        <div style={{width:22,height:22,borderRadius:6,background:`rgba(${iss.severity==='critical'?'239,68,68':iss.severity==='warn'?'245,158,11':'96,165,250'},0.15)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                          <AlertTriangle size={11} color={iss.severity==='critical'?'#ef4444':iss.severity==='warn'?'#f59e0b':'#60a5fa'}/>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                            <span style={{fontSize:12,fontWeight:700,color:D.text,fontFamily:'monospace'}}>{iss.type}</span>
                            <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:`rgba(${iss.severity==='critical'?'239,68,68':iss.severity==='warn'?'245,158,11':'96,165,250'},0.15)`,color:iss.severity==='critical'?'#ef4444':iss.severity==='warn'?'#f59e0b':'#60a5fa'}}>{iss.severity}</span>
                          </div>
                          <div style={{fontSize:11,color:D.muted,marginBottom:iss.fix?4:0}}>{iss.message}</div>
                          {iss.fix&&<div style={{fontSize:10,fontFamily:'monospace',color:'rgba(16,185,129,0.8)',padding:'3px 8px',background:'rgba(16,185,129,0.06)',borderRadius:5,display:'inline-block',wordBreak:'break-all'}}>{iss.fix}</div>}
                        </div>
                        {iss.fix&&['SPF','DMARC','CAA'].includes(iss.type)&&(
                          <AutoFixButton domainId={selected.id} issueType={iss.type} fixValue={iss.fix} domainName={selected.domain_name}/>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Monitor interval */}
                  <div style={{...card,padding:'14px 16px'}}>
                    <div style={{fontSize:12,fontWeight:600,color:D.text,marginBottom:10,display:'flex',alignItems:'center',gap:6}}><Clock size={13} color={D.muted}/> Monitor interval</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {['1h','6h','24h','off'].map(iv=>(
                        <button key={iv} onClick={()=>updateInterval(selected.id,iv)}
                          style={{padding:'7px 16px',background:selected.monitor_interval===iv?'rgba(16,185,129,0.15)':'rgba(255,255,255,0.04)',border:`1px solid ${selected.monitor_interval===iv?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.08)'}`,borderRadius:8,color:selected.monitor_interval===iv?'#10b981':'rgba(255,255,255,0.45)',fontSize:12,fontWeight:500,cursor:'pointer'}}>
                          {iv==='off'?'Off (manual)':iv==='1h'?'Every hour':iv==='6h'?'Every 6 hours':'Every 24 hours'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ══ EMAIL AUTH ════════════════════════════════ */}
              {activeTab==='email'&&scan?.email_auth&&(
                <div style={card}>
                  <div style={cardHd}><span style={{fontSize:12,fontWeight:600,color:D.text,display:'flex',alignItems:'center',gap:6}}><Mail size={13} color="#a78bfa"/> Email authentication</span></div>
                  {[
                    {name:'SPF',status:scan.email_auth.spf_status,val:scan.email_auth.spf_raw,note:scan.email_auth.spf_fix,extra:scan.email_auth.spf_lookups!=null?`${scan.email_auth.spf_lookups}/10 lookups`:null},
                    {name:'DKIM',status:scan.email_auth.dkim_status,val:scan.email_auth.dkim_selector?`Selector: ${scan.email_auth.dkim_selector}`:null,note:scan.email_auth.dkim_note},
                    {name:'DMARC',status:scan.email_auth.dmarc_status,val:scan.email_auth.dmarc_raw,note:scan.email_auth.dmarc_fix,suggest:scan.email_auth.dmarc_suggestion},
                    {name:'BIMI',status:scan.email_auth.bimi_status||'Not configured',val:scan.email_auth.bimi_raw,note:scan.email_auth.bimi_note},
                    {name:'MTA-STS',status:scan.email_auth.mta_sts_status||'Not configured',val:null,note:'Enforces TLS for all inbound mail delivery.'},
                    {name:'TLS-RPT',status:scan.email_auth.tls_rpt_status||'Not configured',val:null,note:'Enables TLS failure reporting.'},
                  ].map((r,i)=>(
                    <div key={r.name} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'12px 16px',borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                      <div style={{width:60,flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:D.text,fontFamily:'monospace'}}>{r.name}</div>
                        {r.extra&&<div style={{fontSize:10,color:D.dim,marginTop:3}}>{r.extra}</div>}
                      </div>
                      <div style={{flex:1}}>
                        {r.val&&<div style={{fontSize:11,fontFamily:'monospace',color:'rgba(255,255,255,0.45)',marginBottom:4,wordBreak:'break-all',padding:'4px 8px',background:'rgba(255,255,255,0.03)',borderRadius:5}}>{r.val}</div>}
                        {r.note&&<div style={{fontSize:11,color:D.muted,lineHeight:1.5}}>{r.note}</div>}
                        {r.suggest&&<div style={{marginTop:5,padding:'4px 8px',background:'rgba(16,185,129,0.06)',borderRadius:5,fontSize:10,fontFamily:'monospace',color:'rgba(16,185,129,0.8)',wordBreak:'break-all'}}>✦ {r.suggest}</div>}
                      </div>
                      <SBadge status={r.status}/>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ SSL ══════════════════════════════════════ */}
              {activeTab==='ssl'&&scan?.ssl_info&&(
                <div style={card}>
                  <div style={cardHd}>
                    <span style={{fontSize:12,fontWeight:600,color:D.text,display:'flex',alignItems:'center',gap:6}}><Lock size={13} color="#10b981"/> SSL / TLS</span>
                    <SBadge status={scan.ssl_info.overall_status}/>
                  </div>
                  {scan.ssl_info.certs?.map((cert,i)=>(
                    <div key={i} style={{padding:'16px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:12}}>
                        {[{l:'Domain',v:cert.domain},{l:'Protocol',v:cert.protocol||'TLS'},{l:'Key size',v:`${cert.key_size||'?'}-bit`},{l:'Chain',v:cert.chain_valid?'✓ Valid':'✗ Invalid'},{l:'CT log',v:cert.ct_log?'✓ Verified':'Not found'},{l:'HSTS',v:cert.hsts||'Not configured'}].map(f=>(
                          <div key={f.l} style={{padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:`1px solid ${D.border}`}}>
                            <div style={{fontSize:10,color:D.dim,marginBottom:4}}>{f.l}</div>
                            <div style={{fontSize:13,fontWeight:500,color:D.text}}>{f.v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{padding:'10px 14px',background:'rgba(96,165,250,0.06)',border:'1px solid rgba(96,165,250,0.15)',borderRadius:8,fontSize:12,color:'rgba(96,165,250,0.8)'}}>
                        ℹ {scan.ssl_info.note||'HTTPS connection established successfully.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══ PROPAGATION ══════════════════════════════ */}
              {activeTab==='propagation'&&scan?.propagation&&(
                <div style={card}>
                  <div style={cardHd}>
                    <span style={{fontSize:12,fontWeight:600,color:D.text,display:'flex',alignItems:'center',gap:6}}><Globe size={13} color="#3b82f6"/> Global propagation</span>
                    <SBadge status={scan.propagation.consistent?'Consistent':'Inconsistent'}/>
                  </div>
                  <div style={{padding:16,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
                    {[{key:'us',flag:'🇺🇸',name:'US West',sub:'1.1.1.1'},{key:'eu',flag:'🇪🇺',name:'EU',sub:'8.8.8.8'},{key:'apac',flag:'🌏',name:'APAC',sub:'OpenDNS'},{key:'au',flag:'🇦🇺',name:'AU',sub:'Quad9'}].map(reg=>{
                      const allPass=scan.propagation.records?.every(r=>r[reg.key]==='pass')
                      return (
                        <div key={reg.key} style={{padding:14,background:'rgba(255,255,255,0.03)',borderRadius:10,border:`1px solid ${allPass?'rgba(16,185,129,0.2)':'rgba(245,158,11,0.2)'}`}}>
                          <div style={{fontSize:22,marginBottom:4}}>{reg.flag}</div>
                          <div style={{fontSize:12,fontWeight:600,color:D.text}}>{reg.name}</div>
                          <div style={{fontSize:10,color:D.dim,marginBottom:10}}>{reg.sub}</div>
                          {scan.propagation.records?.map(rec=>(
                            <div key={rec.type} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:11,padding:'3px 0',borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                              <span style={{fontFamily:'monospace',color:D.muted}}>{rec.type}</span>
                              <div style={{width:8,height:8,borderRadius:'50%',background:rec[reg.key]==='pass'?'#10b981':'#f59e0b'}}/>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{display:'flex',gap:16,padding:'4px 16px 14px',fontSize:11,color:D.muted}}>
                    <span style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:7,height:7,borderRadius:'50%',background:'#10b981'}}/> Consistent</span>
                    <span style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:7,height:7,borderRadius:'50%',background:'#f59e0b'}}/> Inconsistent</span>
                  </div>
                </div>
              )}

              {/* ══ BLACKLISTS ════════════════════════════════ */}
              {activeTab==='blacklists'&&scan?.blacklists&&(
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                    {[{l:'IP address',v:scan.blacklists.ip||'–',c:'#a78bfa'},{l:'Lists checked',v:scan.blacklists.results?.length||0,c:'#3b82f6'},{l:'Listed on',v:scan.blacklists.listed_count||0,c:(scan.blacklists.listed_count||0)>0?'#ef4444':'#10b981'}].map(s=>(
                      <div key={s.l} style={{...card,padding:'14px 16px'}}>
                        <div style={{fontSize:11,color:D.muted,marginBottom:4}}>{s.l}</div>
                        <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={card}>
                    <div style={cardHd}><span style={{fontSize:12,fontWeight:600,color:D.text}}>Blacklist results</span></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                      {scan.blacklists.results?.map((bl,i)=>(
                        <div key={bl.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 16px',borderBottom:`1px solid rgba(255,255,255,0.04)`,background:bl.listed?'rgba(239,68,68,0.04)':'transparent'}}>
                          <span style={{fontSize:11,fontFamily:'monospace',color:bl.listed?'#ef4444':'rgba(255,255,255,0.35)'}}>{bl.name}</span>
                          <div style={{display:'flex',alignItems:'center',gap:5}}>
                            <div style={{width:6,height:6,borderRadius:'50%',background:bl.listed?'#ef4444':'#10b981'}}/>
                            <span style={{fontSize:10,color:bl.listed?'#ef4444':'#10b981',fontWeight:500}}>{bl.listed?'Listed':'Clean'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ DNS RECORDS ═══════════════════════════════ */}
              {activeTab==='dns'&&scan?.dns_records&&(
                <div style={card}>
                  <div style={cardHd}>
                    <span style={{fontSize:12,fontWeight:600,color:D.text}}>DNS records</span>
                    <span style={{fontSize:11,color:D.muted}}>{scan.dns_records.length} found</span>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead>
                        <tr style={{background:'#f9fafb'}}>
                          {['Type','Value','TTL','Status'].map(h=>(
                            <th key={h} style={{textAlign:'left',padding:'8px 16px',fontSize:10,fontWeight:600,color:D.muted,textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:`1px solid ${D.border}`}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scan.dns_records.map((r,i)=>(
                          <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                            <td style={{padding:'9px 16px'}}><span style={{fontSize:10,padding:'2px 8px',borderRadius:5,background:'rgba(96,165,250,0.15)',color:'#60a5fa',fontFamily:'monospace',fontWeight:700}}>{r.type}</span></td>
                            <td style={{padding:'9px 16px',fontFamily:'monospace',color:'rgba(255,255,255,0.45)',fontSize:11,maxWidth:380,wordBreak:'break-all'}}>{r.value}</td>
                            <td style={{padding:'9px 16px',fontFamily:'monospace',color:D.muted,fontSize:11,whiteSpace:'nowrap'}}>{r.ttl}s</td>
                            <td style={{padding:'9px 16px'}}><SBadge status={r.status||'Pass'}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {showAdd&&<AddDomainModal user={user} onClose={()=>setShowAdd(false)} onSuccess={fetchDomains}/>}
      {deleteTarget&&<DeleteModal domain={deleteTarget} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)} loading={deleteLoading}/>}
    </div>
  )
}
