import { useState, useEffect } from 'react'
import { Plus, Globe, Trash2, RefreshCw, Shield, Pause, Play, Clock, Mail, Lock, Ban, AlertTriangle, CheckCircle, Zap, FileDown, Share2, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddDomainModal from '../components/AddDomainModal'
import ScoreHistoryChart from '../components/ScoreHistoryChart'
import DmarcJourney from '../components/DmarcJourney'
import { timeAgo, getScoreColor } from '../lib/scoreEngine'

// ─── Auto-fix button ──────────────────────────────────────────────────

// ─── Compliance PDF export ────────────────────────────────────────────
function exportCompliancePDF(domain, scan) {
  if (!domain || !scan) return
  const score = scan.health_score || 0
  const issues = scan.issues || []
  const critical = issues.filter(i => i.severity === 'critical')
  const warns = issues.filter(i => i.severity === 'warn')
  const ea = scan.email_auth || {}
  const ssl = scan.ssl_info || {}
  const bl = scan.blacklists || {}
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const scoreColor = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  const scoreBg = score >= 70 ? '#f0fdf4' : score >= 50 ? '#fffbeb' : '#fef2f2'

  const checkRow = (label, status, detail = '') => {
    const ok = ['Pass', 'Valid', 'Consistent', 'Clean'].includes(status)
    const warn = ['Warn', 'Warning', 'Partial'].includes(status)
    const c = ok ? '#16a34a' : warn ? '#d97706' : '#dc2626'
    const bg = ok ? '#f0fdf4' : warn ? '#fffbeb' : '#fef2f2'
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">
        <span style="background:${bg};color:${c};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${status || 'Unknown'}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;font-family:monospace;">${detail}</td>
    </tr>`
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DNS Security Report — ${domain.domain_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Segoe UI', sans-serif; color: #111827; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24px; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 700; color: #111827; margin: 24px 0 10px; text-transform: uppercase; letter-spacing: 0.07em; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 20px; }
    th { background: #f9fafb; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid #e5e7eb; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6; }
    .score-box { text-align: center; padding: 14px 20px; background: ${scoreBg}; border-radius: 10px; border: 1px solid ${scoreColor}30; }
    .score-num { font-size: 40px; font-weight: 800; color: ${scoreColor}; line-height: 1; }
    .score-label { font-size: 11px; color: ${scoreColor}; font-weight: 600; margin-top: 4px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    .compliance-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .compliance-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 12px; color: #374151; border-bottom: 0.5px solid #e5e7eb; }
    .compliance-item:last-child { border-bottom: none; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${domain.domain_name}</h1>
      <div style="font-size:13px;color:#6b7280;margin-top:4px;">DNS &amp; Email Security Compliance Report</div>
      <div style="font-size:12px;color:#9ca3af;margin-top:2px;">Generated ${dateStr} by DomainRadar</div>
    </div>
    <div class="score-box">
      <div class="score-num">${score}</div>
      <div class="score-label">Health Score / 100</div>
    </div>
  </div>

  <h2>Compliance summary</h2>
  <div class="compliance-box">
    ${[
      { label: 'Google/Yahoo Bulk Sender Mandate (2024)', ok: ea.spf_status==='Pass' && ea.dkim_status==='Pass' && ea.dmarc_status!=='Missing' },
      { label: 'PCI DSS v4.0 — DMARC required', ok: ea.dmarc_status!=='Missing' && ea.dmarc_raw?.includes('p=reject') },
      { label: 'CISA BOD 18-01 — SPF + DMARC enforcement', ok: ea.spf_status==='Pass' && ea.dmarc_status!=='Missing' },
      { label: 'SSL/TLS — valid certificate', ok: ssl.overall_status==='Pass' },
      { label: 'Blacklist clean', ok: (bl.listed_count||0) === 0 },
    ].map(c => `<div class="compliance-item">
      <span style="font-size:16px;">${c.ok ? '✅' : '❌'}</span>
      <span>${c.label}</span>
      <span style="margin-left:auto;font-size:11px;font-weight:600;color:${c.ok?'#16a34a':'#dc2626'}">${c.ok ? 'Compliant' : 'Non-compliant'}</span>
    </div>`).join('')}
  </div>

  <h2>Email authentication</h2>
  <table>
    <tr><th>Check</th><th>Status</th><th>Detail</th></tr>
    ${checkRow('SPF record', ea.spf_status, ea.spf_raw?.slice(0,60))}
    ${checkRow('DKIM signing', ea.dkim_status, ea.dkim_selector ? `Selector: ${ea.dkim_selector}` : '')}
    ${checkRow('DMARC policy', ea.dmarc_status, ea.dmarc_raw?.slice(0,60))}
    ${checkRow('BIMI', ea.bimi_status || 'Not configured', '')}
    ${checkRow('MTA-STS', ea.mta_sts_status || 'Not configured', '')}
  </table>

  <h2>SSL certificate</h2>
  <table>
    <tr><th>Check</th><th>Status</th><th>Detail</th></tr>
    ${checkRow('Certificate validity', ssl.overall_status, ssl.note || '')}
  </table>

  <h2>Security</h2>
  <table>
    <tr><th>Check</th><th>Status</th><th>Detail</th></tr>
    ${checkRow('Blacklist status', (bl.listed_count||0)===0 ? 'Clean' : 'Listed', `${bl.listed_count||0} lists`)}
    ${checkRow('DNSSEC', scan.security?.dnssec_status || 'Not configured', '')}
    ${checkRow('CAA record', scan.security?.caa_status || 'Missing', '')}
  </table>

  ${issues.length > 0 ? `
  <h2>Issues to fix (${issues.length})</h2>
  <table>
    <tr><th>Type</th><th>Severity</th><th>Action required</th></tr>
    ${issues.map(i => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;">${i.type}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">
        <span style="background:${i.severity==='critical'?'#fef2f2':i.severity==='warn'?'#fffbeb':'#eff6ff'};color:${i.severity==='critical'?'#dc2626':i.severity==='warn'?'#d97706':'#2563eb'};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${i.severity}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${i.message}</td>
    </tr>`).join('')}
  </table>` : '<p style="color:#16a34a;font-weight:600;">✅ No issues detected</p>'}

  <div class="footer">
    <span>DomainRadar DNS Intelligence · dns-radar.vercel.app</span>
    <span>Scanned ${dateStr}</span>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `DomainRadar-${domain.domain_name}-${now.toISOString().slice(0,10)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function AutoFixBanner({ userId, setPage }) {
  const [hasCred, setHasCred] = useState(null) // null=loading, true, false
  useEffect(() => {
    if (!userId) return
    supabase.from('dns_credentials').select('id', { count:'exact', head:true }).eq('user_id', userId)
      .then(({ count }) => setHasCred((count||0) > 0))
  }, [userId])

  if (hasCred === null) return null // loading — show nothing
  if (hasCred) return (
    <div style={{margin:'0 16px 4px',padding:'9px 12px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,display:'flex',alignItems:'center',gap:8,fontSize:12}}>
      <span style={{fontSize:16}}>⚡</span>
      <span style={{color:'#166534',fontWeight:500}}>DNS credentials connected — click <strong>Auto-fix</strong> on any issue to push the record directly to your DNS provider.</span>
    </div>
  )
  return (
    <div style={{margin:'0 16px 4px',padding:'9px 12px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,fontSize:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:16}}>🔑</span>
        <span style={{color:'#92400e'}}>Connect Cloudflare or GoDaddy to enable <strong>one-click auto-fix</strong> for DNS issues.</span>
      </div>
      <button onClick={()=>setPage('autofix')} style={{padding:'5px 12px',background:'#111827',color:'#fff',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit'}}>
        Add credentials →
      </button>
    </div>
  )
}

const CAA_VENDORS = [
  { id:'letsencrypt', label:"Let's Encrypt", domain:'letsencrypt.org',  icon:'🔒', note:'Free, auto-renewal' },
  { id:'digicert',    label:'DigiCert',      domain:'digicert.com',      icon:'🛡️', note:'Enterprise CA' },
  { id:'sectigo',     label:'Sectigo',       domain:'sectigo.com',       icon:'🔐', note:'Comodo / Sectigo' },
  { id:'zerossl',     label:'ZeroSSL',       domain:'zerossl.com',       icon:'🔑', note:'Free alternative' },
  { id:'globalsign',  label:'GlobalSign',    domain:'globalsign.com',    icon:'🌐', note:'Global enterprise' },
  { id:'entrust',     label:'Entrust',       domain:'entrust.net',       icon:'🏛️', note:'Government & enterprise' },
  { id:'amazon',      label:'Amazon (ACM)',  domain:'amazon.com',        icon:'☁️', note:'AWS Certificate Manager' },
  { id:'google',      label:'Google (GTS)',  domain:'pki.goog',          icon:'🔵', note:'Google Trust Services' },
]

function AutoFixButton({ domainId, issueType, fixValue, domainName }) {
  const [state, setState] = useState('idle')
  const [cred, setCred] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [caaVendors, setCaaVendors] = useState(['letsencrypt'])
  const [caaMode, setCaaMode] = useState('issue') // issue | issuewild | iodef

  const RECORD_MAP = {
    SPF:   { type:'TXT', name:'@',                         label:'SPF record' },
    DMARC: { type:'TXT', name:d=>`_dmarc.${d}`,            label:'DMARC record' },
    CAA:   { type:'CAA', name:'@',                         label:'CAA record' },
    DKIM:  { type:'TXT', name:d=>`default._domainkey.${d}`,label:'DKIM record' },
  }
  const mapping = RECORD_MAP[issueType]
  if (!mapping || !fixValue) return null

  // Build CAA record content from selected vendors
  const caaRecordLines = issueType === 'CAA'
    ? CAA_VENDORS.filter(v => caaVendors.includes(v.id))
        .map(v => `0 ${caaMode} "${v.domain}"`)
        .join('\n') || '0 issue "letsencrypt.org"'
    : null

  const effectiveFixValue = issueType === 'CAA' ? caaRecordLines.split('\n')[0] : fixValue

  async function loadCred() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('dns_credentials')
      .select('id,provider,label,verified')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
    if (!data?.length) { setState('no-cred'); return }
    setCred(data[0]); setShowConfirm(true)
  }

  async function execute() {
    setState('loading'); setShowConfirm(false)
    const { data: { session } } = await supabase.auth.getSession()
    const recordName = typeof mapping.name === 'function' ? mapping.name(domainName) : domainName

    if (issueType === 'CAA') {
      // Push one record per selected vendor
      const lines = caaRecordLines.split('\n')
      let allOk = true
      for (const content of lines) {
        const res = await supabase.functions.invoke('dns-autofix', {
          body: { credential_id: cred.id, domain_id: domainId, action:'create', record_type:'CAA', record_name: recordName, record_content: content, record_ttl: 300 },
          headers: { Authorization: `Bearer ${session?.access_token}` }
        })
        if (!res.data?.success) { allOk = false }
      }
      setState(allOk ? 'success' : 'error')
    } else {
      const res = await supabase.functions.invoke('dns-autofix', {
        body: { credential_id: cred.id, domain_id: domainId, action:'create', record_type: mapping.type, record_name: recordName, record_content: fixValue, record_ttl: 300 },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      setState(res.data?.success ? 'success' : 'error')
    }
    if (state !== 'error') setTimeout(() => setState('idle'), 5000)
  }

  if (state === 'no-cred') return (
    <button onClick={()=>setState('idle')} style={{fontSize:11,color:'#d97706',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:6,padding:'3px 9px',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
      Add DNS credentials first
    </button>
  )

  return (
    <div style={{flexShrink:0,position:'relative'}}>
      {showConfirm && (
        <div style={{position:'absolute',right:0,bottom:'calc(100% + 8px)',zIndex:200,background:'#fff',border:'1px solid #e5e7eb',borderRadius:14,padding:'16px',width: issueType==='CAA' ? 340 : 300,boxShadow:'0 12px 32px rgba(0,0,0,0.14)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#111827',marginBottom:4}}>Push to {cred?.provider}</div>
          <div style={{fontSize:11,color:'#6b7280',marginBottom:12}}>Create/update <strong>{mapping.label}</strong> on your DNS</div>

          {/* CAA vendor picker */}
          {issueType === 'CAA' && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:'#374151',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span>Select certificate authorities</span>
                <div style={{display:'flex',gap:4}}>
                  {['issue','issuewild'].map(m=>(
                    <button key={m} onClick={()=>setCaaMode(m)}
                      style={{fontSize:10,padding:'2px 7px',borderRadius:5,border:`1px solid ${caaMode===m?'#111827':'#e5e7eb'}`,background:caaMode===m?'#111827':'#fff',color:caaMode===m?'#fff':'#6b7280',cursor:'pointer',fontFamily:'inherit'}}>
                      {m==='issue'?'Standard':'Wildcard'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:220,overflowY:'auto'}}>
                {CAA_VENDORS.map(v=>{
                  const sel = caaVendors.includes(v.id)
                  return (
                    <label key={v.id} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 10px',border:`1px solid ${sel?'#86efac':'#f0f2f5'}`,borderRadius:8,cursor:'pointer',background:sel?'#f0fdf4':'#fff',transition:'all 0.12s'}}>
                      <input type="checkbox" checked={sel}
                        onChange={e=>setCaaVendors(prev=>e.target.checked?[...prev,v.id]:prev.filter(x=>x!==v.id))}
                        style={{width:14,height:14,accentColor:'#16a34a',flexShrink:0}}/>
                      <span style={{fontSize:16,flexShrink:0}}>{v.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#111827'}}>{v.label}</div>
                        <div style={{fontSize:10,color:'#6b7280',fontFamily:'monospace'}}>{v.domain}</div>
                      </div>
                      <span style={{fontSize:10,color:'#9ca3af',flexShrink:0}}>{v.note}</span>
                    </label>
                  )
                })}
              </div>
              {/* Preview */}
              <div style={{marginTop:8,padding:'6px 9px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:7,fontSize:11,fontFamily:'monospace',color:'#1e293b',lineHeight:1.8,wordBreak:'break-all'}}>
                {caaVendors.length===0
                  ? <span style={{color:'#9ca3af'}}>Select at least one CA above</span>
                  : CAA_VENDORS.filter(v=>caaVendors.includes(v.id)).map(v=>(
                      <div key={v.id}>0 {caaMode} &quot;{v.domain}&quot;</div>
                    ))
                }
              </div>
            </div>
          )}

          {/* Non-CAA record preview */}
          {issueType !== 'CAA' && (
            <div style={{fontSize:11,fontFamily:'monospace',color:'#1e293b',background:'#f8fafc',border:'1px solid #e2e8f0',padding:'7px 9px',borderRadius:8,marginBottom:12,wordBreak:'break-all',lineHeight:1.6}}>
              {fixValue?.slice(0,140)}{fixValue?.length>140?'…':''}
            </div>
          )}

          <div style={{display:'flex',gap:6,marginTop:4}}>
            <button onClick={execute} disabled={issueType==='CAA'&&caaVendors.length===0}
              style={{flex:1,padding:'8px',background: caaVendors.length===0&&issueType==='CAA'?'#9ca3af':'#111827',color:'#fff',border:'none',borderRadius:8,cursor: caaVendors.length===0&&issueType==='CAA'?'not-allowed':'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
              ⚡ Push {issueType==='CAA'&&caaVendors.length>1?`${caaVendors.length} records`:'record'}
            </button>
            <button onClick={()=>setShowConfirm(false)} style={{padding:'8px 12px',background:'#f9fafb',color:'#374151',border:'1px solid #e5e7eb',borderRadius:8,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <button onClick={state==='idle'?loadCred:undefined} disabled={state==='loading'||state==='success'}
        style={{padding:'5px 12px',background:state==='success'?'#f0fdf4':state==='error'?'#fef2f2':'#f0fdf4',border:`1px solid ${state==='success'?'#86efac':state==='error'?'#fecaca':'#86efac'}`,borderRadius:7,color:state==='success'?'#16a34a':state==='error'?'#dc2626':'#15803d',fontSize:11,fontWeight:600,cursor:state==='idle'?'pointer':'default',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5,fontFamily:'inherit',transition:'all 0.15s'}}
        onMouseEnter={e=>{if(state==='idle')e.currentTarget.style.background='#dcfce7'}}
        onMouseLeave={e=>{if(state==='idle')e.currentTarget.style.background='#f0fdf4'}}>
        {state==='loading'&&<div style={{width:10,height:10,border:'2px solid #d1d5db',borderTopColor:'#16a34a',borderRadius:'50%',animation:'dsh-spin 0.7s linear infinite'}}/>}
        {state==='idle'    && '⚡ Auto-fix'}
        {state==='loading' && 'Pushing…'}
        {state==='success' && '✓ Pushed!'}
        {state==='error'   && '✗ Failed — retry'}
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

// ─── Issues panel (collapsible) ──────────────────────────────────────
function IssuesPanel({ issues, critical, warns, scan, selected, user, setPage }) {
  const [expanded, setExpanded] = useState(critical.length > 0) // auto-open if critical

  const allClear = issues.length === 0
  const headerBg = allClear ? '#f0fdf4' : critical.length > 0 ? '#fef2f2' : '#fffbeb'
  const headerBd = allClear ? '#bbf7d0' : critical.length > 0 ? '#fecaca' : '#fde68a'
  const headerColor = allClear ? '#15803d' : critical.length > 0 ? '#dc2626' : '#d97706'

  return (
    <div className="print-card" style={{background:'#fff', border:`1px solid ${expanded ? '#e5e7eb' : headerBd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>

      {/* Collapsed header */}
      <div onClick={() => setExpanded(e => !e)}
        style={{padding:'11px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none',
          background: expanded ? '#fafafa' : headerBg, borderBottom: expanded ? '1px solid #f0f2f5' : 'none'}}>

        {/* Icon */}
        <div style={{width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background: allClear ? '#dcfce7' : critical.length > 0 ? '#fecaca' : '#fde68a',
          border: `1px solid ${headerBd}`}}>
          {allClear
            ? <CheckCircle size={15} color="#16a34a"/>
            : <AlertTriangle size={15} color={headerColor}/>
          }
        </div>

        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:700, color:'#111827'}}>
            {allClear ? 'All checks passing' : `${issues.length} issue${issues.length!==1?'s':''} to fix`}
          </div>
          <div style={{fontSize:11, color:'#6b7280', marginTop:1}}>
            {allClear
              ? `No issues detected on ${selected?.domain_name}`
              : [
                  critical.length > 0 && `${critical.length} critical`,
                  warns.length > 0 && `${warns.length} warning${warns.length!==1?'s':''}`,
                  issues.filter(i=>i.severity==='info').length > 0 && `${issues.filter(i=>i.severity==='info').length} info`,
                ].filter(Boolean).join(' · ')
            }
          </div>
        </div>

        {/* Badge pills */}
        <div style={{display:'flex', gap:5, alignItems:'center'}}>
          {critical.length > 0 && <span style={{fontSize:10, padding:'2px 7px', borderRadius:8, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', fontWeight:600}}>{critical.length} critical</span>}
          {warns.length > 0    && <span style={{fontSize:10, padding:'2px 7px', borderRadius:8, background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a', fontWeight:600}}>{warns.length} warn</span>}
          <span style={{fontSize:12, color:'#9ca3af', transform: expanded?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block', marginLeft:4}}>▼</span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Auto-fix banner */}
          {issues.some(i=>['SPF','DMARC','CAA','DKIM'].includes(i.type)) && (
            <AutoFixBanner userId={user?.id} setPage={setPage}/>
          )}

          {allClear ? (
            <div style={{padding:'28px', textAlign:'center'}}>
              <CheckCircle size={28} color="#16a34a" style={{marginBottom:8}}/>
              <div style={{fontSize:13, fontWeight:600, color:'#111827'}}>All checks passing</div>
              <div style={{fontSize:12, color:'#6b7280', marginTop:4}}>No issues detected on {selected?.domain_name}</div>
            </div>
          ) : issues.map((iss, i) => {
            const fixVal = iss.type==='SPF'   ? (scan.email_auth?.spf_raw || 'v=spf1 include:_spf.google.com ~all')
                         : iss.type==='DMARC' ? (scan.email_auth?.dmarc_suggestion || scan.email_auth?.dmarc_raw || `v=DMARC1; p=quarantine; rua=mailto:dmarc@${selected?.domain_name}; adkim=s; aspf=s`)
                         : iss.type==='CAA'   ? '0 issue "letsencrypt.org"'
                         : iss.fix
            const canAutoFix = ['SPF','DMARC','CAA'].includes(iss.type) && fixVal
            const sevColor = iss.severity==='critical'?'#dc2626':iss.severity==='warn'?'#d97706':'#2563eb'
            const sevBg    = iss.severity==='critical'?'#fef2f2':iss.severity==='warn'?'#fffbeb':'#eff6ff'
            const sevBd    = iss.severity==='critical'?'#fecaca':iss.severity==='warn'?'#fde68a':'#bfdbfe'
            return (
              <div key={i} style={{display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px',
                borderBottom: i < issues.length-1 ? '1px solid #f3f4f6' : 'none',
                background: iss.severity==='critical' ? '#fefafa' : 'transparent'}}>
                <div style={{width:28, height:28, borderRadius:8, background:sevBg, border:`1px solid ${sevBd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1}}>
                  <AlertTriangle size={13} color={sevColor}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap'}}>
                    <span style={{fontSize:13, fontWeight:700, color:'#111827'}}>{iss.type}</span>
                    <span style={{fontSize:10, padding:'2px 7px', borderRadius:8, background:sevBg, color:sevColor, border:`1px solid ${sevBd}`, fontWeight:600}}>{iss.severity}</span>
                  </div>
                  <div style={{fontSize:12, color:'#374151', lineHeight:1.6, marginBottom:canAutoFix?6:0}}>{iss.message}</div>
                  {canAutoFix && (
                    <div style={{fontSize:11, fontFamily:'monospace', color:'#1e293b', background:'#f8fafc', border:'1px solid #e2e8f0', padding:'4px 9px', borderRadius:6, display:'inline-block', wordBreak:'break-all', marginTop:2, maxWidth:'100%', lineHeight:1.5}}>
                      {fixVal?.slice(0,120)}{fixVal?.length>120?'…':''}
                    </div>
                  )}
                  {!canAutoFix && iss.fix && (
                    <div style={{fontSize:11, color:'#6b7280', marginTop:3, lineHeight:1.5}}>{iss.fix}</div>
                  )}
                </div>
                {canAutoFix && (
                  <AutoFixButton domainId={selected.id} issueType={iss.type} fixValue={fixVal} domainName={selected?.domain_name}/>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}


// ─── Embeddable badge button ─────────────────────────────────────────
function BadgeButton({ domain, score }) {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  const color = score >= 70 ? '16a34a' : score >= 50 ? 'd97706' : 'dc2626'
  const label = score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'
  const badgeUrl = `https://img.shields.io/badge/DNS%20Health-${score}%2F100%20${encodeURIComponent(label)}-${color}?style=flat-square&logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDE4Yy00LjQyIDAtOC0zLjU4LTgtOHMzLjU4LTggOC04IDggMy41OCA4IDgtMy41OCA4LTggOHoiLz48L3N2Zz4=`
  const markdownBadge = `[![DNS Health](${badgeUrl})](https://dns-radar.vercel.app)`
  const htmlBadge = `<a href="https://dns-radar.vercel.app"><img src="${badgeUrl}" alt="DNS Health: ${score}/100"/></a>`

  function copy(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{position:'relative', flexShrink:0}}>
      <button onClick={() => setShow(s => !s)}
        style={{padding:'6px 12px', background:'#fff', color:'#555', border:'1px solid #e4e7ec', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:4, transition:'background 0.15s'}}>
        🏅 Badge
      </button>
      {show && (
        <div style={{position:'absolute', right:0, top:'calc(100% + 6px)', zIndex:100, background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'14px 16px', width:320, boxShadow:'0 8px 24px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:13, fontWeight:700, color:'#111827', marginBottom:8}}>Embeddable health badge</div>
          <div style={{marginBottom:10}}>
            <img src={badgeUrl} alt={`DNS Health: ${score}/100`} style={{height:20}}/>
          </div>
          <div style={{fontSize:11, color:'#6b7280', marginBottom:6}}>Markdown (README)</div>
          <div style={{display:'flex', gap:6, marginBottom:10}}>
            <div style={{flex:1, fontFamily:'monospace', fontSize:10, color:'#374151', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'6px 8px', wordBreak:'break-all', lineHeight:1.5}}>
              {markdownBadge.slice(0, 80)}…
            </div>
            <button onClick={() => copy(markdownBadge)} style={{padding:'6px 10px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #86efac', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit'}}>
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          <div style={{fontSize:11, color:'#6b7280', marginBottom:6}}>HTML</div>
          <div style={{display:'flex', gap:6}}>
            <div style={{flex:1, fontFamily:'monospace', fontSize:10, color:'#374151', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'6px 8px', wordBreak:'break-all', lineHeight:1.5}}>
              {htmlBadge.slice(0, 80)}…
            </div>
            <button onClick={() => copy(htmlBadge)} style={{padding:'6px 10px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #86efac', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit'}}>
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          <div style={{fontSize:11, color:'#9ca3af', marginTop:10, lineHeight:1.5}}>
            Badge auto-updates when you rescan. Embed in your README or website.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Onboarding checklist ────────────────────────────────────────────
function OnboardingChecklist({ scan, domain, setPage, setActiveTab }) {
  const ea = scan?.email_auth || {}
  const ssl = scan?.ssl_info || {}
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(`dr_onboard_${domain?.id}`) === '1' } catch { return false }
  })
  const [expanded, setExpanded] = useState(false)

  const steps = [
    { id:'domain',  done: !!domain?.verified,              label:'Domain verified',           action: null },
    { id:'scan',    done: !!scan,                           label:'First scan completed',       action: null },
    { id:'spf',     done: ea.spf_status === 'Pass',        label:'SPF record configured',      action: ()=>setActiveTab('email'), cta:'Fix SPF →' },
    { id:'dkim',    done: ea.dkim_status === 'Pass',       label:'DKIM signing enabled',       action: ()=>setPage('autofix'),    cta:'Set up DKIM →' },
    { id:'dmarc',   done: !['Missing','Fail'].includes(ea.dmarc_status), label:'DMARC policy set', action: ()=>setPage('dmarc'), cta:'Configure DMARC →' },
    { id:'ssl',     done: ssl.overall_status === 'Pass',   label:'SSL certificate valid',      action: ()=>setPage('ssl'),        cta:'Check SSL →' },
  ]

  const doneCount = steps.filter(s => s.done).length
  const allDone = doneCount === steps.length
  const pct = Math.round((doneCount / steps.length) * 100)

  function dismiss(e) {
    e.stopPropagation()
    setDismissed(true)
    try { localStorage.setItem(`dr_onboard_${domain?.id}`, '1') } catch {}
  }

  if (dismissed) return null

  return (
    <div style={{background:'#fff', border:`1px solid ${allDone?'#bbf7d0':'#e5e7eb'}`, borderRadius:12, overflow:'hidden', marginBottom:14, boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
      {/* Collapsed header — always visible */}
      <div onClick={() => setExpanded(e => !e)}
        style={{padding:'10px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none',
          background: allDone ? '#f0fdf4' : '#fff'}}>
        {/* Mini progress bar */}
        <div style={{width:32, height:32, borderRadius:'50%', flexShrink:0, position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
          background:`conic-gradient(#16a34a ${pct*3.6}deg, #f3f4f6 0deg)`}}>
          <div style={{width:22, height:22, borderRadius:'50%', background: allDone?'#f0fdf4':'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span style={{fontSize:10, fontWeight:800, color: allDone?'#16a34a':'#374151'}}>{doneCount}/{steps.length}</span>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:600, color:'#111827'}}>
            {allDone ? '🎉 Domain fully configured!' : 'Setup checklist'}
          </div>
          {!allDone && (
            <div style={{fontSize:11, color:'#6b7280', marginTop:1}}>
              {steps.filter(s=>!s.done).slice(0,2).map(s=>s.label).join(' · ')}
              {steps.filter(s=>!s.done).length > 2 ? ` · +${steps.filter(s=>!s.done).length-2} more` : ''}
            </div>
          )}
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{fontSize:11, color:'#9ca3af'}}>{expanded ? 'Collapse' : 'Expand'}</span>
          <span style={{fontSize:12, color:'#9ca3af', transform: expanded?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block'}}>▼</span>
          <button onClick={dismiss}
            style={{background:'none', border:'none', color:'#d1d5db', cursor:'pointer', fontSize:16, lineHeight:1, padding:'0 0 0 4px'}}
            title="Dismiss">✕</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{height:3, background:'#f3f4f6'}}>
        <div style={{height:'100%', width:`${pct}%`, background:'#16a34a', transition:'width 0.5s ease'}}/>
      </div>

      {/* Expanded steps */}
      {expanded && (
        <div style={{padding:'4px 16px 12px'}}>
          {steps.map((step, i) => (
            <div key={step.id} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0',
              borderBottom: i < steps.length-1 ? '1px solid #f9fafb' : 'none'}}>
              <div style={{width:22, height:22, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                background: step.done ? '#16a34a' : '#f3f4f6',
                border: step.done ? 'none' : '2px solid #d1d5db'}}>
                {step.done && <span style={{color:'#fff', fontSize:11, fontWeight:800}}>✓</span>}
              </div>
              <span style={{flex:1, fontSize:12, color: step.done?'#9ca3af':'#111827',
                fontWeight: step.done ? 400 : 500,
                textDecoration: step.done ? 'line-through' : 'none'}}>
                {step.label}
              </span>
              {!step.done && step.action && (
                <button onClick={step.action}
                  style={{padding:'4px 11px', background:'#f0fdf4', color:'#15803d', border:'1px solid #86efac', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap'}}>
                  {step.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
          :domains.map((d,di)=>{
            const s=d.scan_results?.[0]; const score=s?.health_score; const isActive=selected?.id===d.id
            const sc=score>=70?'#16a34a':score>=50?'#d97706':'#dc2626'
            const critCount=s?.issues?.filter(i=>i.severity==='critical').length||0
            return (
              <div key={d.id} className="dsh-row" onClick={()=>{setSelected(d); onDomainSelect?.(d); setActiveTab('overview')}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',cursor:'pointer',background:isActive?'#f0fdf4':'transparent',borderLeft:`3px solid ${isActive?'#16a34a':'transparent'}`,transition:'background 0.12s'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:d.paused?'#4a5470':!d.verified?'#ffb224':sc,flexShrink:0,animation:(!d.paused&&d.verified&&sc==='#16a34a')?'pulse-dot 2s ease-in-out infinite':'none'}}/>
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
            <Shield size={56} color="#e5e7eb"/>
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
                      {icon:FileDown,label:'PDF',fn:()=>exportCompliancePDF(selected, scan)},
                    ].map(b=>(
                      <button key={b.label} className="dsh-btn" onClick={b.fn}
                        style={{padding:'6px 12px',background:'#ffffff',color:'#555555',border:'1px solid #e4e7ec',borderRadius:7,cursor:'pointer',fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:4,transition:'background 0.15s'}}>
                        <b.icon size={11}/>{b.label}
                      </button>
                    ))}
                    {scan?.id&&<ShareButton domain={selected.domain_name} scanId={scan.id}/>}
                    <BadgeButton domain={selected.domain_name} score={scan?.health_score}/>
                  </div>
                </div>
              </div>
            </div>

            <div style={{padding:20,display:'flex',flexDirection:'column',gap:14}}>

              {/* ══ OVERVIEW ══════════════════════════════════ */}
              {activeTab==='overview'&&scan&&(
                <>
                  <OnboardingChecklist scan={scan} domain={selected} setPage={setPage} setActiveTab={setActiveTab}/>
                  {/* KPI row */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
                    {[
                      {label:'Health score',val:scan.health_score,color:getScoreColor(scan.health_score),sub:(()=>{
                        const scans=selected?.scan_results
                        if(scans?.length>=2){
                          const delta=scan.health_score-(scans[1]?.health_score||scan.health_score)
                          if(delta!==0) return `${delta>0?'↑':'↓'} ${Math.abs(delta)} vs last scan`
                        }
                        return 'out of 100'
                      })(),pct:scan.health_score,tab:'overview'},
                      {label:'Critical issues',val:critical.length,color:critical.length>0?'#dc2626':'#16a34a',sub:critical.length>0?'Fix immediately':'All clear',pct:Math.min(critical.length*25,100),tab:'overview'},
                      ...(()=>{
                        const days=scan.ssl_info?.certs?.[0]?.days_remaining
                        const c=days==null?'#6b7280':days<=7?'#dc2626':days<=30?'#d97706':days<=60?'#2563eb':'#16a34a'
                        const expDate=scan.ssl_info?.certs?.[0]?.expires_at
                        return [{label:'SSL expiry',val:days==null?'—':days<=0?'Expired':`${days}d`,color:c,sub:days==null?'Scan to check':days<=0?'Renew immediately':days<=30?'Renew soon':`Expires ${expDate?new Date(expDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'soon'}`,pct:days==null?0:Math.min(100,Math.max(5,days/365*100)),tab:'ssl'}]
                      })(),
                      {label:'Blacklisted',val:`${scan.blacklists?.listed_count||0}/${scan.blacklists?.results?.length||0}`,color:(scan.blacklists?.listed_count||0)>0?'#dc2626':'#16a34a',sub:'blacklists',pct:(scan.blacklists?.listed_count||0)>0?60:100,tab:'blacklists'},
                    ].map(k=>(
                      <div key={k.label} className="print-card" onClick={()=>setActiveTab(k.tab)} style={{background:'#ffffff',border:'1px solid #e4e7ec',borderTop:`3px solid ${k.color}`,borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',transition:'transform 0.15s,box-shadow 0.15s',animation:'fadeIn 0.2s ease both',cursor:'pointer'}}
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
                          <div key={c.label} style={{animationDelay:`${i*50}ms`}} className='stagger-1' onClick={()=>c.tab&&setActiveTab(c.tab)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',borderBottom:'1px solid #f3f4f6',cursor:'pointer',borderRadius:6,transition:'background 0.12s'}}
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
                  <IssuesPanel
                    issues={issues}
                    critical={critical}
                    warns={warns}
                    scan={scan}
                    selected={selected}
                    user={user}
                    setPage={setPage}
                  />

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
                    {name:'SPF',  status:scan.email_auth.spf_status,  val:scan.email_auth.spf_raw,  note:scan.email_auth.spf_fix,  extra:scan.email_auth.spf_lookups!=null?`${scan.email_auth.spf_lookups}/10 lookups`:null, fixType:'SPF',  fixVal:scan.email_auth.spf_raw||'v=spf1 include:_spf.google.com ~all'},
                    {name:'DKIM', status:scan.email_auth.dkim_status, val:scan.email_auth.dkim_selector?`Selector: ${scan.email_auth.dkim_selector}`:null, note:scan.email_auth.dkim_note},
                    {name:'DMARC',status:scan.email_auth.dmarc_status,val:scan.email_auth.dmarc_raw, note:scan.email_auth.dmarc_fix,suggest:scan.email_auth.dmarc_suggestion, fixType:'DMARC', fixVal:scan.email_auth.dmarc_suggestion||scan.email_auth.dmarc_raw||`v=DMARC1; p=quarantine; rua=mailto:dmarc@${selected?.domain_name}; adkim=s; aspf=s`},
                    {name:'BIMI', status:scan.email_auth.bimi_status||'Not configured',   val:scan.email_auth.bimi_raw, note:scan.email_auth.bimi_note},
                    {name:'MTA-STS',status:scan.email_auth.mta_sts_status||'Not configured',val:null,note:'Enforces TLS for all inbound mail delivery.'},
                    {name:'TLS-RPT',status:scan.email_auth.tls_rpt_status||'Not configured',val:null,note:'Enables TLS failure reporting.'},
                  ].map((r,i)=>{
                    const isMissing = ['Missing','Fail'].includes(r.status)
                    const canFix = isMissing && r.fixType && r.fixVal
                    return (
                    <div key={r.name} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'12px 16px',borderBottom:'1px solid #f3f4f6',background:isMissing&&r.fixType?'#fefafa':'transparent'}}>
                      <div style={{width:60,flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:'#111827',fontFamily:'monospace'}}>{r.name}</div>
                        {r.extra&&<div style={{fontSize:10,color:'#374151',marginTop:3}}>{r.extra}</div>}
                      </div>
                      <div style={{flex:1}}>
                        {r.val&&<div style={{fontSize:12,fontFamily:'monospace',color:'#0f172a',marginBottom:4,wordBreak:'break-all',padding:'4px 8px',background:'#f8fafc',borderRadius:5,border:'1px solid #e2e8f0'}}>{r.val}</div>}
                        {r.note&&<div style={{fontSize:12,color:'#374151',lineHeight:1.5}}>{r.note}</div>}
                        {r.suggest&&<div style={{marginTop:5,padding:'6px 10px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,fontSize:12,fontFamily:'monospace',color:'#166534',wordBreak:'break-all'}}>✦ {r.suggest}</div>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:7,flexShrink:0}}>
                        <SBadge status={r.status}/>
                        {canFix&&<AutoFixButton domainId={selected.id} issueType={r.fixType} fixValue={r.fixVal} domainName={selected?.domain_name}/>}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}

              {/* ══ SSL ══════════════════════════════════════ */}
              {activeTab==='ssl'&&scan?.ssl_info&&(
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {/* Summary header card */}
                  <div style={card}>
                    <div style={cardHd}>
                      <span style={{fontSize:12,fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:6}}><Lock size={13} color="#10b981"/> SSL / TLS Certificate</span>
                      <SBadge status={scan.ssl_info.overall_status}/>
                    </div>
                    {scan.ssl_info.certs?.length > 0 ? scan.ssl_info.certs.map((cert,i)=>{
                      const days = cert.days_remaining ?? null
                      const expiry = cert.expires_at || cert.not_after || cert.valid_to
                      const issued = cert.not_before || cert.valid_from
                      const daysColor = days===null?'#6b7280':days<=7?'#dc2626':days<=30?'#d97706':days<=60?'#2563eb':'#16a34a'
                      const issuer = cert.issuer_org || cert.issuer_cn || cert.issuer || null
                      return (
                        <div key={i} style={{padding:'16px'}}>
                          {/* Big expiry highlight */}
                          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16,padding:'14px 16px',background:days===null?'#f9fafb':days<=30?'#fef2f2':'#f0fdf4',borderRadius:10,border:`1px solid ${days===null?'#e5e7eb':days<=30?'#fecaca':'#bbf7d0'}`}}>
                            <Lock size={28} color={daysColor}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:22,fontWeight:800,color:daysColor,letterSpacing:'-0.04em',lineHeight:1}}>
                                {days===null ? 'Active' : days<=0 ? 'Expired' : `${days} days`}
                              </div>
                              <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>
                                {expiry ? `Expires ${new Date(expiry).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}` : 'Certificate valid'}
                              </div>
                            </div>
                            {issuer && (
                              <div style={{textAlign:'right'}}>
                                <div style={{fontSize:10,color:'#9ca3af',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>Issued by</div>
                                <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{issuer}</div>
                              </div>
                            )}
                          </div>

                          {/* Detail grid */}
                          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
                            {[
                              {l:'Subject',      v: cert.subject_cn || cert.domain || cert.domain_name || '—'},
                              {l:'Issued by',    v: issuer || 'Unknown CA'},
                              {l:'Protocol',     v: cert.protocol || 'TLS'},
                              {l:'Valid from',   v: issued ? new Date(issued).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'},
                              {l:'Expires',      v: expiry ? new Date(expiry).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'},
                              {l:'Days left',    v: days !== null ? `${days} days` : '—', color: daysColor},
                              {l:'Key size',     v: cert.key_size ? `${cert.key_size}-bit` : 'RSA'},
                              {l:'Chain',        v: cert.chain_valid !== false ? '✓ Valid' : '✗ Invalid', color: cert.chain_valid!==false?'#16a34a':'#dc2626'},
                              {l:'HSTS',         v: cert.hsts==='HSTS enabled'||cert.hsts_enabled ? '✓ Enabled' : 'Not set', color: cert.hsts==='HSTS enabled'||cert.hsts_enabled?'#16a34a':'#9ca3af'},
                              {l:'CT logged',    v: cert.ct_logged||cert.ct_log ? '✓ Yes' : '—', color: cert.ct_logged||cert.ct_log?'#16a34a':'#9ca3af'},
                              {l:'HTTP→HTTPS',   v: cert.https_redirect ? '✓ Redirects' : '—', color: cert.https_redirect?'#16a34a':'#9ca3af'},
                              {l:'Source',       v: cert.source || 'CT logs'},
                            ].map(f=>(
                              <div key={f.l} style={{padding:'10px 12px',background:'#f9fafb',borderRadius:8,border:'1px solid #e5e7eb'}}>
                                <div style={{fontSize:10,color:'#6b7280',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{f.l}</div>
                                <div style={{fontSize:13,fontWeight:600,color:f.color||'#111827'}}>{f.v}</div>
                              </div>
                            ))}
                          </div>

                          {/* SANs */}
                          {cert.san?.length > 0 && (
                            <div style={{marginBottom:12}}>
                              <div style={{fontSize:10,color:'#6b7280',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>Subject alt names ({cert.san.length})</div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                                {cert.san.slice(0,8).map((s)=>(
                                  <span key={s} style={{fontSize:11,fontFamily:'monospace',padding:'2px 8px',borderRadius:5,background:'#f3f4f6',border:'1px solid #e5e7eb',color:'#374151'}}>{s}</span>
                                ))}
                                {cert.san.length>8&&<span style={{fontSize:11,color:'#9ca3af'}}>+{cert.san.length-8} more</span>}
                              </div>
                            </div>
                          )}

                          <div style={{padding:'10px 14px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,fontSize:12,color:'#1d4ed8'}}>
                            ℹ {scan.ssl_info.note||'HTTPS connection established successfully.'}
                          </div>
                        </div>
                      )
                    }) : (
                      <div style={{padding:'32px',textAlign:'center',color:'#9ca3af'}}>
                        <Lock size={32} style={{marginBottom:10,opacity:0.3}}/>
                        <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>No certificate data yet</div>
                        <div style={{fontSize:12}}>Click "Scan now" to fetch SSL certificate details</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ PROPAGATION ══════════════════════════════ */}
              {activeTab==='propagation'&&scan?.propagation&&(
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div style={card}>
                    <div style={cardHd}>
                      <span style={{fontSize:12,fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:6}}><Globe size={13} color='#1d4ed8'/> Global propagation status</span>
                      <SBadge status={scan.propagation.consistent?'Consistent':'Inconsistent'}/>
                    </div>
                    <div style={{padding:'16px 20px'}}>

                      {/* Real map using OpenStreetMap tiles via static map image */}
                      <div style={{position:'relative',borderRadius:10,overflow:'hidden',marginBottom:14,border:'1px solid #e5e7eb',background:'#e8f0fe'}}>
                        {/* Real world map from Wikimedia/OpenStreetMap */}
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_-_low_resolution.svg/1280px-World_map_-_low_resolution.svg.png"
                          alt="World map"
                          style={{width:'100%',display:'block',opacity:0.85}}
                          onError={e=>{e.target.style.display='none'}}
                        />

                        {/* Status pins — positioned as % of map dimensions */}
                        {/* Map is ~1280x640 Mercator. Pin positions as percentage */}
                        {[
                          {key:'us',   name:'N. America',  top:'35%', left:'18%', flag:'🇺🇸'},
                          {key:'eu',   name:'Europe',      top:'28%', left:'48%', flag:'🇪🇺'},
                          {key:'apac', name:'Asia Pacific', top:'38%', left:'72%', flag:'🌏'},
                          {key:'au',   name:'Australia',   top:'70%', left:'78%', flag:'🇦🇺'},
                        ].map(reg => {
                          const allPass = scan.propagation.records?.every(r => r[reg.key]==='pass')
                          const c = allPass ? '#16a34a' : '#dc2626'
                          const bg = allPass ? '#f0fdf4' : '#fef2f2'
                          const bd = allPass ? '#86efac' : '#fecaca'
                          return (
                            <div key={reg.key} style={{position:'absolute',top:reg.top,left:reg.left,transform:'translate(-50%,-50%)',textAlign:'center',filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.25))'}}>
                              {/* Pin body */}
                              <div style={{background:bg,border:`2px solid ${bd}`,borderRadius:20,padding:'5px 10px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',backdropFilter:'blur(4px)'}}>
                                <div style={{width:10,height:10,borderRadius:'50%',background:c,flexShrink:0,boxShadow:`0 0 6px ${c}`}}/>
                                <span style={{fontSize:11,fontWeight:700,color:'#111827'}}>{reg.flag} {reg.name}</span>
                              </div>
                              {/* Pin tail */}
                              <div style={{width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:`6px solid ${bd}`,margin:'0 auto',marginTop:-1}}/>
                            </div>
                          )
                        })}

                        {/* Legend overlay */}
                        <div style={{position:'absolute',bottom:8,left:8,background:'rgba(255,255,255,0.9)',borderRadius:8,padding:'5px 10px',display:'flex',gap:12,border:'1px solid #e5e7eb',fontSize:11,backdropFilter:'blur(4px)'}}>
                          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',background:'#16a34a',display:'inline-block',boxShadow:'0 0 4px #16a34a'}}/><span style={{color:'#374151',fontWeight:500}}>Propagated</span></span>
                          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',background:'#dc2626',display:'inline-block',boxShadow:'0 0 4px #dc2626'}}/><span style={{color:'#374151',fontWeight:500}}>Inconsistent</span></span>
                        </div>
                      </div>

                      {/* Resolver detail cards */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                        {[
                          {key:'us',   flag:'🇺🇸', name:'N. America', resolver:'1.1.1.1 · Cloudflare'},
                          {key:'eu',   flag:'🇪🇺', name:'Europe',     resolver:'8.8.8.8 · Google'},
                          {key:'apac', flag:'🌏',  name:'Asia Pacific',resolver:'OpenDNS'},
                          {key:'au',   flag:'🇦🇺', name:'Australia',  resolver:'Quad9'},
                        ].map(reg => {
                          const allPass = scan.propagation.records?.every(r => r[reg.key]==='pass')
                          return (
                            <div key={reg.key} style={{background:allPass?'#f0fdf4':'#fef2f2',borderRadius:10,padding:'10px 12px',border:`1px solid ${allPass?'#bbf7d0':'#fecaca'}`}}>
                              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                                <span style={{fontSize:16}}>{reg.flag}</span>
                                <div>
                                  <div style={{fontSize:12,fontWeight:700,color:'#111827',letterSpacing:'-0.01em'}}>{reg.name}</div>
                                  <div style={{fontSize:10,color:'#6b7280',fontFamily:'monospace'}}>{reg.resolver}</div>
                                </div>
                              </div>
                              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:6}}>
                                <div style={{width:7,height:7,borderRadius:'50%',background:allPass?'#16a34a':'#dc2626',flexShrink:0}}/>
                                <span style={{fontSize:11,fontWeight:600,color:allPass?'#15803d':'#dc2626'}}>{allPass?'Propagated':'Inconsistent'}</span>
                              </div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                                {scan.propagation.records?.map(rec=>(
                                  <span key={rec.type} style={{fontSize:9,fontFamily:'monospace',fontWeight:700,padding:'1px 5px',borderRadius:4,background:rec[reg.key]==='pass'?'#dcfce7':'#fee2e2',color:rec[reg.key]==='pass'?'#166534':'#991b1b',border:`1px solid ${rec[reg.key]==='pass'?'#86efac':'#fca5a5'}`}}>{rec.type}</span>
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
              {activeTab==='blacklists'&&scan?.blacklists&&(()=>{
                const DELIST={
                  'zen.spamhaus.org':       ip=>`https://www.spamhaus.org/query/ip/${ip}`,
                  'bl.spamcop.net':         ip=>`https://www.spamcop.net/bl.shtml?${ip}`,
                  'dnsbl.sorbs.net':        ip=>`http://www.sorbs.net/lookup.shtml?${ip}`,
                  'b.barracudacentral.org': ()=>`https://www.barracudacentral.org/rbl/removal-request`,
                  'dbl.spamhaus.org':       ()=>`https://www.spamhaus.org/dbl/`,
                  'multi.surbl.org':        ip=>`https://www.surbl.org/surbl-analysis?d=${ip}`,
                  'cbl.abuseat.org':        ip=>`https://www.abuseat.org/lookup.cgi?ip=${ip}`,
                  'dnsbl-1.uceprotect.net': ip=>`http://www.uceprotect.net/en/rblcheck.php?ipr=${ip}`,
                  'psbl.surriel.com':       ()=>`https://psbl.org/remove`,
                  'spam.dnsbl.sorbs.net':   ip=>`http://www.sorbs.net/lookup.shtml?${ip}`,
                }
                const ip=scan.blacklists.ip
                const listed=(scan.blacklists.results||[]).filter(b=>b.listed)
                return (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {/* Stats */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                    {[{l:'IP address',v:ip||'–',c:'#7c3aed'},{l:'Lists checked',v:scan.blacklists.results?.length||0,c:'#2563eb'},{l:'Listed on',v:scan.blacklists.listed_count||0,c:(scan.blacklists.listed_count||0)>0?'#dc2626':'#16a34a'}].map(s=>(
                      <div key={s.l} style={{...card,padding:'14px 16px'}}>
                        <div style={{fontSize:11,color:'#6b7280',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>{s.l}</div>
                        <div style={{fontSize:22,fontWeight:800,color:s.c,letterSpacing:'-0.02em',fontFamily:'monospace'}}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Listed — delist buttons */}
                  {listed.length>0&&(
                    <div style={card}>
                      <div style={cardHd}>
                        <span style={{fontSize:12,fontWeight:700,color:'#dc2626',display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:'#dc2626'}}/> Listed on {listed.length} blacklist{listed.length!==1?'s':''}
                        </span>
                        <span style={{fontSize:11,color:'#6b7280'}}>Click to request removal</span>
                      </div>
                      <div style={{padding:'10px 10px 4px'}}>
                        {listed.map(bl=>{
                          const url=DELIST[bl.name]?.(ip)||null
                          return (
                            <div key={bl.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',marginBottom:6,background:'#fef2f2',borderRadius:9,border:'1px solid #fecaca'}}>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:8,height:8,borderRadius:'50%',background:'#dc2626',flexShrink:0}}/>
                                <div>
                                  <div style={{fontSize:12,fontFamily:'monospace',fontWeight:600,color:'#111827'}}>{bl.name}</div>
                                  <div style={{fontSize:11,color:'#6b7280',marginTop:1}}>IP: {ip}</div>
                                </div>
                              </div>
                              {url
                                ? <a href={url} target='_blank' rel='noopener noreferrer' style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 14px',background:'#111827',color:'#fff',borderRadius:7,fontSize:12,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap',flexShrink:0}}>Request removal →</a>
                                : <span style={{fontSize:11,color:'#9ca3af',flexShrink:0}}>Manual removal required</span>
                              }
                            </div>
                          )
                        })}
                      </div>
                      <div style={{padding:'10px 16px',borderTop:'1px solid #f0f2f5',background:'#fafafa',borderRadius:'0 0 12px 12px'}}>
                        <div style={{fontSize:11,color:'#6b7280',lineHeight:1.7}}>
                          <strong style={{color:'#374151'}}>How delisting works:</strong> Click the button to visit each blacklist's removal page. Submit your IP and reason. Most removals take 24–48 hours. Run a fresh scan after to confirm.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All results table */}
                  <div style={card}>
                    <div style={cardHd}>
                      <span style={{fontSize:12,fontWeight:700,color:'#111827'}}>All {scan.blacklists.results?.length||0} lists checked</span>
                      {listed.length===0&&<span style={{fontSize:11,color:'#16a34a',fontWeight:600}}>✓ All clean</span>}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                      {scan.blacklists.results?.map(bl=>(
                        <div key={bl.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderBottom:'1px solid #f3f4f6',background:bl.listed?'#fef2f2':'transparent'}}>
                          <span style={{fontSize:11,fontFamily:'monospace',color:bl.listed?'#dc2626':'#374151',fontWeight:bl.listed?600:400}}>{bl.name}</span>
                          <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:6,background:bl.listed?'#fecaca':'#dcfce7',color:bl.listed?'#991b1b':'#166534'}}>{bl.listed?'Listed':'Clean'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )
              })()}

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
