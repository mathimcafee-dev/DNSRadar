import { useState, useEffect, useMemo, useRef } from 'react'
import { Plus, Globe, Trash2, RefreshCw, Shield, Pause, Play, Clock, Mail, Lock, Ban, AlertTriangle, CheckCircle, Zap, FileDown, Share2, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddDomainModal from '../components/AddDomainModal'
import NotificationBell from '../components/NotificationBell'
import ScoreHistoryChart from '../components/ScoreHistoryChart'
import DmarcJourney from '../components/DmarcJourney'
import { timeAgo, getScoreColor } from '../lib/scoreEngine'

function formatIssueType(t) {
  const MAP = {
    'SPF_missing':'SPF Record','SPF_fail':'SPF Record','SPF_warn':'SPF Record',
    'DMARC_missing':'DMARC Policy','DMARC_fail':'DMARC Policy','DMARC_warn':'DMARC Policy',
    'DKIM_missing':'DKIM Signing','DKIM_fail':'DKIM Signing',
    'CAA_missing':'CAA Record','CAA_fail':'CAA Record',
    'DNSSEC_missing':'DNSSEC','DNSSEC_warn':'DNSSEC',
    'blacklist':'Blacklist','blacklist_listing':'Blacklist',
    'SSL_expiring':'SSL Expiry','SSL_expired':'SSL Expired','SSL_invalid':'SSL Certificate',
    'MX_missing':'MX Record','A_missing':'A Record',
  }
  if (!t) return 'Issue'
  return MAP[t] || t.replace(/_/g,' ').replace(/\w/g,ch=>ch.toUpperCase())
}


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

  const scoreColor = score >= 70 ? '#0073d1' : score >= 50 ? '#0073d1' : '#e53e3e'
  const scoreBg = score >= 70 ? '#e0f2fe' : score >= 50 ? '#e8f3fc' : '#fff5f5'

  const checkRow = (label, status, detail = '') => {
    const ok = ['Pass', 'Valid', 'Consistent', 'Clean'].includes(status)
    const warn = ['Warn', 'Warning', 'Partial'].includes(status)
    const c = ok ? '#0073d1' : warn ? '#0073d1' : '#e53e3e'
    const bg = ok ? '#e0f2fe' : warn ? '#e8f3fc' : '#fff5f5'
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
    .compliance-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 12px; color: #1a2332; border-bottom: 0.5px solid #e2e8f0; }
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
      <span style="margin-left:auto;font-size:11px;font-weight:600;color:${c.ok?'#0073d1':'#e53e3e'}">${c.ok ? 'Compliant' : 'Non-compliant'}</span>
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
        <span style="background:${i.severity==='critical'?'#fff5f5':i.severity==='warn'?'#e8f3fc':'#e0f2fe'};color:${i.severity==='critical'?'#e53e3e':i.severity==='warn'?'#0073d1':'#0284c7'};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${i.severity}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${i.message}</td>
    </tr>`).join('')}
  </table>` : '<p style="color:var(--green);font-weight:600;">✅ No issues detected</p>'}

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
    <div style={{margin:'0 16px 4px',padding:'9px 12px',background:'#e8f3fc',border:'1px solid var(--green-bdr)',borderRadius:8,display:'flex',alignItems:'center',gap:8,fontSize:12}}>
      <span style={{fontSize:16}}>⚡</span>
      <span style={{color:'#0059a5',fontWeight:500}}>DNS credentials connected — click <strong>Auto-fix</strong> on any issue to push the record directly to your DNS provider.</span>
    </div>
  )
  return (
    <div style={{margin:'0 16px 4px',padding:'9px 12px',background:'#fffbeb',border:'1px solid var(--amber-bdr)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,fontSize:12}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:16}}>🔑</span>
        <span style={{color:'#d97706'}}>Connect Cloudflare or GoDaddy to enable <strong>one-click auto-fix</strong> for DNS issues.</span>
      </div>
      <button onClick={()=>setPage('autofix')} style={{padding:'5px 12px',background:'#ffffff',color:'#1a2332',border:'none',borderRadius:7,fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit'}}>
        Add credentials →
      </button>
    </div>
  )
}


// ─── Rescan now button ─────────────────────────────────────────────────
function RescanButton({ domain, user, onComplete }) {
  const [scanning, setScanning] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState(false)

  async function rescan() {
    if (scanning) return
    setScanning(true); setDone(false); setErr(false)
    try {
      const { data, error } = await supabase.functions.invoke('dns-scan', {
        body: { domain: domain.domain_name, scan_type: 'website', save_to_db: true, domain_id: domain.id }
      })
      if (error || data?.error) throw new Error(error?.message || data?.error)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
      if (onComplete) onComplete(data)
    } catch(e) {
      setErr(true)
      setTimeout(() => setErr(false), 3000)
    } finally { setScanning(false) }
  }

  return (
    <button onClick={rescan} disabled={scanning}
      style={{ padding:'6px 14px', background: done?'#e8f3fc':err?'#fff5f5':'#0073d1', color: done?'#0059a5':err?'#c53030':'#ffffff', border: done?'1px solid #a8d0f0':err?'1px solid #feb2b2':'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:scanning?'wait':'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s', whiteSpace:'nowrap', fontFamily:'inherit' }}>
      {scanning ? <><RefreshCw size={12} style={{ animation:'spin 0.7s linear infinite' }}/> Scanning…</> : done ? <>✓ Done</> : err ? <>✗ Failed — retry</> : <><RefreshCw size={12}/> Scan now</>}
    </button>
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
    <button onClick={()=>setState('idle')} style={{fontSize:11,color:'#d97706',background:'#fffbeb',border:'1px solid var(--amber-bdr)',borderRadius:6,padding:'3px 9px',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
      Add DNS credentials first
    </button>
  )

  return (
    <div style={{flexShrink:0,position:'relative'}}>
      {showConfirm && (
        <div style={{position:'absolute',right:0,bottom:'calc(100% + 8px)',zIndex:200,background:'#ffffff',border:'1px solid var(--border)',borderRadius:14,padding:'16px',width: issueType==='CAA' ? 340 : 300,boxShadow:'0 12px 32px rgba(0,0,0,0.14)'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1a2332',marginBottom:4}}>Push to {cred?.provider}</div>
          <div style={{fontSize:11,color:'#8896a7',marginBottom:12}}>Create/update <strong>{mapping.label}</strong> on your DNS</div>

          {/* CAA vendor picker */}
          {issueType === 'CAA' && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:'#4a5568',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span>Select certificate authorities</span>
                <div style={{display:'flex',gap:4}}>
                  {['issue','issuewild'].map(m=>(
                    <button key={m} onClick={()=>setCaaMode(m)}
                      style={{fontSize:10,padding:'2px 7px',borderRadius:5,border:`1px solid ${caaMode===m?'#a8d0f0':'#e2e8f0'}`,background:caaMode===m?'#f8fafc':'transparent',color:caaMode===m?'#1a2332':'#8896a7',cursor:'pointer',fontFamily:'inherit'}}>
                      {m==='issue'?'Standard':'Wildcard'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:220,overflowY:'auto'}}>
                {CAA_VENDORS.map(v=>{
                  const sel = caaVendors.includes(v.id)
                  return (
                    <label key={v.id} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 10px',border:`1px solid ${sel?'#a8d0f0':'#e2e8f0'}`,borderRadius:8,cursor:'pointer',background:sel?'#e8f3fc':'#f8fafc',transition:'all 0.12s'}}>
                      <input type="checkbox" checked={sel}
                        onChange={e=>setCaaVendors(prev=>e.target.checked?[...prev,v.id]:prev.filter(x=>x!==v.id))}
                        style={{width:14,height:14,accentColor:'#0073d1',flexShrink:0}}/>
                      <span style={{fontSize:16,flexShrink:0}}>{v.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:'#1a2332'}}>{v.label}</div>
                        <div style={{fontSize:10,color:'#8896a7',fontFamily:'monospace'}}>{v.domain}</div>
                      </div>
                      <span style={{fontSize:10,color:'#8896a7',flexShrink:0}}>{v.note}</span>
                    </label>
                  )
                })}
              </div>
              {/* Preview */}
              <div style={{marginTop:8,padding:'6px 9px',background:'#f8fafc',border:'1px solid var(--border)',borderRadius:7,fontSize:11,fontFamily:'monospace',color:'#1a2332',lineHeight:1.8,wordBreak:'break-all'}}>
                {caaVendors.length===0
                  ? <span style={{color:'#8896a7'}}>Select at least one CA above</span>
                  : CAA_VENDORS.filter(v=>caaVendors.includes(v.id)).map(v=>(
                      <div key={v.id}>0 {caaMode} &quot;{v.domain}&quot;</div>
                    ))
                }
              </div>
            </div>
          )}

          {/* Non-CAA record preview */}
          {issueType !== 'CAA' && (
            <div style={{fontSize:11,fontFamily:'monospace',color:'#1a2332',background:'#f8fafc',border:'1px solid var(--border)',padding:'7px 9px',borderRadius:8,marginBottom:12,wordBreak:'break-all',lineHeight:1.6}}>
              {fixValue?.slice(0,140)}{fixValue?.length>140?'…':''}
            </div>
          )}

          <div style={{display:'flex',gap:6,marginTop:4}}>
            <button onClick={execute} disabled={issueType==='CAA'&&caaVendors.length===0}
              style={{flex:1,padding:'8px',background: caaVendors.length===0&&issueType==='CAA'?'#9ca3af':'#111827',color:'#1a2332',border:'none',borderRadius:8,cursor: caaVendors.length===0&&issueType==='CAA'?'not-allowed':'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit'}}>
              ⚡ Push {issueType==='CAA'&&caaVendors.length>1?`${caaVendors.length} records`:'record'}
            </button>
            <button onClick={()=>setShowConfirm(false)} style={{padding:'8px 12px',background:'#f8fafc',color:'#4a5568',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <button onClick={state==='idle'?loadCred:undefined} disabled={state==='loading'||state==='success'}
        style={{padding:'5px 12px',background:state==='success'?'#e0f2fe':state==='error'?'#fff5f5':'#e8f3fc',border:`1px solid ${state==='success'?'#a8d0f0':state==='error'?'#feb2b2':'#a8d0f0'}`,borderRadius:7,color:state==='success'?'#0284c7':state==='error'?'#e53e3e':'#0073d1',fontSize:11,fontWeight:600,cursor:state==='idle'?'pointer':'default',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5,fontFamily:'inherit',transition:'all 0.15s'}}
        onMouseEnter={e=>{if(state==='idle')e.currentTarget.style.background='#e8f3fc'}}
        onMouseLeave={e=>{if(state==='idle')e.currentTarget.style.background='#e8f3fc'}}>
        {state==='loading'&&<div style={{width:10,height:10,border:'2px solid #d1d5db',borderTopColor:'#0073d1',borderRadius:'50%',animation:'dsh-spin 0.7s linear infinite'}}/>}
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
  const c=score>=70?'#0073d1':score>=50?'#0073d1':'#e53e3e'
  const label=score>=90?'Excellent':score>=70?'Good':score>=50?'Fair':'Critical'
  return (
    <svg width={size} height={size*0.68} viewBox={`0 0 ${size} ${size*0.68}`}>
      {[...Array(9)].map((_,i)=>{
        const a=sa+(arc/8)*i
        const x1=cx+(r+5)*Math.cos(rad(a)),y1=cy+(r+5)*Math.sin(rad(a))
        const x2=cx+(r+10)*Math.cos(rad(a)),y2=cy+(r+10)*Math.sin(rad(a))
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth={i%4===0?2:1}/>
      })}
      <path d={path(sa,ea,r)} fill="none" stroke="rgba(255,107,43,0.09)" strokeWidth={size*0.065} strokeLinecap="round"/>
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
    <div style={{height:h,background:'#f8fafc',borderRadius:h/2,overflow:'hidden'}}>
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
      style={{padding:'6px 12px',background:copied?'#e8f3fc':'#f8fafc',color:copied?'#0073d1':'#4a5568',border:`1px solid ${copied?'#a8d0f0':'#e2e8f0'}`,borderRadius:7,cursor:'pointer',fontSize:11,fontWeight:500,display:'flex',alignItems:'center',gap:5,transition:'all 0.15s',minWidth:80,justifyContent:'center'}}>
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
        <div style={{fontSize:16,fontWeight:700,color:'#1a2332',marginBottom:8}}>Delete domain?</div>
        <div style={{fontSize:13,color:'#4a5568',marginBottom:20}}>
          Permanently delete <span style={{color:'#ff4d6a',fontFamily:'monospace'}}>{domain?.domain_name}</span> and all scan history.
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'8px 16px',background:'#f8fafc',color:'#4a5568',border:'1px solid var(--border)',borderRadius:8,cursor:'pointer',fontSize:13}}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{padding:'8px 16px',background:'#ff4d6a',color:'#1a2332',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500}}>
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
    <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:pass?'#e0f2fe':fail?'#fff5f5':'#e8f3fc',color:pass?'#0284c7':fail?'#e53e3e':'#0073d1',border:`1px solid ${pass?'#7dd3fc':fail?'#feb2b2':'#a8d0f0'}`,fontWeight:500,whiteSpace:'nowrap'}}>
      {status||'–'}
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────

// ─── Issues panel (collapsible) ──────────────────────────────────────
function IssuesPanel({ issues, critical, warns, scan, selected, user, setPage }) {
  const [expanded, setExpanded] = useState(critical.length > 0) // auto-open if critical

  const allClear = issues.length === 0
  const headerBg = allClear ? '#e0f2fe' : critical.length > 0 ? '#fff5f5' : '#e8f3fc'
  const headerBd = allClear ? '#a8d0f0' : critical.length > 0 ? '#feb2b2' : '#fcd34d'
  const headerColor = allClear ? '#0073d1' : critical.length > 0 ? '#e53e3e' : '#0073d1'

  return (
    <div className="print-card" style={{background:'#ffffff', border:`1px solid ${expanded ? '#e2e8f0' : headerBd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>

      {/* Collapsed header */}
      <div onClick={() => setExpanded(e => !e)}
        style={{padding:'11px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none',
          background: expanded ? '#fafafa' : headerBg, borderBottom: expanded ? '1px solid #f0f2f5' : 'none'}}>

        {/* Icon */}
        <div style={{width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background: allClear ? '#e8f3fc' : critical.length > 0 ? '#feb2b2' : '#fcd34d',
          border: `1px solid ${headerBd}`}}>
          {allClear
            ? <CheckCircle size={15} color="var(--green)"/>
            : <AlertTriangle size={15} color={headerColor}/>
          }
        </div>

        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:700, color:'#1a2332'}}>
            {allClear ? 'All checks passing' : `${issues.length} issue${issues.length!==1?'s':''} to fix`}
          </div>
          <div style={{fontSize:11, color:'#8896a7', marginTop:1}}>
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
          {critical.length > 0 && <span style={{fontSize:10, padding:'2px 7px', borderRadius:8, background:'#fff5f5', color:'#e53e3e', border:'1px solid var(--pk-bdr)', fontWeight:600}}>{critical.length} critical</span>}
          {warns.length > 0    && <span style={{fontSize:10, padding:'2px 7px', borderRadius:8, background:'#fffbeb', color:'#d97706', border:'1px solid var(--or-bdr)', fontWeight:600}}>{warns.length} warn</span>}
          <span style={{fontSize:12, color:'#8896a7', transform: expanded?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block', marginLeft:4}}>▼</span>
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
              <CheckCircle size={28} color="var(--green)" style={{marginBottom:8}}/>
              <div style={{fontSize:13, fontWeight:600, color:'#1a2332'}}>All checks passing</div>
              <div style={{fontSize:12, color:'#8896a7', marginTop:4}}>No issues detected on {selected?.domain_name}</div>
            </div>
          ) : issues.map((iss, i) => {
            const fixVal = iss.type==='SPF'   ? (scan.email_auth?.spf_raw || 'v=spf1 include:_spf.google.com ~all')
                         : iss.type==='DMARC' ? (scan.email_auth?.dmarc_suggestion || scan.email_auth?.dmarc_raw || `v=DMARC1; p=quarantine; rua=mailto:dmarc@${selected?.domain_name}; adkim=s; aspf=s`)
                         : iss.type==='CAA'   ? '0 issue "letsencrypt.org"'
                         : iss.fix
            const canAutoFix = ['SPF','DMARC','CAA'].includes(iss.type) && fixVal
            const sevColor = iss.severity==='critical'?'#e53e3e':iss.severity==='warn'?'#0073d1':'#0284c7'
            const sevBg    = iss.severity==='critical'?'#fff5f5':iss.severity==='warn'?'#e8f3fc':'#e0f2fe'
            const sevBd    = iss.severity==='critical'?'#feb2b2':iss.severity==='warn'?'#fcd34d':'#bfdbfe'
            return (
              <div key={i} style={{display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px',
                borderBottom: i < issues.length-1 ? '1px solid #f3f4f6' : 'none',
                background: iss.severity==='critical' ? '#fefafa' : 'transparent'}}>
                <div style={{width:28, height:28, borderRadius:8, background:sevBg, border:`1px solid ${sevBd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1}}>
                  <AlertTriangle size={13} color={sevColor}/>
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap'}}>
                    <span style={{fontSize:13, fontWeight:700, color:'#1a2332'}}>{formatIssueType(iss.type)}</span>
                    <span style={{fontSize:10, padding:'2px 7px', borderRadius:8, background:sevBg, color:sevColor, border:`1px solid ${sevBd}`, fontWeight:600}}>{iss.severity}</span>
                  </div>
                  <div style={{fontSize:12, color:'#4a5568', lineHeight:1.6, marginBottom:canAutoFix?6:0}}>{iss.message}</div>
                  {canAutoFix && (
                    <div style={{fontSize:11, fontFamily:'monospace', color:'#1a2332', background:'#f8fafc', border:'1px solid var(--border)', padding:'4px 9px', borderRadius:6, display:'inline-block', wordBreak:'break-all', marginTop:2, maxWidth:'100%', lineHeight:1.5}}>
                      {fixVal?.slice(0,120)}{fixVal?.length>120?'…':''}
                    </div>
                  )}
                  {!canAutoFix && iss.fix && (
                    <div style={{fontSize:11, color:'#8896a7', marginTop:3, lineHeight:1.5}}>{iss.fix}</div>
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
  const [copiedMd, setCopiedMd] = useState(false)
  const [copiedHtml, setCopiedHtml] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const ref = useRef(null)

  const color = score >= 70 ? '0073d1' : score >= 50 ? 'd97706' : 'e53e3e'
  const label = score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'
  const badgeUrl = `https://img.shields.io/badge/DNS%20Health-${score}%2F100%20${encodeURIComponent(label)}-${color}?style=flat-square`
  const markdownBadge = `[![DNS Health](${badgeUrl})](https://dns-radar.vercel.app)`
  const htmlBadge = `<a href="https://dns-radar.vercel.app"><img src="${badgeUrl}" alt="DNS Health: ${score}/100"/></a>`

  useEffect(() => {
    if (!show) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setShow(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [show])

  function copy(text, setter) {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <div ref={ref} style={{position:'relative', flexShrink:0}}>
      <button onClick={() => setShow(s => !s)}
        style={{padding:'6px 12px', background:'#ffffff', color:'#555', border:'1px solid #e4e7ec', borderRadius:7, cursor:'pointer', fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:4, transition:'background 0.15s'}}>
        🏅 Badge
      </button>
      {show && (
        <div style={{position:'absolute', right:0, top:'calc(100% + 6px)', zIndex:100, background:'#ffffff', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', width:320, boxShadow:'0 8px 24px rgba(0,0,0,0.1)'}}>
          <div style={{fontSize:13, fontWeight:700, color:'#1a2332', marginBottom:8}}>Embeddable health badge</div>
          <div style={{marginBottom:10}}>
            <img src={badgeUrl} alt={`DNS Health: ${score}/100`} style={{height:20}}/>
          </div>
          <div style={{fontSize:11, color:'#8896a7', marginBottom:6}}>Markdown (README)</div>
          <div style={{display:'flex', gap:6, marginBottom:10}}>
            <div style={{flex:1, fontFamily:'monospace', fontSize:10, color:'#4a5568', background:'#f8fafc', border:'1px solid var(--border)', borderRadius:6, padding:'6px 8px', wordBreak:'break-all', lineHeight:1.5}}>
              {markdownBadge.slice(0, 80)}…
            </div>
            <button onClick={() => copy(markdownBadge, setCopiedMd)} style={{padding:'6px 10px', background:'#e8f3fc', color:'#0073d1', border:'1px solid #a8d0f0', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit'}}>
              {copiedMd ? '✓' : 'Copy'}
            </button>
          </div>
          <div style={{fontSize:11, color:'#8896a7', marginBottom:6}}>HTML embed</div>
          <div style={{display:'flex', gap:6, marginBottom:10}}>
            <div style={{flex:1, fontFamily:'monospace', fontSize:10, color:'#4a5568', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'6px 8px', wordBreak:'break-all', lineHeight:1.5}}>
              {htmlBadge.slice(0, 80)}…
            </div>
            <button onClick={() => copy(htmlBadge, setCopiedHtml)} style={{padding:'6px 10px', background:'#e8f3fc', color:'#0073d1', border:'1px solid #a8d0f0', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit'}}>
              {copiedHtml ? '✓' : 'Copy'}
            </button>
          </div>
          <div style={{fontSize:11, color:'#8896a7', marginBottom:6}}>Direct URL</div>
          <div style={{display:'flex', gap:6}}>
            <div style={{flex:1, fontFamily:'monospace', fontSize:10, color:'#4a5568', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:6, padding:'6px 8px', wordBreak:'break-all', lineHeight:1.5}}>
              {badgeUrl.slice(0, 80)}…
            </div>
            <button onClick={() => copy(badgeUrl, setCopiedUrl)} style={{padding:'6px 10px', background:'#e8f3fc', color:'#0073d1', border:'1px solid #a8d0f0', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit'}}>
              {copiedUrl ? '✓' : 'Copy'}
            </button>
          </div>
          <div style={{fontSize:11, color:'#8896a7', marginTop:10, lineHeight:1.5}}>
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
    <div style={{background:'#ffffff', border:`1px solid ${allDone?'#a8d0f0':'#e2e8f0'}`, borderRadius:12, overflow:'hidden', marginBottom:14, boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
      {/* Collapsed header — always visible */}
      <div onClick={() => setExpanded(e => !e)}
        style={{padding:'10px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none',
          background: allDone ? '#e8f3fc' : '#fff'}}>
        {/* Mini progress bar */}
        <div style={{width:32, height:32, borderRadius:'50%', flexShrink:0, position:'relative', display:'flex', alignItems:'center', justifyContent:'center',
          background:`conic-gradient(var(--green) ${pct*3.6}deg, #f3f4f6 0deg)`}}>
          <div style={{width:22, height:22, borderRadius:'50%', background: allDone?'#e8f3fc':'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span style={{fontSize:10, fontWeight:800, color: allDone?'#0073d1':'#374151'}}>{doneCount}/{steps.length}</span>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:600, color:'#1a2332'}}>
            {allDone ? '🎉 Domain fully configured!' : 'Setup checklist'}
          </div>
          {!allDone && (
            <div style={{fontSize:11, color:'#8896a7', marginTop:1}}>
              {steps.filter(s=>!s.done).slice(0,2).map(s=>s.label).join(' · ')}
              {steps.filter(s=>!s.done).length > 2 ? ` · +${steps.filter(s=>!s.done).length-2} more` : ''}
            </div>
          )}
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{fontSize:11, color:'#8896a7'}}>{expanded ? 'Collapse' : 'Expand'}</span>
          <span style={{fontSize:12, color:'#8896a7', transform: expanded?'rotate(180deg)':'none', transition:'transform 0.2s', display:'inline-block'}}>▼</span>
          <button onClick={dismiss}
            style={{background:'none', border:'none', color:'#d1d5db', cursor:'pointer', fontSize:16, lineHeight:1, padding:'0 0 0 4px'}}
            title="Dismiss">✕</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{height:3, background:'#f8fafc'}}>
        <div style={{height:'100%', width:`${pct}%`, background:'#0073d1', transition:'width 0.5s ease'}}/>
      </div>

      {/* Expanded steps */}
      {expanded && (
        <div style={{padding:'4px 16px 12px'}}>
          {steps.map((step, i) => (
            <div key={step.id} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0',
              borderBottom: i < steps.length-1 ? '1px solid #f9fafb' : 'none'}}>
              <div style={{width:22, height:22, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                background: step.done ? '#0073d1' : '#f3f4f6',
                border: step.done ? 'none' : '2px solid #d1d5db'}}>
                {step.done && <span style={{color:'#1a2332', fontSize:11, fontWeight:800}}>✓</span>}
              </div>
              <span style={{flex:1, fontSize:12, color: step.done?'#9ca3af':'#111827',
                fontWeight: step.done ? 400 : 500,
                textDecoration: step.done ? 'line-through' : 'none'}}>
                {step.label}
              </span>
              {!step.done && step.action && (
                <button onClick={step.action}
                  style={{padding:'4px 11px', background:'#e8f3fc', color:'#0073d1', border:'1px solid var(--green-bdr)', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap'}}>
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
  const [dnsFilter,setDnsFilter]=useState('ALL')
  const [fleetView,setFleetView]=useState(false)
  const [sortCol,setSortCol]=useState('score')
  const [sortDir,setSortDir]=useState('desc')

  useEffect(()=>{if(user)fetchDomains()},[user])
  useEffect(()=>{setDnsFilter('ALL')},[selected?.id])

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
  const cardHd={padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#f8fafc'}

  const cats=scan?[
    {label:'DNS records',icon:Globe,color:'#7c3aed',bg:'#e0f2fe',score:scan.score_dns,max:25,tab:'dns'},
    {label:'Email auth',icon:Mail,color:'#e53e3e',bg:'#fff5f5',score:scan.score_email,max:30,tab:'email'},
    {label:'SSL / TLS',icon:Lock,color:'#1a2332',bg:'#e8f3fc',score:scan.score_ssl,max:20},
    {label:'Propagation',icon:Globe,color:'#d97706',bg:'#e8f3fc',score:scan.score_propagation,max:10,tab:'propagation'},
    {label:'Security',icon:Shield,color:'#4338ca',bg:'#f5f3ff',score:scan.score_security,max:10,tab:'overview'},
    {label:'Blacklists',icon:Ban,color:'#e53e3e',bg:'#fff5f5',score:scan.score_blacklist,max:5,tab:'blacklists'},
  ]:[]

  const tabs=['overview','email','ssl','propagation','blacklists','dns']

  return (
    <div style={{display:'flex',height:'calc(100vh - 56px)',background:'#f4f6f8',fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .dsh-row:hover{background:rgba(255,107,43,0.07)!important;transition:background 0.12s}
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
        <div style={{padding:12,borderBottom:'1px solid var(--border)'}}>
          <button onClick={()=>setShowAdd(true)}
            style={{width:'100%',padding:'8px 12px',background:'#ffffff',border:'none',borderRadius:9,color:'#1a2332',fontSize:13,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
            <Plus size={14}/> Add domain
          </button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
          <div style={{fontSize:10,fontWeight:600,color:'#4a5568',textTransform:'uppercase',letterSpacing:'0.09em',padding:'4px 14px 6px'}}>Domains</div>
          {loading?[1,2].map(i=><div key={i} style={{margin:'4px 10px',height:44,borderRadius:8,background:'#f8fafc'}}/>)
          :domains.map((d,di)=>{
            const s=d.scan_results?.[0]; const score=s?.health_score; const isActive=selected?.id===d.id
            const sc=score>=70?'#0073d1':score>=50?'#0073d1':'#e53e3e'
            const critCount=s?.issues?.filter(i=>i.severity==='critical').length||0
            return (
              <div key={d.id} className="dsh-row" onClick={()=>{setSelected(d); onDomainSelect?.(d); setActiveTab('overview')}}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',cursor:'pointer',background:isActive?'#e8f3fc':'transparent',borderLeft:`3px solid ${isActive?'#0073d1':'transparent'}`,transition:'background 0.12s'}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:d.paused?'#4a5470':!d.verified?'#ffb224':sc,flexShrink:0,animation:(!d.paused&&d.verified&&sc==='#0073d1')?'pulse-dot 2s ease-in-out infinite':'none'}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:'#1a2332',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{d.domain_name}</div>
                  <div style={{fontSize:10,color:'#4a5568'}}>{!d.verified?'Pending verification':d.paused?'Paused':`${critCount>0?`${critCount} critical · `:''}${d.monitor_interval}`}</div>
                </div>
                {score!=null&&<span style={{fontSize:13,fontWeight:700,color:sc}}>{score}</span>}
                <div onClick={e=>{e.stopPropagation();setDeleteTarget(d)}} style={{color:'#4a5568',cursor:'pointer',padding:2}}><Trash2 size={11}/></div>
              </div>
            )
          })}
        </div>
        {domains.length>0&&(()=>{
          const scored=domains.filter(d=>d.scan_results?.[0])
          const avg=scored.length?Math.round(scored.reduce((a,d)=>a+(d.scan_results[0].health_score||0),0)/scored.length):0
          const c=avg>=70?'#0073d1':avg>=50?'#0073d1':'#e53e3e'
          return (
            <div style={{padding:'12px 14px',borderTop:'1px solid #f0f2f5',background:'#f8fafc'}}>
              <div style={{fontSize:10,color:'#4a5568',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Fleet avg score</div>
              <div style={{fontSize:22,fontWeight:700,color:c,lineHeight:1,marginBottom:5}}>{avg||'–'}</div>
              <AnimBar pct={avg} color={c} h={3}/>
              <div style={{fontSize:10,color:'#4a5568',marginTop:4}}>{domains.length} domain{domains.length>1?'s':''} · {domains.filter(d=>d.scan_results?.[0]?.issues?.some(i=>i.severity==='critical')).length} with critical issues</div>
            </div>
          )
        })()}
      </div>

      {/* ── MAIN ─────────────────────────────────────────────── */}
      <div style={{flex:1,overflowY:'auto',background:'#f4f6f8'}}>
        {/* ── FLEET COMPARISON VIEW ── */}
        {fleetView && domains.length > 0 && (() => {
          const cols = [
            {key:'domain', label:'Domain',      sort:false},
            {key:'score',  label:'Score',       sort:true},
            {key:'dns',    label:'DNS',         sort:true},
            {key:'email',  label:'Email',       sort:true},
            {key:'ssl',    label:'SSL',         sort:true},
            {key:'prop',   label:'Propagation', sort:true},
            {key:'sec',    label:'Security',    sort:true},
            {key:'bl',     label:'Blacklists',  sort:true},
            {key:'issues', label:'Issues',      sort:true},
          ]
          const rows = domains.map(d => {
            const s = d.scan_results?.[0]
            return {
              id: d.id, domain: d.domain_name, verified: d.verified,
              score: s?.health_score ?? null,
              dns: s?.score_dns ?? null, email: s?.score_email ?? null,
              ssl: s?.score_ssl ?? null, prop: s?.score_propagation ?? null,
              sec: s?.score_security ?? null, bl: s?.score_blacklist ?? null,
              issues: (s?.issues||[]).length,
              scanned: s?.scanned_at,
            }
          })
          const sorted = [...rows].sort((a,b) => {
            const va = a[sortCol] ?? -1, vb = b[sortCol] ?? -1
            return sortDir==='desc' ? vb - va : va - vb
          })
          const sc = v => v === null ? '#c8d6e5' : v >= 70 ? '#0073d1' : v >= 50 ? '#d97706' : '#e53e3e'
          const sbg = v => v === null ? '#f8fafc' : v >= 70 ? '#e8f3fc' : v >= 50 ? '#fffbeb' : '#fff5f5'
          const toggle = col => { if(sortCol===col){setSortDir(d=>d==='desc'?'asc':'desc')}else{setSortCol(col);setSortDir('desc')} }

          return (
          <div style={{padding:'16px 20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:'#1a2332'}}>Fleet overview</div>
                <div style={{fontSize:11,color:'#8896a7',marginTop:2}}>{domains.length} domain{domains.length!==1?'s':''} · click a row to inspect</div>
              </div>
              <button onClick={()=>setFleetView(false)} style={{padding:'6px 14px',background:'#ffffff',color:'#4a5568',border:'1px solid #c8d6e5',borderRadius:7,fontSize:12,cursor:'pointer'}}>← Detail view</button>
            </div>
            <div style={{background:'#ffffff',border:'1px solid #e2e8f0',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead>
                    <tr style={{background:'#fafbfc'}}>
                      {cols.map(col => (
                        <th key={col.key}
                          onClick={col.sort ? ()=>toggle(col.key) : undefined}
                          style={{textAlign:'left',padding:'10px 14px',fontSize:10,fontWeight:700,color:sortCol===col.key?'#0073d1':'#8896a7',textTransform:'uppercase',letterSpacing:'0.07em',borderBottom:'1.5px solid #e2e8f0',cursor:col.sort?'pointer':'default',whiteSpace:'nowrap',userSelect:'none',transition:'color 0.15s'}}>
                          {col.label}{sortCol===col.key ? (sortDir==='desc'?' ↓':' ↑') : ''}
                        </th>
                      ))}
                      <th style={{textAlign:'left',padding:'10px 14px',fontSize:10,fontWeight:700,color:'#8896a7',textTransform:'uppercase',letterSpacing:'0.07em',borderBottom:'1.5px solid #e2e8f0',whiteSpace:'nowrap'}}>Last Scan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row,i) => (
                      <tr key={row.id}
                        onClick={()=>{const d=domains.find(x=>x.id===row.id);if(d){setSelected(d);setFleetView(false)}}}
                        style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'#ffffff':'#fafbfc',cursor:'pointer',transition:'background 0.1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#f0f7ff'}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#ffffff':'#fafbfc'}>
                        <td style={{padding:'10px 14px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:7}}>
                            <div style={{width:6,height:6,borderRadius:'50%',background:row.score===null?'#c8d6e5':sc(row.score),flexShrink:0}}/>
                            <span style={{fontFamily:'monospace',fontWeight:600,color:'#1a2332',fontSize:12}}>{row.domain}</span>
                            {!row.verified&&<span style={{fontSize:9,background:'#fffbeb',color:'#b45309',border:'1px solid #fcd34d',padding:'1px 5px',borderRadius:4,fontWeight:600}}>unverified</span>}
                          </div>
                        </td>
                        {['score','dns','email','ssl','prop','sec','bl'].map(key => (
                          <td key={key} style={{padding:'10px 14px'}}>
                            {row[key]===null ? <span style={{color:'#c8d6e5',fontSize:11}}>–</span> : (
                              <div>
                                <div style={{fontSize:13,fontWeight:700,color:sc(row[key])}}>{row[key]}</div>
                                <div style={{height:3,background:'#f1f5f9',borderRadius:2,marginTop:3,width:40}}>
                                  <div style={{height:'100%',width:`${row[key]}%`,background:sc(row[key]),borderRadius:2,transition:'width 0.4s'}}/>
                                </div>
                              </div>
                            )}
                          </td>
                        ))}
                        <td style={{padding:'10px 14px'}}>
                          {row.issues > 0
                            ? <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:'#fff5f5',color:'#e53e3e',border:'1px solid #feb2b2',fontWeight:600}}>{row.issues}</span>
                            : <span style={{fontSize:11,color:'#0073d1'}}>✓</span>}
                        </td>
                        <td style={{padding:'10px 14px',color:'#8896a7',fontSize:11,whiteSpace:'nowrap'}}>
                          {row.scanned ? new Date(row.scanned).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '–'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          )
        })()}
        {!fleetView && !selected?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px',minHeight:'60vh'}}>
            <div style={{width:'100%',maxWidth:540}}>
              {/* Hero */}
              <div style={{textAlign:'center',marginBottom:32}}>
                <div style={{width:64,height:64,background:'#e8f3fc',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
                  <Shield size={30} color="#0073d1"/>
                </div>
                <h2 style={{fontSize:22,fontWeight:800,color:'#1a2332',marginBottom:8,letterSpacing:'-0.02em'}}>Welcome to DomainRadar</h2>
                <p style={{fontSize:14,color:'#4a5568',lineHeight:1.7,maxWidth:400,margin:'0 auto'}}>
                  Monitor your domain's DNS health, email security, SSL certificates and blacklist status — all in one place.
                </p>
              </div>
              {/* Steps */}
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:28}}>
                {[
                  {n:1,icon:'🌐',title:'Add your domain',      body:'Enter any domain you own or manage.',          done:false,active:true},
                  {n:2,icon:'✅',title:'Verify ownership',     body:'Add a TXT record to prove you own the domain.', done:false,active:false},
                  {n:3,icon:'🔍',title:'Run first scan',       body:'Full DNS, email, SSL and blacklist audit.',     done:false,active:false},
                  {n:4,icon:'🔧',title:'Fix critical issues',  body:'One-click auto-fix via Cloudflare.',            done:false,active:false},
                  {n:5,icon:'🔔',title:'Enable monitoring',    body:'Get alerted when anything changes.',            done:false,active:false},
                ].map(step => (
                  <div key={step.n} style={{display:'flex',gap:14,padding:'12px 16px',background:step.active?'#e8f3fc':'#f8fafc',border:`1px solid ${step.active?'#a8d0f0':'#e2e8f0'}`,borderRadius:10,alignItems:'flex-start',opacity:step.active?1:0.6}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:step.active?'#0073d1':'#e2e8f0',color:step.active?'#ffffff':'#8896a7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>{step.n}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:step.active?'#1a2332':'#4a5568',marginBottom:2}}>{step.icon} {step.title}</div>
                      <div style={{fontSize:12,color:'#8896a7'}}>{step.body}</div>
                    </div>
                    {step.active&&<div style={{marginLeft:'auto',fontSize:11,color:'#0073d1',fontWeight:600,flexShrink:0,marginTop:2}}>← Start here</div>}
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                <button onClick={()=>setShowAdd(true)} style={{padding:'11px 28px',background:'#0073d1',color:'#ffffff',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:7}}>
                  <Plus size={16}/> Add your first domain
                </button>
                <button onClick={()=>{setScanDomain('');setPage('scan')}} style={{padding:'11px 20px',background:'#ffffff',color:'#4a5568',border:'1px solid #c8d6e5',borderRadius:9,fontSize:13,fontWeight:500,cursor:'pointer'}}>
                  Scan without account →
                </button>
              </div>
            </div>
          </div>
        ):(!fleetView && selected)?(
          <div>
            {/* ── DOMAIN HEADER ── */}
            <div className="no-print" style={{padding:'14px 20px',borderBottom:'1px solid #e4e7ec',background:'#ffffff'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                    <h2 style={{fontSize:17,fontWeight:700,color:'#1a2332',margin:0,letterSpacing:'-0.02em'}}>{selected.domain_name}</h2>
                    {selected.verified
                      ? <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#e8f3fc',color:'#0059a5',border:'1px solid #a8d0f0',fontWeight:600}}>✓ Verified</span>
                      : <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#fffbeb',color:'#b45309',border:'1px solid #fcd34d',fontWeight:600}}>⏳ Pending verification</span>
                    }
                    {selected.paused&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#f8fafc',color:'#4a5568',border:'1px solid var(--border)',fontWeight:500}}>Paused</span>}
                    {critical.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#fff5f5',color:'#e53e3e',border:'1px solid var(--pk-bdr)',fontWeight:600}}>{critical.length} critical</span>}
                    {warns.length>0&&<span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#fffbeb',color:'#d97706',border:'1px solid var(--or-bdr)',fontWeight:600}}>{warns.length} warnings</span>}
                  </div>
                  <div style={{fontSize:12,color:'#4a5568',display:'flex',gap:14,flexWrap:'wrap',marginBottom:10}}>
                    {scan?.blacklists?.ip&&<span style={{fontFamily:'monospace',color:'#1a2332'}}>{scan.blacklists.ip}</span>}
                    <span>{selected.monitor_interval} monitoring</span>
                    {scan?.scanned_at&&<span>Scanned {timeAgo(scan.scanned_at)}</span>}
                  </div>
                  {/* Sub-nav tabs */}
                  <div style={{display:'flex',gap:0,borderBottom:'1px solid #e4e7ec',marginBottom:-14}}>
                    {tabs.map(t=>(
                      <button key={t} className="dsh-tab" onClick={()=>setActiveTab(t)}
                        style={{padding:'8px 14px',background:'transparent',border:'none',borderBottom:`2px solid ${activeTab===t?'#0073d1':'transparent'}`,cursor:'pointer',fontSize:12,fontWeight:activeTab===t?700:400,color:activeTab===t?'#0073d1':'#8896a7',textTransform:'capitalize',transition:'all 0.15s',marginBottom:-1,fontFamily:'inherit'}}>
                        {t==='ssl'?'SSL/TLS':t==='dns'?'DNS Records':t.charAt(0).toUpperCase()+t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Score gauge */}
                {scan&&<Gauge score={scan.health_score} size={130}/>}
                {/* Actions */}
                <div style={{display:'flex',flexDirection:'column',gap:6,alignSelf:'flex-start'}}>
                  <RescanButton domain={selected} user={user} onComplete={fetchDomains}/>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                    <NotificationBell user={user} setPage={setPage}/>
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
              {/* Unverified banner */}
              {!selected.verified && (
                <div style={{margin:'16px 20px 0',padding:'14px 18px',background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:10,display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{fontSize:20,flexShrink:0}}>⏳</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#92400e',marginBottom:4}}>Domain not yet verified</div>
                    <div style={{fontSize:12,color:'#b45309',lineHeight:1.6,marginBottom:10}}>
                      You need to add a TXT record to prove you own this domain before monitoring begins and scan results appear.
                    </div>
                    <button onClick={()=>setShowAdd(true)}
                      style={{padding:'7px 16px',background:'#d97706',color:'#ffffff',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                      Verify ownership →
                    </button>
                  </div>
                </div>
              )}
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
                      {label:'Critical issues',val:critical.length,color:critical.length>0?'#e53e3e':'#0073d1',sub:critical.length>0?'Fix immediately':'All clear',pct:Math.min(critical.length*25,100),tab:'overview'},
                      ...(()=>{
                        const days=scan.ssl_info?.certs?.[0]?.days_remaining
                        const c=days==null?'#6b7280':days<=7?'#e53e3e':days<=30?'#0073d1':days<=60?'#0284c7':'#0073d1'
                        const expDate=scan.ssl_info?.certs?.[0]?.expires_at
                        return [{label:'SSL expiry',val:days==null?'—':days<=0?'Expired':`${days}d`,color:c,sub:days==null?'Scan to check':days<=0?'Renew immediately':days<=30?'Renew soon':`Expires ${expDate?new Date(expDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'soon'}`,pct:days==null?0:Math.min(100,Math.max(5,days/365*100)),tab:'ssl'}]
                      })(),
                      {label:'Blacklisted',val:`${scan.blacklists?.listed_count||0}/${scan.blacklists?.results?.length||0}`,color:(scan.blacklists?.listed_count||0)>0?'#e53e3e':'#0073d1',sub:'blacklists',pct:(scan.blacklists?.listed_count||0)>0?60:100,tab:'blacklists'},
                    ].map(k=>(
                      <div key={k.label} className="print-card" onClick={()=>setActiveTab(k.tab)} style={{background:'#ffffff',border:'1px solid #e4e7ec',borderTop:`3px solid ${k.color}`,borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',transition:'transform 0.15s,box-shadow 0.15s',animation:'fadeIn 0.2s ease both',cursor:'pointer'}}
                        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 16px rgba(0,0,0,0.1)'}}
                        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'}}>
                        <div style={{fontSize:10,fontWeight:700,color:'#8896a7',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.09em'}}>{k.label}</div>
                        <div style={{fontSize:34,fontWeight:800,color:'#1a2332',lineHeight:1,letterSpacing:'-0.04em',marginBottom:4}}>{k.val}</div>
                        <div style={{fontSize:12,color:'#8896a7',marginBottom:12}}>{k.sub}</div>
                        <div style={{height:4,background:'#f8fafc',borderRadius:2}}>
                          <div style={{height:'100%',width:`${k.pct}%`,borderRadius:2,background:k.color,transition:'width 0.9s cubic-bezier(.4,0,.2,1)'}}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Score history + Category breakdown */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
                    <div className="print-card" style={{...card,padding:'14px 16px'}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#1a2332',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                        <span style={{width:3,height:14,background:'#0073d1',borderRadius:2,display:'inline-block'}}/>
                        Score history
                      </div>
                      <ScoreHistoryChart domainId={selected.id}/>
                    </div>
                    <div className="print-card" style={{...card}}>
                      <div style={{...cardHd}}>
                        <span style={{fontSize:12,fontWeight:700,color:'#1a2332'}}>Score breakdown</span>
                        <span style={{fontSize:10,color:'#4a5568'}}>weighted 0–100</span>
                      </div>
                      <div style={{padding:'8px 16px'}}>
                        {cats.map((c,i)=>(
                          <div key={c.label} style={{animationDelay:`${i*50}ms`}} className='stagger-1' onClick={()=>c.tab&&setActiveTab(c.tab)} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',borderBottom:'1px solid var(--border)',cursor:'pointer',borderRadius:6,transition:'background 0.12s'}}
                            onMouseEnter={e=>e.currentTarget.style.background='#f0f7ff'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <div style={{width:26,height:26,borderRadius:7,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              <c.icon size={13} color={c.color}/>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                                <span style={{fontSize:12,color:'#4a5568'}}>{c.label}</span>
                                <span style={{fontSize:12,fontWeight:700,color:c.color}}>{c.score}<span style={{fontSize:10,color:'#4a5568',fontWeight:400}}>/{c.max}</span></span>
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
                      <span style={{fontSize:12,fontWeight:700,color:'#1a2332'}}>DMARC enforcement journey</span>
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
                    <div style={{fontSize:12,fontWeight:700,color:'#1a2332',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><Clock size={13} color={D.muted}/> Monitor interval</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {['1h','6h','24h','off'].map(iv=>(
                        <button key={iv} onClick={()=>updateInterval(selected.id,iv)}
                          style={{padding:'7px 16px',background:selected.monitor_interval===iv?'#e8f3fc':'#fff',border:`1px solid ${selected.monitor_interval===iv?'#0073d1':'#e2e8f0'}`,borderRadius:8,color:selected.monitor_interval===iv?'#0059a5':'#4a5568',fontSize:12,fontWeight:selected.monitor_interval===iv?700:500,cursor:'pointer'}}>
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
                  <div style={cardHd}><span style={{fontSize:12,fontWeight:700,color:'#1a2332',display:'flex',alignItems:'center',gap:6}}><Mail size={13} color="#a78bfa"/> Email authentication</span></div>
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
                    <div key={r.name} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'12px 16px',borderBottom:'1px solid var(--border)',background:isMissing&&r.fixType?'#fefafa':'transparent'}}>
                      <div style={{width:84,flexShrink:0,minWidth:84}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#0073d1',fontFamily:'monospace',letterSpacing:'0.04em',textTransform:'uppercase'}}>{r.name}</div>
                        {r.extra&&<div style={{fontSize:10,color:'#4a5568',marginTop:3}}>{r.extra}</div>}
                      </div>
                      <div style={{flex:1}}>
                        {r.val&&<div style={{fontSize:12,fontFamily:'monospace',color:'#1a2332',marginBottom:4,wordBreak:'break-all',padding:'4px 8px',background:'#f8fafc',borderRadius:5,border:'1px solid var(--border)'}}>{r.val}</div>}
                        {r.note&&<div style={{fontSize:12,color:'#4a5568',lineHeight:1.5}}>{r.note}</div>}
                        {r.suggest&&<div style={{marginTop:5,padding:'6px 10px',background:'#e8f3fc',border:'1px solid var(--green-bdr)',borderRadius:6,fontSize:12,fontFamily:'monospace',color:'#0059a5',wordBreak:'break-all'}}>✦ Suggestion: {r.suggest}</div>}
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
                      <span style={{fontSize:12,fontWeight:700,color:'#1a2332',display:'flex',alignItems:'center',gap:6}}><Lock size={13} color="var(--green)"/> SSL / TLS Certificate</span>
                      <SBadge status={scan.ssl_info.overall_status}/>
                    </div>
                    {scan.ssl_info.certs?.length > 0 ? scan.ssl_info.certs.map((cert,i)=>{
                      const days = cert.days_remaining ?? null
                      const expiry = cert.expires_at || cert.not_after || cert.valid_to
                      const issued = cert.not_before || cert.valid_from
                      const daysColor = days===null?'#6b7280':days<=7?'#e53e3e':days<=30?'#0073d1':days<=60?'#0284c7':'#0073d1'
                      const issuer = cert.issuer_org || cert.issuer_cn || cert.issuer || null
                      return (
                        <div key={i} style={{padding:'16px'}}>
                          {/* Big expiry highlight */}
                          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16,padding:'14px 16px',background:days===null?'#f8fafc':days<=30?'#fff5f5':'#e8f3fc',borderRadius:10,border:`1px solid ${days===null?'#e2e8f0':days<=30?'#feb2b2':'#a8d0f0'}`}}>
                            <Lock size={28} color={daysColor}/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:22,fontWeight:800,color:daysColor,letterSpacing:'-0.04em',lineHeight:1}}>
                                {days===null ? 'Active' : days<=0 ? 'Expired' : `${days} days`}
                              </div>
                              <div style={{fontSize:12,color:'#8896a7',marginTop:3}}>
                                {expiry ? `Expires ${new Date(expiry).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}` : 'Certificate valid'}
                              </div>
                            </div>
                            {issuer && (
                              <div style={{textAlign:'right'}}>
                                <div style={{fontSize:10,color:'#8896a7',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>Issued by</div>
                                <div style={{fontSize:13,fontWeight:600,color:'#1a2332'}}>{issuer}</div>
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
                              {l:'Chain',        v: cert.chain_valid !== false ? '✓ Valid' : '✗ Invalid', color: cert.chain_valid!==false?'#0073d1':'#e53e3e'},
                              {l:'HSTS',         v: cert.hsts==='HSTS enabled'||cert.hsts_enabled ? '✓ Enabled' : 'Not set', color: cert.hsts==='HSTS enabled'||cert.hsts_enabled?'#0073d1':'#9ca3af'},
                              {l:'CT logged',    v: cert.ct_logged||cert.ct_log ? '✓ Yes' : '—', color: cert.ct_logged||cert.ct_log?'#0073d1':'#9ca3af'},
                              {l:'HTTP→HTTPS',   v: cert.https_redirect ? '✓ Redirects' : '—', color: cert.https_redirect?'#0073d1':'#9ca3af'},
                              {l:'Source',       v: cert.source || 'CT logs'},
                            ].map(f=>(
                              <div key={f.l} style={{padding:'10px 12px',background:'#f8fafc',borderRadius:8,border:'1px solid var(--border)'}}>
                                <div style={{fontSize:10,color:'#8896a7',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{f.l}</div>
                                <div style={{fontSize:13,fontWeight:600,color:f.color||'#111827'}}>{f.v}</div>
                              </div>
                            ))}
                          </div>

                          {/* SANs */}
                          {cert.san?.length > 0 && (
                            <div style={{marginBottom:12}}>
                              <div style={{fontSize:10,color:'#8896a7',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>Subject alt names ({cert.san.length})</div>
                              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                                {cert.san.slice(0,8).map((s)=>(
                                  <span key={s} style={{fontSize:11,fontFamily:'monospace',padding:'2px 8px',borderRadius:5,background:'#f8fafc',border:'1px solid var(--border)',color:'#4a5568'}}>{s}</span>
                                ))}
                                {cert.san.length>8&&<span style={{fontSize:11,color:'#8896a7'}}>+{cert.san.length-8} more</span>}
                              </div>
                            </div>
                          )}

                          <div style={{padding:'10px 14px',background:'#e0f2fe',border:'1px solid #bfdbfe',borderRadius:8,fontSize:12,color:'#0284c7'}}>
                            ℹ {scan.ssl_info.note||'HTTPS connection established successfully.'}
                          </div>
                        </div>
                      )
                    }) : (
                      <div style={{padding:'32px',textAlign:'center',color:'#8896a7'}}>
                        <Lock size={32} style={{marginBottom:10,opacity:0.3}}/>
                        <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>No certificate data yet</div>
                        <div style={{fontSize:12}}>Click "Scan now" to fetch SSL certificate details</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ PROPAGATION ══════════════════════════════ */}
              {activeTab==='propagation'&&scan?.propagation&&(()=>{
                const REGIONS = [
                  {key:'us',   label:'N. America',  resolver:'Cloudflare · 1.1.1.1',   x:'20%', y:'34%'},
                  {key:'eu',   label:'Europe',       resolver:'Google · 8.8.8.8',        x:'48%', y:'24%'},
                  {key:'apac', label:'Asia Pacific', resolver:'Quad9 · 9.9.9.9',         x:'75%', y:'32%'},
                  {key:'au',   label:'Australia',    resolver:'OpenDNS · 208.67.222.222', x:'78%', y:'65%'},
                ]
                const allConsistent = scan.propagation.consistent
                const regionPass = (key) => scan.propagation.records?.every(r => r[key]==='pass')

                return (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>

                  {/* Map card */}
                  <div style={{...card}}>
                    <div style={{...cardHd}}>
                      <span style={{fontSize:12,fontWeight:700,color:'#1a2332',display:'flex',alignItems:'center',gap:6}}>
                        <Globe size={13} color='#0073d1'/> Global propagation status
                      </span>
                      <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:600,padding:'3px 10px',borderRadius:20,background:allConsistent?'#e8f3fc':'#fff5f5',color:allConsistent?'#0073d1':'#e53e3e',border:`1px solid ${allConsistent?'#a8d0f0':'#feb2b2'}`}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:allConsistent?'#0073d1':'#e53e3e',display:'inline-block'}}/>{allConsistent?'Consistent':'Inconsistent'}
                      </span>
                    </div>

                    {/* World map */}
                    <div style={{padding:'0 0 8px',background:'#ffffff'}}>
                      <div style={{position:'relative',borderRadius:'0 0 10px 10px',overflow:'hidden',background:'linear-gradient(160deg,#e8f3fc 0%,#d4eaf8 100%)',margin:'0'}}>
                        {/* SVG World map silhouette */}
                        <svg viewBox="0 0 1010 527" style={{width:'100%',display:'block'}} xmlns="http://www.w3.org/2000/svg">
                          {/* Ocean background */}
                          <rect width="1010" height="527" fill="#dceefb"/>
                          {/* World landmass — simplified Mercator outline paths */}
                          <g fill="#1a7fd4" opacity="0.92">
                            {/* North America */}
                            <path d="M85,62 L95,55 L120,50 L140,48 L165,52 L180,60 L195,58 L210,65 L215,80 L205,95 L195,110 L185,130 L175,150 L160,165 L148,180 L140,195 L125,205 L110,210 L95,215 L80,210 L70,200 L65,185 L60,170 L58,155 L60,140 L65,125 L70,110 L75,95 L78,78 Z"/>
                            {/* Central America */}
                            <path d="M140,210 L155,215 L165,222 L170,235 L162,240 L150,235 L140,225 Z"/>
                            {/* Greenland */}
                            <path d="M160,20 L180,15 L200,18 L210,28 L205,40 L190,45 L175,42 L165,35 Z"/>
                            {/* South America */}
                            <path d="M155,252 L175,245 L195,248 L210,260 L220,278 L225,298 L228,318 L225,340 L218,358 L208,372 L195,382 L180,385 L165,378 L155,365 L148,348 L145,330 L145,310 L148,290 L150,270 Z"/>
                            {/* Europe */}
                            <path d="M420,52 L435,48 L450,45 L468,48 L480,55 L488,65 L485,78 L475,88 L460,92 L445,95 L430,90 L420,80 L415,68 Z"/>
                            {/* Scandinavia */}
                            <path d="M452,28 L465,22 L480,25 L488,35 L485,48 L472,52 L460,48 L450,40 Z"/>
                            {/* UK */}
                            <path d="M408,52 L418,48 L424,55 L420,65 L410,68 L404,60 Z"/>
                            {/* Africa */}
                            <path d="M440,118 L460,112 L480,115 L498,125 L512,140 L520,158 L525,178 L525,198 L522,218 L515,238 L505,255 L492,268 L478,275 L462,278 L448,272 L436,260 L428,244 L422,226 L418,208 L416,188 L418,168 L422,148 L430,132 Z"/>
                            {/* Madagascar */}
                            <path d="M530,218 L538,212 L544,220 L542,234 L535,240 L528,232 Z"/>
                            {/* Russia */}
                            <path d="M490,28 L530,20 L580,18 L630,22 L680,28 L720,32 L750,38 L775,42 L790,52 L780,65 L760,72 L735,75 L710,78 L685,75 L660,72 L635,70 L610,68 L585,65 L560,62 L535,58 L510,52 L495,42 Z"/>
                            {/* Central Asia */}
                            <path d="M560,75 L600,72 L640,75 L670,82 L680,95 L670,108 L650,115 L625,118 L600,115 L578,108 L562,98 Z"/>
                            {/* China/East Asia */}
                            <path d="M660,72 L700,68 L738,72 L762,80 L778,92 L782,108 L775,122 L758,132 L738,138 L715,140 L692,138 L672,130 L658,118 L650,105 L652,90 Z"/>
                            {/* India */}
                            <path d="M595,118 L618,115 L635,120 L645,135 L648,152 L642,168 L630,178 L615,182 L600,178 L588,165 L582,150 L582,135 Z"/>
                            {/* Southeast Asia */}
                            <path d="M715,140 L745,138 L768,145 L782,158 L785,172 L775,182 L758,185 L738,180 L720,168 L710,155 Z"/>
                            {/* Japan */}
                            <path d="M780,75 L790,70 L800,75 L798,85 L788,88 L780,83 Z"/>
                            {/* Indonesia */}
                            <path d="M730,185 L755,182 L778,188 L790,198 L788,210 L775,215 L752,212 L730,205 L720,195 Z"/>
                            <path d="M795,200 L815,195 L832,202 L835,215 L825,222 L808,220 L795,210 Z"/>
                            {/* Middle East */}
                            <path d="M520,100 L545,95 L565,98 L578,108 L575,122 L560,130 L542,132 L525,125 L515,112 Z"/>
                            {/* Australia */}
                            <path d="M738,295 L768,288 L800,290 L828,298 L848,312 L858,330 L858,348 L850,364 L835,375 L815,380 L792,378 L770,370 L750,358 L736,342 L728,324 L728,308 Z"/>
                            {/* New Zealand */}
                            <path d="M868,358 L878,350 L886,358 L884,370 L875,375 L866,368 Z"/>
                            {/* Caribbean */}
                            <path d="M168,192 L180,188 L190,192 L192,200 L182,204 L170,200 Z"/>
                            {/* Philippines */}
                            <path d="M770,155 L780,150 L788,158 L785,168 L775,172 L768,164 Z"/>
                          </g>

                          {/* Graticule lines — subtle */}
                          <g stroke="#b8d8f0" strokeWidth="0.5" opacity="0.5">
                            <line x1="0" y1="263" x2="1010" y2="263"/>
                          </g>
                          <text x="8" y="270" fontSize="9" fill="#8bb8d8" opacity="0.7">0°</text>

                          {/* Resolver pins — positioned on map */}
                          {REGIONS.map(reg => {
                            const pass = regionPass(reg.key)
                            const pinX = parseFloat(reg.x) / 100 * 1010
                            const pinY = parseFloat(reg.y) / 100 * 527
                            const pinColor = pass ? '#ffffff' : '#ff4444'
                            const pinStroke = pass ? '#0059a5' : '#cc0000'
                            const dotColor = pass ? '#0059a5' : '#e53e3e'
                            return (
                              <g key={reg.key} transform={`translate(${pinX},${pinY})`}>
                                {/* Map pin shape */}
                                <path d="M0,-26 C-10,-26 -18,-18 -18,-8 C-18,6 0,22 0,22 C0,22 18,6 18,-8 C18,-18 10,-26 0,-26 Z"
                                  fill={pass ? '#1a7fd4' : '#e53e3e'}
                                  stroke="#ffffff"
                                  strokeWidth="2.5"
                                  style={{filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.25))'}}
                                />
                                {/* Inner circle */}
                                <circle cx="0" cy="-8" r="7" fill="#ffffff" opacity="0.95"/>
                                {/* Status indicator */}
                                {pass
                                  ? <path d="M-4,-8 L-1,-5 L5,-12" stroke={dotColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                  : <><line x1="-3" y1="-11" x2="3" y2="-5" stroke={pinColor} strokeWidth="2.5" strokeLinecap="round"/><line x1="3" y1="-11" x2="-3" y2="-5" stroke={pinColor} strokeWidth="2.5" strokeLinecap="round"/></>
                                }
                                {/* Label */}
                                <rect x="-32" y="24" width="64" height="16" rx="8" fill="rgba(255,255,255,0.92)" stroke={pass?'#a8d0f0':'#feb2b2'} strokeWidth="1"/>
                                <text x="0" y="35" textAnchor="middle" fontSize="8.5" fill={pass?'#0059a5':'#c53030'} fontWeight="700" fontFamily="'Plus Jakarta Sans',system-ui">{reg.label}</text>
                              </g>
                            )
                          })}
                        </svg>

                        {/* Legend */}
                        <div style={{position:'absolute',bottom:10,right:12,display:'flex',gap:12,background:'rgba(255,255,255,0.88)',borderRadius:8,padding:'5px 12px',border:'1px solid #e2e8f0',backdropFilter:'blur(4px)'}}>
                          <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#4a5568',fontWeight:500}}>
                            <svg width="12" height="16" viewBox="0 0 12 16"><path d="M6,0 C2.7,0 0,2.7 0,6 C0,10.5 6,16 6,16 C6,16 12,10.5 12,6 C12,2.7 9.3,0 6,0Z" fill="#1a7fd4"/><circle cx="6" cy="6" r="3" fill="white"/></svg>
                            Propagated
                          </span>
                          <span style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#4a5568',fontWeight:500}}>
                            <svg width="12" height="16" viewBox="0 0 12 16"><path d="M6,0 C2.7,0 0,2.7 0,6 C0,10.5 6,16 6,16 C6,16 12,10.5 12,6 C12,2.7 9.3,0 6,0Z" fill="#e53e3e"/><circle cx="6" cy="6" r="3" fill="white"/></svg>
                            Inconsistent
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Resolver cards */}
                    <div style={{padding:'14px',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
                      {REGIONS.map(reg => {
                        const pass = regionPass(reg.key)
                        return (
                          <div key={reg.key} style={{background:'#ffffff',border:`1.5px solid ${pass?'#a8d0f0':'#feb2b2'}`,borderRadius:10,padding:'12px',borderTop:`3px solid ${pass?'#0073d1':'#e53e3e'}`}}>
                            <div style={{fontSize:12,fontWeight:700,color:'#1a2332',marginBottom:3}}>{reg.label}</div>
                            <div style={{fontSize:10,color:'#8896a7',fontFamily:'monospace',marginBottom:8}}>{reg.resolver}</div>
                            <div style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 8px',borderRadius:10,background:pass?'#e8f3fc':'#fff5f5',border:`1px solid ${pass?'#a8d0f0':'#feb2b2'}`}}>
                              <div style={{width:6,height:6,borderRadius:'50%',background:pass?'#0073d1':'#e53e3e'}}/>
                              <span style={{fontSize:10,fontWeight:700,color:pass?'#0073d1':'#e53e3e'}}>{pass?'Propagated':'Inconsistent'}</span>
                            </div>
                            <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:8}}>
                              {scan.propagation.records?.map(rec=>{
                                const ok=rec[reg.key]==='pass'
                                return <span key={rec.type} style={{fontSize:9,fontFamily:'monospace',fontWeight:700,padding:'1px 5px',borderRadius:3,background:ok?'#e8f3fc':'#fff5f5',color:ok?'#0059a5':'#c53030',border:`1px solid ${ok?'#a8d0f0':'#feb2b2'}`}}>{rec.type}</span>
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Record breakdown table */}
                  {scan.propagation.records?.length > 0 && (
                    <div style={card}>
                      <div style={cardHd}>
                        <span style={{fontSize:12,fontWeight:700,color:'#1a2332'}}>Record-by-record breakdown</span>
                        <span style={{fontSize:11,color:'#8896a7'}}>{scan.propagation.records.filter(r=>['us','eu','apac','au'].every(k=>r[k]==='pass')).length} / {scan.propagation.records.length} consistent</span>
                      </div>
                      <div style={{overflowX:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                          <thead>
                            <tr style={{background:'#fafbfc'}}>
                              {['Record type','N. America 🇺🇸','Europe 🇪🇺','Asia Pacific 🌏','Australia 🇦🇺','Overall'].map(h=>(
                                <th key={h} style={{textAlign:'left',padding:'8px 14px',fontSize:10,fontWeight:700,color:'#8896a7',borderBottom:'1.5px solid #e2e8f0',textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap'}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {scan.propagation.records.map((rec,i)=>{
                              const allOk=['us','eu','apac','au'].every(k=>rec[k]==='pass')
                              return (
                                <tr key={i} style={{borderBottom:'1px solid #f1f5f9',background:i%2?'#fafbfc':'#ffffff'}}>
                                  <td style={{padding:'9px 14px'}}><span style={{fontFamily:'monospace',fontWeight:700,fontSize:11,background:'#e8f3fc',color:'#0059a5',padding:'2px 7px',borderRadius:4}}>{rec.type}</span></td>
                                  {['us','eu','apac','au'].map(k=>(
                                    <td key={k} style={{padding:'9px 14px'}}>
                                      {rec[k]==='pass'
                                        ? <span style={{color:'#0073d1',fontWeight:700,fontSize:13}}>✓</span>
                                        : <span style={{color:'#e53e3e',fontWeight:700,fontSize:13}}>✗</span>}
                                    </td>
                                  ))}
                                  <td style={{padding:'9px 14px'}}>
                                    <span style={{fontSize:10,padding:'2px 9px',borderRadius:10,fontWeight:600,background:allOk?'#e8f3fc':'#fff5f5',color:allOk?'#0059a5':'#c53030',border:`1px solid ${allOk?'#a8d0f0':'#feb2b2'}`}}>{allOk?'Consistent':'Inconsistent'}</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                )
              })()}

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
                    {[{l:'IP address',v:ip||'–',c:'#7c3aed'},{l:'Lists checked',v:scan.blacklists.results?.length||0,c:'#0284c7'},{l:'Listed on',v:scan.blacklists.listed_count||0,c:(scan.blacklists.listed_count||0)>0?'#e53e3e':'#0073d1'}].map(s=>(
                      <div key={s.l} style={{...card,padding:'14px 16px'}}>
                        <div style={{fontSize:11,color:'#8896a7',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:600}}>{s.l}</div>
                        <div style={{fontSize:22,fontWeight:800,color:s.c,letterSpacing:'-0.02em',fontFamily:'monospace'}}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Listed — delist buttons */}
                  {listed.length>0&&(
                    <div style={card}>
                      <div style={cardHd}>
                        <span style={{fontSize:12,fontWeight:700,color:'#e53e3e',display:'flex',alignItems:'center',gap:6}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:'#e53e3e'}}/> Listed on {listed.length} blacklist{listed.length!==1?'s':''}
                        </span>
                        <span style={{fontSize:11,color:'#8896a7'}}>Click to request removal</span>
                      </div>
                      <div style={{padding:'10px 10px 4px'}}>
                        {listed.map(bl=>{
                          const url=DELIST[bl.name]?.(ip)||null
                          return (
                            <div key={bl.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',marginBottom:6,background:'#fff5f5',borderRadius:9,border:'1px solid var(--pk-bdr)'}}>
                              <div style={{display:'flex',alignItems:'center',gap:8}}>
                                <div style={{width:8,height:8,borderRadius:'50%',background:'#e53e3e',flexShrink:0}}/>
                                <div>
                                  <div style={{fontSize:12,fontFamily:'monospace',fontWeight:600,color:'#1a2332'}}>{bl.name}</div>
                                  <div style={{fontSize:11,color:'#8896a7',marginTop:1}}>IP: {ip}</div>
                                </div>
                              </div>
                              {url
                                ? <a href={url} target='_blank' rel='noopener noreferrer' style={{display:'inline-flex',alignItems:'center',gap:5,padding:'7px 14px',background:'#ffffff',color:'#1a2332',borderRadius:7,fontSize:12,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap',flexShrink:0}}>Request removal →</a>
                                : <span style={{fontSize:11,color:'#8896a7',flexShrink:0}}>Manual removal required</span>
                              }
                            </div>
                          )
                        })}
                      </div>
                      <div style={{padding:'10px 16px',borderTop:'1px solid #f0f2f5',background:'#f8fafc',borderRadius:'0 0 12px 12px'}}>
                        <div style={{fontSize:11,color:'#8896a7',lineHeight:1.7}}>
                          <strong style={{color:'#4a5568'}}>How delisting works:</strong> Click the button to visit each blacklist's removal page. Submit your IP and reason. Most removals take 24–48 hours. Run a fresh scan after to confirm.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All results table */}
                  <div style={card}>
                    <div style={cardHd}>
                      <span style={{fontSize:12,fontWeight:700,color:'#1a2332'}}>All {scan.blacklists.results?.length||0} lists checked</span>
                      {listed.length===0&&<span style={{fontSize:11,color:'#0073d1',fontWeight:600}}>✓ All clean</span>}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                      {scan.blacklists.results?.map(bl=>(
                        <div key={bl.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderBottom:'1px solid var(--border)',background:bl.listed?'rgba(255,61,154,0.06)':'transparent'}}>
                          <span style={{fontSize:11,fontFamily:'monospace',color:bl.listed?'#e53e3e':'#374151',fontWeight:bl.listed?600:400}}>{bl.name}</span>
                          <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:6,background:bl.listed?'#feb2b2':'#e8f3fc',color:bl.listed?'#e53e3e':'#a8d0f0'}}>{bl.listed?'Listed':'Clean'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                )
              })()}

              {/* ══ DNS RECORDS ═══════════════════════════════ */}
              {activeTab==='dns'&&scan?.dns_records&&(()=>{
                const types=['ALL',...[...new Set(scan.dns_records.map(r=>r.type))].sort()]
                const filtered=dnsFilter==='ALL'?scan.dns_records:scan.dns_records.filter(r=>r.type===dnsFilter)
                const typeColor={'A':'#3b82f6','AAAA':'#6366f1','MX':'#0073d1','TXT':'#d97706','CNAME':'#7c3aed','NS':'#0284c7','CAA':'#16a34a','SOA':'#8896a7','SRV':'#e53e3e'}
                return (
                <div style={card}>
                  <div style={cardHd}>
                    <span style={{fontSize:12,fontWeight:700,color:'#1a2332'}}>DNS records</span>
                    <span style={{fontSize:12,color:'#4a5568'}}>{filtered.length} of {scan.dns_records.length}</span>
                  </div>
                  {/* Type filter pills */}
                  <div style={{padding:'10px 16px',borderBottom:'1px solid #e2e8f0',display:'flex',gap:6,flexWrap:'wrap',background:'#fafbfc'}}>
                    {types.map(t=>{
                      const cnt=t==='ALL'?scan.dns_records.length:scan.dns_records.filter(r=>r.type===t).length
                      return (
                        <button key={t} onClick={()=>setDnsFilter(t)}
                          style={{padding:'3px 10px',background:dnsFilter===t?'#0073d1':'#ffffff',color:dnsFilter===t?'#ffffff':typeColor[t]||'#4a5568',border:`1px solid ${dnsFilter===t?'#0073d1':typeColor[t]||'#c8d6e5'}`,borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.12s',fontFamily:'inherit'}}>
                          {t} <span style={{opacity:0.7,fontWeight:400}}>{cnt}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead>
                        <tr style={{background:'#fafbfc'}}>
                          {['Type','Value','TTL','Status'].map(h=>(
                            <th key={h} style={{textAlign:'left',padding:'8px 16px',fontSize:10,fontWeight:700,color:'#8896a7',textTransform:'uppercase',letterSpacing:'0.06em',borderBottom:'1px solid #e2e8f0'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length===0?(
                          <tr><td colSpan={4} style={{padding:'24px',textAlign:'center',color:'#8896a7',fontSize:13}}>No {dnsFilter} records found</td></tr>
                        ):filtered.map((r,i)=>(
                          <tr key={i} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'#ffffff':'#fafbfc',transition:'background 0.1s'}}
                            onMouseEnter={e=>e.currentTarget.style.background='#f0f7ff'}
                            onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#ffffff':'#fafbfc'}>
                            <td style={{padding:'9px 16px',whiteSpace:'nowrap'}}>
                              <span style={{fontSize:10,padding:'2px 8px',borderRadius:5,background:(typeColor[r.type]||'#4a5568')+'18',color:typeColor[r.type]||'#4a5568',fontFamily:'monospace',fontWeight:700}}>{r.type}</span>
                            </td>
                            <td style={{padding:'9px 16px',fontFamily:'monospace',color:'#1a2332',fontSize:11,maxWidth:380,wordBreak:'break-all'}}>{r.value}</td>
                            <td style={{padding:'9px 16px',fontFamily:'monospace',color:'#8896a7',fontSize:11,whiteSpace:'nowrap'}}>{r.ttl}s</td>
                            <td style={{padding:'9px 16px'}}><SBadge status={r.status||'Pass'}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                )
              })()}

            </div>
          </div>
        ):null}
      </div>

      {showAdd&&<AddDomainModal user={user} onClose={()=>setShowAdd(false)} onSuccess={fetchDomains}/>}
      {deleteTarget&&<DeleteModal domain={deleteTarget} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)} loading={deleteLoading}/>}
    </div>
  )
}
