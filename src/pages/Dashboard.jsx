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
    <a href="#" onClick={e=>{e.preventDefault();setState('idle')}} style={{fontSize:10,color:'#92400e',textDecoration:'none',whiteSpace:'nowrap'}}>
      Add DNS credentials in Settings →
    </a>
  )

  return (
    <div style={{flexShrink:0}}>
      {showConfirm && (
        <div style={{position:'absolute',right:16,zIndex:50,background:'#1d2330',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'12px 14px',width:260,boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
          <div style={{fontSize:12,fontWeight:600,color:'#fff',marginBottom:5}}>Push to {cred?.provider}?</div>
          <div style={{fontSize:10,fontFamily:'monospace',color:'#0f172a',marginBottom:2}}>Type: {mapping.type} · Name: {typeof mapping.name==='function'?mapping.name(domainName):mapping.name}</div>
          <div style={{fontSize:10,fontFamily:'monospace',color:'rgba(16,185,129,0.8)',background:'#f0fdf4',padding:'4px 8px',borderRadius:5,marginBottom:10,wordBreak:'break-all'}}>{fixValue?.slice(0,80)}</div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={execute} style={{flex:1,padding:'6px',background:'#00e5a0',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600}}>Confirm push</button>
            <button onClick={()=>setShowConfirm(false)} style={{padding:'6px 10px',background:'#f1f5f9',color:'rgba(255,255,255,0.6)',border:'none',borderRadius:6,cursor:'pointer',fontSize:11}}>Cancel</button>
          </div>
        </div>
      )}
      <button onClick={state==='idle'?loadCred:undefined} disabled={state==='loading'||state==='success'}
        style={{padding:'4px 10px',background:state==='success'?'rgba(16,185,129,0.15)':state==='error'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.12)',border:`1px solid ${state==='success'?'rgba(16,185,129,0.3)':state==='error'?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)'}`,borderRadius:6,color:state==='success'?'#00e5a0':state==='error'?'#ff4d6a':'#ffb224',fontSize:10,fontWeight:600,cursor:state==='idle'?'pointer':'default',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4}}>
        {state==='loading'&&<div style={{width:10,height:10,border:'2px solid rgba(245,158,11,0.3)',borderTopColor:'#ffb224',borderRadius:'50%',animation:'dsh-spin 0.7s linear infinite'}}/>}
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
  const c=score>=70?'#16a34a':score>=50?'#d97706':'#dc2626'
  const label=score>=90?'Excellent':score>=70?'Good':score>=50?'Fair':'Critical'
  return (
    <svg width={size} height={size*0.68} viewBox={`0 0 ${size} ${size*0.68}`}>
      {[...Array(9)].map((_,i)=>{
        const a=sa+(arc/8)*i
        const x1=cx+(r+5)*Math.cos(rad(a)),y1=cy+(r+5)*Math.sin(rad(a))
        const x2=cx+(r+10)*Math.cos(rad(a)),y2=cy+(r+10)*Math.sin(rad(a))
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth={i%4===0?2:1}/>
      })}
      <path d={path(sa,ea,r)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size*0.065} strokeLinecap="round"/>
      <path d={path(sa,ang,r)} fill="none" stroke={c} strokeWidth={size*0.065} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={r*0.38} fill={`${c}14`}/>
      <text x={cx} y={cy-2} textAnchor="middle" fill={c} fontSize={size*0.2} fontWeight="700" fontFamily="system-ui">{score??'–'}</text>
      <text x={cx} y={cy+size*0.09} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={size*0.085} fontFamily="system-ui">{label}</text>
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
    <div style={{height:h,background:'#f1f5f9',borderRadius:h/2,overflow:'hidden'}}>
      <div style={{height:'100%',borderRadius:h/2,width:`${w}%`,background:color,transition:'width 1s cubic-bezier(.4,0,.2,1)'}}/>
    </div>
  )
}

// ─── Share button ─────────────────────────────────────────────────────
function ShareButton({ domain, scanId }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  async function share() {
    if (!scanId || loading) return
    setLoading(true)
    try {
      // Reuse existing share if available
      const { data: existing } = await supabase.from('public_scan_shares').select('id').eq('scan_result_id', scanId).maybeSingle()
      let shareId = existing?.id
      if (!shareId) {
        const { data } = await supabase.from('public_scan_shares').insert({ scan_result_id: scanId, domain_name: domain }).select('id').single()
        shareId = data?.id
      }
      if (shareId) {
        const url = `${window.location.origin}?share=${shareId}`
        try { await navigator.clipboard.writeText(url) } catch {
          const el = document.createElement('textarea'); el.value = url
          document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
        }
        setCopied(true); setTimeout(() => setCopied(false), 2500)
      }
    } finally { setLoading(false) }
  }
  return (
    <button onClick={share} disabled={loading}
      style={{padding:'6px 12px',background:copied?'#f0fdf4':'#ffffff',color:copied?'#15803d':'#374151',border:`1px solid ${copied?'#86efac':'#e4e7ec'}`,borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:500,display:'flex',alignItems:'center',gap:5,transition:'all 0.15s',minWidth:80,justifyContent:'center'}}>
      {copied ? <><Check size={12}/>Copied!</> : loading ? <div style={{width:10,height:10,border:'2px solid #d1d5db',borderTopColor:'#374151',borderRadius:'50%',animation:'dsh-spin 0.7s linear infinite'}}/> : <><Share2 size={12}/>Share</>}
    </button>
  )
}

// ─── Delete modal ─────────────────────────────────────────────────────
function DeleteModal({ domain, onConfirm, onCancel, loading }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onCancel()}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,backdropFilter:'blur(4px)'}}>
      <div style={{background:'#ffffff',border:'1px solid #e4e7ec',borderRadius:16,maxWidth:400,width:'100%',margin:'0 16px',padding:24}}>
        <div style={{fontSize:16,fontWeight:700,color:'#111827',marginBottom:8}}>Delete domain?</div>
        <div style={{fontSize:13,color:'#374151',marginBottom:20}}>
          Permanently delete <span style={{color:'#ff4d6a',fontFamily:'monospace'}}>{domain?.domain_name}</span> and all scan history.
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'8px 16px',background:'#f9fafb',color:'#374151',border:'1px solid #e5e7eb',borderRadius:8,cursor:'pointer',fontSize:13}}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{padding:'8px 16px',background:'#ff4d6a',color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500}}>
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
    <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:pass?'#f0fdf4':fail?'#fef2f2':'#fffbeb',color:pass?'#16a34a':fail?'#dc2626':'#d97706',border:`1px solid ${pass?'#bbf7d0':fail?'#fecaca':'#fde68a'}`,fontWeight:500,whiteSpace:'nowrap'}}>
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
      const { data, error } = await supabase.functions.invoke('dns-scan', {
        body: { domain: domain.domain_name, scan_type:'website', save_to_db:true, domain_id:domain.id }
      })
      if (error) {
        console.error('Scan failed:', error)
        alert(`Scan failed for ${domain.domain_name}: ${error.message || 'Unknown error'}. Please try again.`)
        return
      }
      if (data?.error) {
        alert(`Scan error for ${domain.domain_name}: ${data.error}`)
        return
      }
      await fetchDomains()
    } catch (e) {
      console.error('Scan exception:', e)
      alert(`Scan failed: ${e.message}`)
    } finally {
      setScanning(s=>({...s,[domain.id]:false}))
    }
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

  const D={bg:'#f7f8fa',surface:'#ffffff',surface2:'#f7f8fa',border:'#e4e7ec',text:'#111827',muted:'#374151',dim:'#6b7280'}
  const card={background:'#ffffff',border:'1px solid #e4e7ec',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}
  const cardHd={padding:'12px 16px',borderBottom:'1px solid #f0f2f5',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fafafa'}

  const cats=scan?[
    {label:'DNS records',icon:Globe,color:'#3730a3',bg:'#eff6ff',score:scan.score_dns,max:25,tab:'dns'},
    {label:'Email auth',icon:Mail,color:'#dc2626',bg:'#fef2f2',score:scan.score_email,max:30,tab:'email'},
    {label:'SSL / TLS',icon:Lock,color:'#111827',bg:'#f0fdf4',score:scan.score_ssl,max:20},
    {label:'Propagation',icon:Globe,color:'#d97706',bg:'#fffbeb',score:scan.score_propagation,max:10,tab:'propagation'},
    {label:'Security',icon:Shield,color:'#4338ca',bg:'#f5f3ff',score:scan.score_security,max:10,tab:'overview'},
    {label:'Blacklists',icon:Ban,color:'#dc2626',bg:'#fef2f2',score:scan.score_blacklist,max:5,tab:'blacklists'},
  ]:[]

  const tabs=['overview','email','ssl','propagation','blacklists','dns']

  return (
    <div style={{display:'flex',height:'calc(100vh - 56px)',background:'#f7f8fa',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .dsh-row:hover{background:rgba(255,255,255,0.06)!important;transition:background 0.12s}
        .dsh-tab:hover{color:rgba(255,255,255,0.8)!important}
        .dsh-btn:hover{background:rgba(255,255,255,0.1)!important}
        .dsh-issue:hover{background:rgba(255,255,255,0.02)!important}
        @keyframes dsh-spin{to{transform:rotate(360deg)}}
        @media print{
          .no-print{display:none!important}
          body{background:#fff!important}
          .print-card{break-inside:avoid;background:#fff!important;border:1px solid #e5e7eb!important;color:#111!important}
        }
      `}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────── */}
      <div className="no-print" style={{width:220,flexShrink:0,background:'#ffffff',borderRight:'1px solid #e4e7ec',display:'flex',flexDirection:'column'}}>
        <div style={{padding:12,borderBottom:'1px solid #e5e7eb'}}>
          <button onClick={()=>setShowAdd(true)}
            style={{width:'100%',padding:'8px 12px',background:'#111827',border:'none',borderRadius:9,color:'#ffffff',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
            <Plus size={14}/> Add domain
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
          <div style={{fontSize:10,fontWeight:600,color:'#374151',textTransform:'uppercase',letterSpacing:'0.09em',padding:'4px 14px 6px'}}>Domains</div>
          {loading?[1,2].map(i=><div key={i} style={{margin:'4px 10px',height:44,borderRadius:8,background:'#f1f5f9'}}/>)
          :domains.map(d=>{
            const s=d.scan_results?.[0]; const score=s?.health_score; const isActive=selected?.id===d.id
            const sc=score>=70?'#16a34a':score>=50?'#d97706':'#dc2626'
            const critCount=s?.issues?.filter(i=>i.severity==='critical').length||0
            return (
              <div key={d.id} className="dsh-row" onClick={()=>{setSelected(d); onDomainSelect?.(d); setActiveTab('overview')}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',cursor:'pointer',background:isActive?'#f0fdf4':'transparent',borderLeft:`3px solid ${isActive?'#16a34a':'transparent'}`,transition:'background 0.12s'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:d.paused?'#4a5470':!d.verified?'#ffb224':sc,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:'#111827',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.domain_name}</div>
                  <div style={{fontSize:10,color:'#374151'}}>{!d.verified?'Pending verification':d.paused?'Paused':`${critCount>0?`${critCount} critical · `:''}${d.monitor_interval}`}</div>
                </div>
                {score!=null&&<span style={{fontSize:13,fontWeight:700,color:sc}}>{score}</span>}
                <div onClick={e=>{e.stopPropagation();setDeleteTarget(d)}} style={{color:'#374151',cursor:'pointer',padding:2}}><Trash2 size={11}/></div>
              </div>
            )
          })}
        </div>
        {domains.length>0&&(()=>{
          const scored=domains.filter(d=>d.scan_results?.[0])
          const avg=scored.length?Math.round(scored.reduce((a,d)=>a+(d.scan_results[0].health_score||0),0)/scored.length):0
          const c=avg>=70?'#16a34a':avg>=50?'#d97706':'#dc2626'
          return (
            <div style={{padding:'12px 14px',borderTop:'1px solid #f0f2f5',background:'#fafafa'}}>
              <div style={{fontSize:10,color:'#374151',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Fleet avg score</div>
              <div style={{fontSize:22,fontWeight:700,color:c,lineHeight:1,marginBottom:5}}>{avg||'–'}</div>
              <AnimBar pct={avg} color={c} h={3}/>
              <div style={{fontSize:10,color:'#374151',marginTop:4}}>{domains.length} domain{domains.length>1?'s':''} · {domains.filter(d=>d.scan_results?.[0]?.issues?.some(i=>i.severity==='critical')).length} with critical issues</div>
            </div>
          )
        })()}
      </div>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <div style={{flex:1,overflowY:'auto',background:D.bg}}>
        {!selected?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:16}}>
            <Shield size={56} color="rgba(255,255,255,0.06)"/>
            <div style={{fontSize:16,fontWeight:500,color:'#374151'}}>Add a domain to get started</div>
            <button onClick={()=>setShowAdd(true)} style={{padding:'10px 22px',background:'#111827',color:'#ffffff',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><Plus size={15}/> Add your first domain</button>
          </div>
        ):(
          <div>
            {/* ── DOMAIN HEADER ── */}
            <div className="no-print" style={{padding:'14px 20px',borderBottom:'1px solid #e4e7ec',background:'#ffffff'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                    <h2 style={{fontSize:17,fontWeight:700,color:'#111827',margin:0,letterSpacing:'-0.02em'}}>{selected.domain_name}</h2>
                    {selected.verified&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#f0fdf4',color:'#111827',border:'1px solid #bbf7d0',fontWeight:600}}>Verified</span>}
                    {selected.paused&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#f3f4f6',color:'#374151',border:'1px solid #e5e7eb',fontWeight:500}}>Paused</span>}
                    {critical.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',fontWeight:600}}>{critical.length} critical</span>}
                    {warns.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#fffbeb',color:'#d97706',border:'1px solid #fde68a',fontWeight:600}}>{warns.length} warnings</span>}
                  </div>
                  <div style={{fontSize:12,color:'#374151',display:'flex',gap:14,flexWrap:'wrap',marginBottom:10}}>
                    {scan?.blacklists?.ip&&<span style={{fontFamily:'monospace',color:'#0f172a'}}>{scan.blacklists.ip}</span>}
                    <span>{selected.monitor_interval} monitoring</span>
                    {scan?.scanned_at&&<span>Scanned {timeAgo(scan.scanned_at)}</span>}
                  </div>
                  {/* Sub-nav tabs */}
                  <div style={{display:'flex',gap:0,borderBottom:'1px solid #e4e7ec',marginBottom:-14}}>
                    {tabs.map(t=>(
                      <button key={t} className="dsh-tab" onClick={()=>setActiveTab(t)}
                        style={{padding:'8px 14px',background:'transparent',border:'none',borderBottom:`2px solid ${activeTab===t?'#111827':'transparent'}`,cursor:'pointer',fontSize:12,fontWeight:activeTab===t?600:400,color:activeTab===t?'#111827':'#9ca3af',textTransform:'capitalize',transition:'all 0.15s',marginBottom:-1}}>
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
                    style={{padding:'8px 18px',background:'#111827',color:'#ffffff',letterSpacing:'-0.01em',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:600,display:'flex',alignItems:'center',gap:5}}>
                    {scanning[selected.id]?<><div style={{width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'dsh-spin 0.7s linear infinite'}}/>Scanning…</>:<><RefreshCw size={12}/>Scan now</>}
                  </button>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {[
                      {icon:selected.paused?Play:Pause,label:selected.paused?'Resume':'Pause',fn:async()=>{await supabase.from('domains').update({paused:!selected.paused}).eq('id',selected.id);fetchDomains()}},
                      {icon:ExternalLink,label:'Report',fn:()=>{setScanDomain(selected.domain_name);setScanType('website');setPage('scan')}},
                      {icon:FileDown,label:'PDF',fn:()=>window.print()},
                    ].map(b=>(
                      <button key={b.label} className="dsh-btn" onClick={b.fn}
                        style={{padding:'6px 12px',background:'#ffffff',color:'#555555',border:'1px solid #e4e7ec',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:4,transition:'background 0.15s'}}>
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
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
                    {[
                      {label:'Health score',val:scan.health_score,color:getScoreColor(scan.health_score),sub:'out of 100',pct:scan.health_score,tab:'overview'},
                      {label:'Critical issues',val:critical.length,color:critical.length>0?'#dc2626':'#16a34a',sub:critical.length>0?'Fix immediately':'All clear',pct:Math.min(critical.length*25,100),tab:'overview'},
                      {label:'Blacklisted',val:`${scan.blacklists?.listed_count||0}/${scan.blacklists?.results?.length||0}`,color:(scan.blacklists?.listed_count||0)>0?'#dc2626':'#16a34a',sub:'blacklists',pct:(scan.blacklists?.listed_count||0)>0?60:100,tab:'blacklists'},
                      {label:'DNS records',val:scan.dns_records?.length||0,color:'#3730a3',sub:'records found',pct:100,tab:'dns'},
                    ].map(k=>(
                      <div key={k.label} className="print-card" onClick={()=>setActiveTab(k.tab)} style={{background:'#ffffff',border:'1px solid #e4e7ec',borderTop:`3px solid ${k.color}`,borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',transition:'transform 0.15s,box-shadow 0.15s',cursor:'pointer'}}
                        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.1)'}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'#6b7280',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.09em'}}>{k.label}</div>
                        <div style={{fontSize:34,fontWeight:800,color:'#111827',lineHeight:1,letterSpacing:'-0.04em',marginBottom:4}}>{k.val}</div>
                        <div style={{fontSize:12,color:'#6b7280',marginBottom:12}}>{k.sub}</div>
                        <div style={{height:4,background:'#f3f4f6',borderRadius:2}}>
                          <div style={{height:'100%',width:`${k.pct}%`,borderRadius:2,background:k.color,transition:'width 0.9s cubic-bezier(.4,0,.2,1)'}}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Score history + Category breakdown */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
                    <div className="print-card" style={{...card,padding:'14px 16px'}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#111827',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                        <span style={{width:3,height:14,background:'#16a34a',borderRadius:2,display:'inline-block'}}/>
                        Score history
                      </div>
                      <ScoreHistoryChart domainId={selected.id}/>
                    </div>
                    <div className="print-card" style={{...card}}>
                      <div style={{...cardHd}}>
                        <span style={{fontSize:12,fontWeight:700,color:'#111827'}}>Score breakdown</span>
                        <span style={{fontSize:10,color:'#374151'}}>weighted 0–100</span>
                      </div>
                      <div style={{padding:'8px 16px'}}>
                        {cats.map((c,i)=>(
                          <div key={c.label} onClick={()=>c.tab&&setActiveTab(c.tab)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',borderBottom:'1px solid #f3f4f6',cursor:'pointer',borderRadius:6,transition:'background 0.12s'}}
                            onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <div style={{width:26,height:26,borderRadius:7,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              <c.icon size={13} color={c.color}/>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                                <span style={{fontSize:12,color:'#374151'}}>{c.label}</span>
                                <span style={{fontSize:12,fontWeight:700,color:c.color}}>{c.score}<span style={{fontSize:10,color:'#374151',fontWeight:400}}>/{c.max}</span></span>
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
                      <span style={{fontSize:12,fontWeight:700,color:'#111827'}}>DMARC enforcement journey</span>
                      <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'rgba(239,68,68,0.15)',color:'#ff4d6a'}}>
                        Currently: p={scan.email_auth?.dmarc_raw?.match(/p=(\w+)/)?.[1]||'none'}
                      </span>
                    </div>
                    <DmarcJourney
                      currentPolicy={scan.email_auth?.dmarc_raw?.match(/p=(\w+)/)?.[1]||'none'}
                      onGenerate={()=>setPage('dmarc')}
                    />
                  </div>

                  {/* Issues */}
                  <div className="print-card" style={{...card}}>
                    <div style={{...cardHd}}>
                      <span style={{fontSize:12,fontWeight:700,color:'#111827'}}>Issues to fix</span>
                      <div style={{display:'flex',gap:5}}>
                        {critical.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'rgba(239,68,68,0.15)',color:'#ff4d6a'}}>{critical.length} critical</span>}
                        {warns.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'rgba(245,158,11,0.15)',color:'#92400e'}}>{warns.length} warnings</span>}
                      </div>
                    </div>
                    {issues.length===0?(
                      <div style={{padding:'32px',textAlign:'center'}}><CheckCircle size={32} color="#10b981" style={{marginBottom:8}}/><div style={{fontSize:13,color:'#374151'}}>All checks passing</div></div>
                    ):issues.map((iss,i)=>(
                      <div key={i} className="dsh-issue" style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 16px',borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                        <div style={{width:22,height:22,borderRadius:6,background:`rgba(${iss.severity==='critical'?'239,68,68':iss.severity==='warn'?'245,158,11':'96,165,250'},0.15)`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                          <AlertTriangle size={11} color={iss.severity==='critical'?'#ff4d6a':iss.severity==='warn'?'#ffb224':'#3d9bff'}/>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                            <span style={{fontSize:12,fontWeight:700,color:'#111827',fontFamily:'monospace'}}>{iss.type}</span>
                            <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:`rgba(${iss.severity==='critical'?'239,68,68':iss.severity==='warn'?'245,158,11':'96,165,250'},0.15)`,color:iss.severity==='critical'?'#ff4d6a':iss.severity==='warn'?'#ffb224':'#3d9bff'}}>{iss.severity}</span>
                          </div>
                          <div style={{fontSize:12,color:'#374151',marginBottom:iss.fix?4:0}}>{iss.message}</div>
                          {iss.fix&&<div style={{fontSize:10,fontFamily:'monospace',color:'rgba(16,185,129,0.8)',padding:'3px 8px',background:'#f0fdf4',borderRadius:5,display:'inline-block',wordBreak:'break-all'}}>{iss.fix}</div>}
                        </div>
                        {iss.fix&&['SPF','DMARC','CAA'].includes(iss.type)&&(
                          <AutoFixButton domainId={selected.id} issueType={iss.type} fixValue={iss.fix} domainName={selected.domain_name}/>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Monitor interval */}
                  <div style={{...card,padding:'14px 16px'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#111827',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><Clock size={13} color={D.muted}/> Monitor interval</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {['1h','6h','24h','off'].map(iv=>(
                        <button key={iv} onClick={()=>updateInterval(selected.id,iv)}
                          style={{padding:'7px 16px',background:selected.monitor_interval===iv?'#f0fdf4':'#fff',border:`1px solid ${selected.monitor_interval===iv?'#16a34a':'#e5e7eb'}`,borderRadius:8,color:selected.monitor_interval===iv?'#166534':'#374151',fontSize:12,fontWeight:500,cursor:'pointer'}}>
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
                  <div style={cardHd}><span style={{fontSize:12,fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:6}}><Mail size={13} color="#a78bfa"/> Email authentication</span></div>
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
                        <div style={{fontSize:13,fontWeight:700,color:'#111827',fontFamily:'monospace'}}>{r.name}</div>
                        {r.extra&&<div style={{fontSize:10,color:'#374151',marginTop:3}}>{r.extra}</div>}
                      </div>
                      <div style={{flex:1}}>
                        {r.val&&<div style={{fontSize:12,fontFamily:'monospace',color:'#0f172a',marginBottom:4,wordBreak:'break-all',padding:'4px 8px',background:'rgba(255,255,255,0.03)',borderRadius:5}}>{r.val}</div>}
                        {r.note&&<div style={{fontSize:12,color:'#374151',lineHeight:1.5}}>{r.note}</div>}
                        {r.suggest&&<div style={{marginTop:5,padding:'4px 8px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,fontSize:12,fontFamily:'monospace',color:'#166534',wordBreak:'break-all',padding:'6px 10px'}}>✦ {r.suggest}</div>}
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
                    <span style={{fontSize:12,fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:6}}><Lock size={13} color="#10b981"/> SSL / TLS</span>
                    <SBadge status={scan.ssl_info.overall_status}/>
                  </div>
                  {scan.ssl_info.certs?.map((cert,i)=>(
                    <div key={i} style={{padding:'16px'}}>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:12}}>
                        {[{l:'Domain',v:cert.domain},{l:'Protocol',v:cert.protocol||'TLS'},{l:'Key size',v:`${cert.key_size||'?'}-bit`},{l:'Chain',v:cert.chain_valid?'✓ Valid':'✗ Invalid'},{l:'CT log',v:cert.ct_log?'✓ Verified':'Not found'},{l:'HSTS',v:cert.hsts||'Not configured'}].map(f=>(
                          <div key={f.l} style={{padding:'10px 12px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:'1px solid #e5e7eb'}}>
                            <div style={{fontSize:10,color:'#374151',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>{f.l}</div>
                            <div style={{fontSize:13,fontWeight:500,color:'#111827'}}>{f.v}</div>
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
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {/* ── Visual propagation map ── */}
                  <div style={card}>
                    <div style={cardHd}>
                      <span style={{fontSize:12,fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:6}}><Globe size={13} color='#1d4ed8'/> Global propagation status</span>
                      <SBadge status={scan.propagation.consistent?'Consistent':'Inconsistent'}/>
                    </div>
                    <div style={{padding:'20px 24px'}}>
                      {/* World map — accurate simplified paths */}
                      <div style={{position:'relative',background:'#f0f7ff',borderRadius:10,border:'1px solid #e5e7eb',overflow:'hidden',marginBottom:16}}>
                        <svg viewBox='0 0 1010 530' style={{width:'100%',display:'block'}}>
                          <rect width='1010' height='530' fill='#dbeafe' rx='10'/>
                          {/* Accurate continent outlines — simplified natural earth */}
                          {/* North America */}
                          <path d='M120,80 L180,65 L230,70 L265,85 L280,110 L275,140 L260,165 L255,195 L240,215 L220,235 L200,250 L185,245 L175,225 L165,205 L155,195 L145,175 L130,165 L115,145 L105,125 L100,100 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='1.2'/>
                          {/* Greenland */}
                          <path d='M205,40 L235,35 L255,45 L250,65 L225,70 L205,60 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.8'/>
                          {/* Central America */}
                          <path d='M185,245 L200,250 L205,265 L195,275 L180,270 L175,255 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.8'/>
                          {/* South America */}
                          <path d='M190,285 L220,275 L245,285 L260,310 L262,345 L255,375 L240,405 L220,425 L200,430 L180,420 L165,395 L158,360 L160,325 L168,300 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='1.2'/>
                          {/* Europe */}
                          <path d='M430,75 L465,68 L495,72 L510,85 L505,105 L490,120 L470,128 L450,125 L435,115 L425,100 L425,85 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='1.2'/>
                          {/* Scandinavia */}
                          <path d='M460,50 L475,48 L485,60 L478,78 L462,80 L452,68 L455,55 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.8'/>
                          {/* UK */}
                          <path d='M415,80 L425,76 L428,88 L420,95 L412,90 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.8'/>
                          {/* Africa */}
                          <path d='M440,145 L480,138 L510,148 L525,170 L530,205 L525,245 L515,285 L500,320 L480,345 L458,352 L438,342 L422,315 L415,275 L415,235 L420,195 L428,165 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='1.2'/>
                          {/* Madagascar */}
                          <path d='M520,285 L528,280 L532,295 L528,312 L518,315 L514,300 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.6'/>
                          {/* Asia - main body */}
                          <path d='M510,60 L580,52 L650,55 L710,65 L760,75 L800,88 L820,105 L815,130 L790,150 L750,165 L700,172 L650,170 L600,165 L565,158 L535,148 L515,135 L505,115 L505,88 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='1.2'/>
                          {/* Indian subcontinent */}
                          <path d='M615,165 L640,168 L655,185 L650,210 L635,230 L618,235 L605,220 L600,200 L605,178 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='1'/>
                          {/* SE Asia peninsula */}
                          <path d='M700,170 L725,175 L738,192 L730,215 L710,222 L695,210 L690,190 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.8'/>
                          {/* Japan */}
                          <path d='M788,105 L798,100 L808,110 L802,125 L790,128 L783,118 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.8'/>
                          {/* Australia */}
                          <path d='M730,310 L785,302 L830,308 L860,325 L865,355 L850,380 L820,395 L785,398 L752,390 L728,370 L718,345 L720,320 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='1.2'/>
                          {/* New Zealand */}
                          <path d='M875,390 L882,385 L888,398 L882,410 L873,408 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.6'/>
                          {/* Indonesia - simplified */}
                          <path d='M730,255 L760,250 L785,258 L790,270 L770,275 L745,272 L728,265 Z' fill='#bfdbfe' stroke='#93c5fd' strokeWidth='0.8'/>

                          {/* Region nodes */}
                          {[
                            {key:'us',   name:'N. America',  x:175, y:158, flag:'🇺🇸', resolver:'1.1.1.1'},
                            {key:'eu',   name:'Europe',      x:468, y:100, flag:'🇪🇺', resolver:'8.8.8.8'},
                            {key:'apac', name:'Asia Pacific', x:690, y:130, flag:'🌏', resolver:'OpenDNS'},
                            {key:'au',   name:'Australia',   x:790, y:350, flag:'🇦🇺', resolver:'Quad9'},
                          ].map(reg => {
                            const allPass = scan.propagation.records?.every(r => r[reg.key]==='pass')
                            const nc = allPass ? '#16a34a' : '#d97706'
                            const bg = allPass ? '#dcfce7' : '#fef3c7'
                            const bd = allPass ? '#86efac' : '#fcd34d'
                            return (
                              <g key={reg.key}>
                                <circle cx={reg.x} cy={reg.y} r='22' fill={bg} stroke={bd} strokeWidth='1.5'/>
                                <circle cx={reg.x} cy={reg.y} r='9' fill={nc}/>
                                {allPass
                                  ? <path d={`M ${reg.x-5} ${reg.y} l 3.5 3.5 l 6 -6`} stroke='#fff' strokeWidth='2' fill='none' strokeLinecap='round' strokeLinejoin='round'/>
                                  : <text x={reg.x} y={reg.y+4} textAnchor='middle' fill='#fff' fontSize='10' fontWeight='800'>!</text>
                                }
                                <text x={reg.x} y={reg.y+35} textAnchor='middle' fill='#1e3a5f' fontSize='9.5' fontWeight='700'>{reg.name}</text>
                                <text x={reg.x} y={reg.y+47} textAnchor='middle' fill='#64748b' fontSize='8.5'>{allPass?'✓ Propagated':'✗ Inconsistent'}</text>
                              </g>
                            )
                          })}

                          {/* Legend */}
                          <circle cx='18' cy='515' r='6' fill='#16a34a'/>
                          <text x='30' y='519' fill='#374151' fontSize='11' fontWeight='500'>Propagated</text>
                          <circle cx='115' cy='515' r='6' fill='#d97706'/>
                          <text x='127' y='519' fill='#374151' fontSize='11' fontWeight='500'>Inconsistent</text>
                        </svg>
                      </div>

                      {/* Resolver detail rows */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
                        {[
                          {key:'us',   flag:'🇺🇸', name:'North America', resolver:'1.1.1.1 · Cloudflare'},
                          {key:'eu',   flag:'🇪🇺', name:'Europe',        resolver:'8.8.8.8 · Google'},
                          {key:'apac', flag:'🌏', name:'Asia Pacific',   resolver:'208.67.222.222 · OpenDNS'},
                          {key:'au',   flag:'🇦🇺', name:'Australia',     resolver:'9.9.9.9 · Quad9'},
                        ].map(reg => {
                          const allPass = scan.propagation.records?.every(r => r[reg.key]==='pass')
                          return (
                            <div key={reg.key} style={{background:allPass?'#f0fdf4':'#fffbeb',borderRadius:10,padding:'12px 14px',border:`1px solid ${allPass?'#bbf7d0':'#fde68a'}`}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                                <div style={{display:'flex',alignItems:'center',gap:7}}>
                                  <span style={{fontSize:18}}>{reg.flag}</span>
                                  <div>
                                    <div style={{fontSize:12,fontWeight:700,color:'#111827'}}>{reg.name}</div>
                                    <div style={{fontSize:10,color:'#6b7280',fontFamily:'monospace'}}>{reg.resolver}</div>
                                  </div>
                                </div>
                                <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:8,background:allPass?'#dcfce7':'#fef3c7',color:allPass?'#15803d':'#92400e'}}>
                                  {allPass?'✓ Consistent':'⚠ Inconsistent'}
                                </span>
                              </div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                                {scan.propagation.records?.map(rec => (
                                  <div key={rec.type} style={{display:'flex',alignItems:'center',gap:4,padding:'2px 8px',background:'rgba(255,255,255,0.7)',borderRadius:6,border:'1px solid rgba(0,0,0,0.06)'}}>
                                    <div style={{width:6,height:6,borderRadius:'50%',background:rec[reg.key]==='pass'?'#16a34a':'#d97706',flexShrink:0}}/>
                                    <span style={{fontSize:10,fontFamily:'monospace',color:'#374151',fontWeight:600}}>{rec.type}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ BLACKLISTS ════════════════════════════════ */}
              {activeTab==='blacklists'&&scan?.blacklists&&(
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                    {[{l:'IP address',v:scan.blacklists.ip||'–',c:'#a855f7'},{l:'Lists checked',v:scan.blacklists.results?.length||0,c:'#3d9bff'},{l:'Listed on',v:scan.blacklists.listed_count||0,c:(scan.blacklists.listed_count||0)>0?'#dc2626':'#16a34a'}].map(s=>(
                      <div key={s.l} style={{...card,padding:'14px 16px'}}>
                        <div style={{fontSize:12,color:'#374151',marginBottom:4}}>{s.l}</div>
                        <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={card}>
                    <div style={cardHd}><span style={{fontSize:12,fontWeight:700,color:'#111827'}}>Blacklist results</span></div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                      {scan.blacklists.results?.map((bl,i)=>(
                        <div key={bl.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 16px',borderBottom:`1px solid rgba(255,255,255,0.04)`,background:bl.listed?'rgba(239,68,68,0.04)':'transparent'}}>
                          <span style={{fontSize:12,fontFamily:'monospace',color:bl.listed?'#ff4d6a':'rgba(255,255,255,0.35)'}}>{bl.name}</span>
                          <div style={{display:'flex',alignItems:'center',gap:5}}>
                            <div style={{width:6,height:6,borderRadius:'50%',background:bl.listed?'#dc2626':'#16a34a'}}/>
                            <span style={{fontSize:10,color:bl.listed?'#dc2626':'#16a34a',fontWeight:500}}>{bl.listed?'Listed':'Clean'}</span>
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
                    <span style={{fontSize:12,fontWeight:700,color:'#111827'}}>DNS records</span>
                    <span style={{fontSize:12,color:'#374151'}}>{scan.dns_records.length} found</span>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead>
                        <tr style={{background:'rgba(255,255,255,0.02)'}}>
                          {['Type','Value','TTL','Status'].map(h=>(
                            <th key={h} style={{textAlign:'left',padding:'8px 16px',fontSize:10,fontWeight:600,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid #e5e7eb'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {scan.dns_records.map((r,i)=>(
                          <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                            <td style={{padding:'9px 16px'}}><span style={{fontSize:10,padding:'2px 8px',borderRadius:5,background:'rgba(96,165,250,0.15)',color:'#3730a3',fontFamily:'monospace',fontWeight:700}}>{r.type}</span></td>
                            <td style={{padding:'9px 16px',fontFamily:'monospace',color:'#0f172a',fontSize:12,maxWidth:380,wordBreak:'break-all'}}>{r.value}</td>
                            <td style={{padding:'9px 16px',fontFamily:'monospace',color:'#334155',fontSize:12,whiteSpace:'nowrap'}}>{r.ttl}s</td>
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
