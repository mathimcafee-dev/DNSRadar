import { useState, useEffect } from 'react'
import { ArrowLeft, RefreshCw, Bell, Globe, Mail, Lock, Network, Shield, Ban, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertTriangle, Info, FileDown, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getScoreColor, formatTTL } from '../lib/scoreEngine'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"
const MONO = "'JetBrains Mono','Fira Code',monospace"

// ── Helpers ───────────────────────────────────────────────────────────
function scoreGrade(s) {
  if (s >= 90) return { grade:'A+', color:'#16a34a', bg:'#f0fdf4', ring:'#16a34a' }
  if (s >= 80) return { grade:'A',  color:'#16a34a', bg:'#f0fdf4', ring:'#16a34a' }
  if (s >= 70) return { grade:'B',  color:'#65a30d', bg:'#f7fee7', ring:'#84cc16' }
  if (s >= 60) return { grade:'C',  color:'#d97706', bg:'#fffbeb', ring:'#f59e0b' }
  if (s >= 50) return { grade:'D',  color:'#ea580c', bg:'#fff7ed', ring:'#f97316' }
  return              { grade:'F',  color:'#dc2626', bg:'#fef2f2', ring:'#ef4444' }
}

function StatusChip({ status }) {
  const ok  = ['Pass','Valid','Consistent','Clean','Enforced','Signed','Present','Configured','Blocked','Active','Detected'].includes(status)
  const wn  = ['Warn','Warning','Partial','Quarantine','Testing','Not configured','Missing'].includes(status)
  const info = ['Info','Not found'].includes(status)
  const color = ok ? '#16a34a' : wn ? '#d97706' : info ? '#2563eb' : '#dc2626'
  const bg    = ok ? '#f0fdf4'  : wn ? '#fffbeb'  : info ? '#eff6ff'  : '#fef2f2'
  const bd    = ok ? '#bbf7d0'  : wn ? '#fde68a'  : info ? '#bfdbfe'  : '#fecaca'
  return <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20, background:bg, color, border:`1px solid ${bd}`, whiteSpace:'nowrap' }}>{status || 'Unknown'}</span>
}

function SevIcon({ sev }) {
  if (sev === 'critical') return <div style={{ width:28, height:28, borderRadius:7, background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><XCircle size={14} color="#dc2626"/></div>
  if (sev === 'warn')     return <div style={{ width:28, height:28, borderRadius:7, background:'#fffbeb', border:'1px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><AlertTriangle size={14} color="#d97706"/></div>
  return                         <div style={{ width:28, height:28, borderRadius:7, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Info size={14} color="#2563eb"/></div>
}

function Section({ icon: Icon, iconColor, title, badge, badgeOk, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'14px 18px', background:'#fafafa', border:'none', borderBottom: open ? '1px solid #e5e7eb' : 'none', cursor:'pointer', fontFamily:F, textAlign:'left' }}>
        <div style={{ width:30, height:30, borderRadius:8, background: iconColor+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={15} color={iconColor}/>
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:'#111', flex:1 }}>{title}</span>
        {badge && <StatusChip status={badge}/>}
        {open ? <ChevronUp size={14} color="#9ca3af"/> : <ChevronDown size={14} color="#9ca3af"/>}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

function Row({ label, status, value, note, fix }) {
  return (
    <div style={{ padding:'12px 18px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
      <div style={{ width:100, flexShrink:0 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'#374151', fontFamily:MONO }}>{label}</span>
      </div>
      <div style={{ flex:1, minWidth:180 }}>
        {value && <div style={{ fontSize:12, fontFamily:MONO, color:'#374151', background:'#f8fafc', padding:'5px 10px', borderRadius:6, border:'1px solid #e2e8f0', marginBottom: note||fix ? 6 : 0, wordBreak:'break-all', lineHeight:1.6 }}>{value.slice(0,120)}{value.length>120?'…':''}</div>}
        {note && <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.6 }}>{note}</div>}
        {fix  && <div style={{ fontSize:12, color:'#d97706', marginTop:4, display:'flex', alignItems:'flex-start', gap:5, lineHeight:1.5 }}><AlertTriangle size={12} style={{ flexShrink:0, marginTop:1 }}/> {fix}</div>}
      </div>
      <div style={{ flexShrink:0 }}><StatusChip status={status}/></div>
    </div>
  )
}

// ── PDF export ─────────────────────────────────────────────────────────
function exportPDF(domain, r) {
  const score = r.health_score || 0
  const g = scoreGrade(score)
  const issues = r.issues || []
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
  const row = (label, status, detail='') => {
    const ok = ['Pass','Valid','Clean','Consistent','Enforced','Signed','Present','Configured','Blocked'].includes(status)
    const wn = ['Warn','Warning','Partial','Missing','Not configured'].includes(status)
    const c  = ok ? '#16a34a' : wn ? '#d97706' : '#dc2626'
    const bg = ok ? '#f0fdf4' : wn ? '#fffbeb' : '#fef2f2'
    return `<tr><td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:500;color:#111;">${label}</td><td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;"><span style="background:${bg};color:${c};padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">${status||'–'}</span></td><td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;font-family:monospace;word-break:break-all;">${detail||'—'}</td></tr>`
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DNS Audit — ${domain}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,'Segoe UI',sans-serif;color:#111;background:#fff;padding:40px;max-width:820px;margin:0 auto}h2{font-size:14px;font-weight:700;color:#111;margin:24px 0 10px;text-transform:uppercase;letter-spacing:0.07em;padding-bottom:8px;border-bottom:2px solid #f3f4f6}table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}th{background:#f9fafb;padding:8px 14px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid #e5e7eb}@media print{body{padding:20px}}</style>
  </head><body>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #16a34a;">
    <div>
      <div style="font-size:12px;color:#9ca3af;margin-bottom:4px;">DomainRadar · DNS Security Audit</div>
      <div style="font-size:26px;font-weight:900;letter-spacing:-0.03em;color:#111;">${domain}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:4px;">Generated ${dateStr}</div>
    </div>
    <div style="text-align:center;padding:14px 20px;background:${g.bg};border:2px solid ${g.ring};border-radius:12px;">
      <div style="font-size:42px;font-weight:900;color:${g.color};line-height:1;">${score}</div>
      <div style="font-size:10px;color:${g.color};font-weight:700;">/100</div>
      <div style="font-size:22px;font-weight:900;color:${g.color};">${g.grade}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:28px;">
    ${[['DNS',r.score_dns,25],['Email',r.score_email,30],['SSL',r.score_ssl,20],['Propagation',r.score_propagation,10],['Security',r.score_security,10],['Blacklists',r.score_blacklist,5]].map(([l,s,m])=>{
      const p=Math.round(((s||0)/m)*100);const c=p>=80?'#16a34a':p>=60?'#d97706':'#dc2626'
      return `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 10px;text-align:center;"><div style="font-size:18px;font-weight:900;color:${c};">${s||0}</div><div style="font-size:9px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;">/${m}</div><div style="font-size:11px;color:#6b7280;margin-top:3px;">${l}</div><div style="height:3px;background:#e5e7eb;border-radius:2px;margin-top:6px;"><div style="height:100%;width:${p}%;background:${c};border-radius:2px;"></div></div></div>`
    }).join('')}
  </div>
  <h2>Email Authentication</h2>
  <table><thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>
    ${row('SPF', r.email_auth?.spf_status||'Unknown', r.email_auth?.spf_raw)}
    ${row('DKIM', r.email_auth?.dkim_status||'Unknown', r.email_auth?.dkim_selector?`Selector: ${r.email_auth.dkim_selector}`:'')}
    ${row('DMARC', r.email_auth?.dmarc_status||'Unknown', r.email_auth?.dmarc_raw)}
    ${row('BIMI', r.email_auth?.bimi_status||'Not configured', '')}
    ${row('MTA-STS', r.email_auth?.mta_sts_status||'Not configured', '')}
  </tbody></table>
  <h2>SSL / TLS</h2>
  <table><thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>
    ${row('Certificate', r.ssl_info?.overall_status||'Unknown', r.ssl_info?.note||'')}
    ${r.ssl_info?.certs?.[0] ? row('Issuer', 'Info', r.ssl_info.certs[0].issuer_org||r.ssl_info.certs[0].issuer_cn||'') : ''}
    ${r.ssl_info?.certs?.[0]?.days_remaining!=null ? row('Expiry', r.ssl_info.certs[0].days_remaining>30?'Pass':r.ssl_info.certs[0].days_remaining>7?'Warn':'Fail', `${r.ssl_info.certs[0].days_remaining} days remaining`) : ''}
  </tbody></table>
  <h2>Security</h2>
  <table><thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>
    ${row('DNSSEC', r.security?.dnssec_status||'Unknown', '')}
    ${row('CAA Record', r.security?.caa_status||'Unknown', r.security?.caa_value||'')}
    ${row('Blacklists', (r.blacklists?.listed_count||0)===0?'Clean':'Listed', `${r.blacklists?.listed_count||0} of ${r.blacklists?.results?.length||0} lists`)}
  </tbody></table>
  ${issues.length > 0 ? `<h2>Issues (${issues.length})</h2>
  <table><thead><tr><th>Type</th><th>Severity</th><th>Description</th></tr></thead><tbody>
    ${issues.map(i=>{const c=i.severity==='critical'?'#dc2626':i.severity==='warn'?'#d97706':'#2563eb';const bg=i.severity==='critical'?'#fef2f2':i.severity==='warn'?'#fffbeb':'#eff6ff';return `<tr><td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;font-weight:600;font-size:13px;">${i.type}</td><td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;"><span style="background:${bg};color:${c};padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;">${i.severity}</span></td><td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${i.message}</td></tr>`}).join('')}
  </tbody></table>` : '<p style="color:#16a34a;font-weight:600;margin-top:20px;">✅ No issues detected</p>'}
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:11px;color:#9ca3af;">
    <span>DomainRadar · dns-radar.vercel.app</span><span>Score: ${score}/100 · Grade: ${g.grade} · ${dateStr}</span>
  </div>
  </body></html>`
  const blob = new Blob([html], { type:'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `DomainRadar-${domain}-${now.toISOString().slice(0,10)}.html`; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ── Main component ─────────────────────────────────────────────────────
export default function ScanResult({ domain, scanType, setPage, user }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => { if (domain) runScan() }, [domain])

  async function runScan() {
    setLoading(true); setError(''); setResult(null)
    try {
      const { data, error: err } = await supabase.functions.invoke('dns-scan', {
        body: { domain, scan_type: scanType || 'website', save_to_db: false }
      })
      if (err || data?.error) throw new Error(err?.message || data?.error || 'Scan failed')
      setResult(data)
    } catch (e) { setError(e.message || 'Scan failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'70vh', gap:20, fontFamily:F }}>
      <div style={{ width:52, height:52, border:'3px solid #e5e7eb', borderTopColor:'#16a34a', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <div>
        <div style={{ fontSize:15, fontWeight:600, color:'#111', marginBottom:4, textAlign:'center' }}>Scanning {domain}</div>
        <div style={{ fontSize:13, color:'#9ca3af', textAlign:'center' }}>Checking DNS, email auth, SSL, blacklists and propagation…</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ maxWidth:480, margin:'80px auto', padding:24, textAlign:'center', fontFamily:F }}>
      <XCircle size={36} color="#dc2626" style={{ marginBottom:12 }}/>
      <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Scan failed</div>
      <div style={{ fontSize:13, color:'#6b7280', marginBottom:24 }}>{error}</div>
      <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
        <button onClick={() => setPage('landing')} style={{ padding:'8px 18px', background:'transparent', color:'#555', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:F }}>← Back</button>
        <button onClick={runScan} style={{ padding:'8px 18px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Try again</button>
      </div>
    </div>
  )

  if (!result) return null
  const r = result
  const g = scoreGrade(r.health_score || 0)
  const critical = (r.issues || []).filter(i => i.severity === 'critical')
  const warns    = (r.issues || []).filter(i => i.severity === 'warn')
  const infos    = (r.issues || []).filter(i => i.severity === 'info')

  const CATS = [
    { id:'dns',         label:'DNS',         icon:Globe,   color:'#3730a3', score:r.score_dns,         max:25 },
    { id:'email',       label:'Email auth',  icon:Mail,    color:'#dc2626', score:r.score_email,       max:30 },
    { id:'ssl',         label:'SSL / TLS',   icon:Lock,    color:'#059669', score:r.score_ssl,         max:20 },
    { id:'propagation', label:'Propagation', icon:Network, color:'#d97706', score:r.score_propagation, max:10 },
    { id:'security',    label:'Security',    icon:Shield,  color:'#7c3aed', score:r.score_security,    max:10 },
    { id:'blacklist',   label:'Blacklists',  icon:Ban,     color:'#dc2626', score:r.score_blacklist,   max:5  },
  ]

  return (
    <div style={{ fontFamily:F, background:'#f7f8fa', minHeight:'100vh' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.fade{animation:fadeIn 0.3s ease both}`}</style>

      {/* ── TOP BAR ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 24px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setPage('landing')} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', background:'transparent', border:'none', cursor:'pointer', color:'#6b7280', fontSize:13, fontFamily:F }}
            onMouseEnter={e=>{e.currentTarget.style.color='#111'}} onMouseLeave={e=>{e.currentTarget.style.color='#6b7280'}}>
            <ArrowLeft size={14}/> Back
          </button>
          <div style={{ width:1, height:20, background:'#e5e7eb' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:20, padding:'4px 12px' }}>
            <Globe size={12} color="#16a34a"/>
            <span style={{ fontSize:13, fontWeight:600, fontFamily:MONO, color:'#111' }}>{domain}</span>
          </div>
          <span style={{ fontSize:12, color:'#9ca3af' }}>Scanned just now</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={runScan} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'transparent', border:'1px solid #e5e7eb', borderRadius:8, cursor:'pointer', fontSize:12, color:'#555', fontFamily:F }}>
            <RefreshCw size={12}/> Re-scan
          </button>
          <button onClick={() => exportPDF(domain, r)} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'transparent', border:'1px solid #e5e7eb', borderRadius:8, cursor:'pointer', fontSize:12, color:'#555', fontFamily:F }}>
            <FileDown size={12}/> Export PDF
          </button>
          <button onClick={() => setPage(user ? 'dashboard' : 'auth')} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:F }}>
            <Bell size={12}/> {user ? 'Monitor this domain' : 'Monitor — sign up free'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'24px 20px' }}>

        {/* ── SCORE HERO ── */}
        <div className="fade" style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:'28px 28px 24px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:24, flexWrap:'wrap' }}>

            {/* Score ring */}
            <div style={{ textAlign:'center', padding:'16px 22px', background:g.bg, border:`2px solid ${g.ring}`, borderRadius:14, flexShrink:0 }}>
              <div style={{ fontSize:52, fontWeight:900, color:g.color, lineHeight:1, letterSpacing:'-0.05em' }}>{r.health_score}</div>
              <div style={{ fontSize:11, color:g.color, fontWeight:700, marginTop:2 }}>/ 100</div>
              <div style={{ fontSize:28, fontWeight:900, color:g.color, marginTop:4, letterSpacing:'-0.02em' }}>{g.grade}</div>
              <div style={{ fontSize:10, color:g.color, opacity:0.7, marginTop:2, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {r.health_score >= 90 ? 'Excellent' : r.health_score >= 70 ? 'Good' : r.health_score >= 50 ? 'Fair' : 'Needs work'}
              </div>
            </div>

            {/* Category breakdown */}
            <div style={{ flex:1, minWidth:280 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:14 }}>Score breakdown</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {CATS.map(c => {
                  const pct = Math.round(((c.score||0)/c.max)*100)
                  const cc  = pct>=80?'#16a34a':pct>=60?'#d97706':'#dc2626'
                  const cbg = pct>=80?'#f0fdf4':pct>=60?'#fffbeb':'#fef2f2'
                  return (
                    <div key={c.id} style={{ background:'#fafafa', border:`1px solid #e5e7eb`, borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:6 }}>
                        <c.icon size={11} color={c.color}/>
                        <span style={{ fontSize:10, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>{c.label}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                        <span style={{ fontSize:22, fontWeight:900, color:cc, letterSpacing:'-0.04em', lineHeight:1 }}>{c.score ?? '–'}</span>
                        <span style={{ fontSize:11, color:'#9ca3af' }}>/{c.max}</span>
                      </div>
                      <div style={{ height:4, background:'#e5e7eb', borderRadius:2, marginTop:8 }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:cc, borderRadius:2, transition:'width 1s cubic-bezier(.4,0,.2,1)' }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── ISSUES PANEL ── */}
        {r.issues?.length > 0 && (
          <div className="fade" style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.05)', animationDelay:'0.05s' }}>
            <div style={{ padding:'13px 18px', background:'#fafafa', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:10 }}>
              <AlertTriangle size={14} color="#d97706"/>
              <span style={{ fontSize:13, fontWeight:700, color:'#111', flex:1 }}>Issues to fix</span>
              {critical.length > 0 && <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}>{critical.length} critical</span>}
              {warns.length    > 0 && <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20, background:'#fffbeb', color:'#d97706',  border:'1px solid #fde68a' }}>{warns.length} warnings</span>}
              {infos.length    > 0 && <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20, background:'#eff6ff', color:'#2563eb',  border:'1px solid #bfdbfe' }}>{infos.length} info</span>}
            </div>
            {r.issues.map((iss, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 18px', borderBottom: i < r.issues.length-1 ? '1px solid #f3f4f6' : 'none', background: iss.severity==='critical' ? '#fefafa' : '#fff' }}>
                <SevIcon sev={iss.severity}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#111' }}>{iss.type}</span>
                    <StatusChip status={iss.severity === 'critical' ? 'Critical' : iss.severity === 'warn' ? 'Warning' : 'Info'}/>
                  </div>
                  <div style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{iss.message}</div>
                  {iss.fix && <div style={{ fontSize:12, color:'#6b7280', marginTop:4, lineHeight:1.6 }}>💡 {iss.fix}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DNS RECORDS ── */}
        <div className="fade" style={{ animationDelay:'0.08s' }}>
          <Section icon={Globe} iconColor="#3730a3" title="DNS Records" badge={`${r.dns_records?.length || 0} records`}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                    {['Type','TTL','Value','Status'].map(h => (
                      <th key={h} style={{ padding:'8px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.dns_records?.map((rec, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f3f4f6' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'9px 16px' }}>
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:5, background:'#f0f2f5', color:'#374151', fontFamily:MONO }}>{rec.type}</span>
                      </td>
                      <td style={{ padding:'9px 16px', fontSize:12, color:'#9ca3af', fontFamily:MONO }}>{formatTTL(rec.ttl)}</td>
                      <td style={{ padding:'9px 16px', fontSize:12, color:'#374151', fontFamily:MONO, wordBreak:'break-all', maxWidth:400 }}>{rec.value}</td>
                      <td style={{ padding:'9px 16px' }}><StatusChip status="Pass"/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* ── EMAIL AUTH ── */}
        <div className="fade" style={{ animationDelay:'0.11s' }}>
          <Section icon={Mail} iconColor="#dc2626" title="Email Authentication"
            badge={r.email_auth?.spf_status === 'Pass' && r.email_auth?.dkim_status === 'Pass' && r.email_auth?.dmarc_status === 'Pass' ? 'All passing' : 'Issues found'}>
            {[
              { label:'SPF',     status:r.email_auth?.spf_status,              value:r.email_auth?.spf_raw,  note:r.email_auth?.spf_lookups!=null?`DNS lookup count: ${r.email_auth.spf_lookups}/10`:null, fix:r.email_auth?.spf_fix },
              { label:'DKIM',    status:r.email_auth?.dkim_status,             value:r.email_auth?.dkim_selector?`Selector: ${r.email_auth.dkim_selector} · ${r.email_auth.dkim_key_size||'?'}-bit`:null, note:r.email_auth?.dkim_note },
              { label:'DMARC',   status:r.email_auth?.dmarc_status||'Missing', value:r.email_auth?.dmarc_raw,  fix:r.email_auth?.dmarc_fix },
              { label:'BIMI',    status:r.email_auth?.bimi_status||'Not configured', note:r.email_auth?.bimi_note },
              { label:'MTA-STS', status:r.email_auth?.mta_sts_status||'Not configured', value:r.email_auth?.mta_sts_raw },
              { label:'TLS-RPT', status:r.email_auth?.tls_rpt_status||'Not configured', value:r.email_auth?.tls_rpt_raw },
            ].map(row => <Row key={row.label} {...row}/>)}
          </Section>
        </div>

        {/* ── SSL ── */}
        <div className="fade" style={{ animationDelay:'0.14s' }}>
          <Section icon={Lock} iconColor="#059669" title="SSL / TLS Certificate" badge={r.ssl_info?.overall_status}>
            {r.ssl_info?.certs?.length > 0 ? r.ssl_info.certs.map((cert, i) => {
              const days = cert.days_remaining
              const daysColor = days==null?'#6b7280':days<=7?'#dc2626':days<=30?'#d97706':days<=60?'#2563eb':'#16a34a'
              const issuer = cert.issuer_org || cert.issuer_cn || 'Unknown CA'
              return (
                <div key={i}>
                  {/* Expiry highlight */}
                  <div style={{ margin:'16px 18px', padding:'14px 18px', background: days==null?'#f9fafb':days<=30?'#fef2f2':'#f0fdf4', border:`1px solid ${days==null?'#e5e7eb':days<=30?'#fecaca':'#bbf7d0'}`, borderRadius:10, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                    <Lock size={24} color={daysColor}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:22, fontWeight:900, color:daysColor, letterSpacing:'-0.04em', lineHeight:1 }}>
                        {days==null ? 'Active' : days<=0 ? 'Expired' : `${days} days`}
                      </div>
                      <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>
                        {cert.expires_at ? `Expires ${new Date(cert.expires_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}` : 'Certificate valid'}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:11, color:'#9ca3af', marginBottom:2 }}>Issued by</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#111' }}>{issuer}</div>
                    </div>
                  </div>
                  {/* Details grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, padding:'0 18px 18px' }}>
                    {[
                      ['Subject',    cert.subject_cn || domain],
                      ['Protocol',   cert.protocol || 'TLS'],
                      ['Key size',   cert.key_size ? `${cert.key_size}-bit` : 'RSA'],
                      ['Chain',      cert.chain_valid !== false ? '✓ Valid' : '✗ Invalid'],
                      ['HSTS',       cert.hsts === 'HSTS enabled' ? '✓ Enabled' : 'Not set'],
                      ['CT logged',  cert.ct_logged ? '✓ Yes' : '—'],
                    ].map(([l,v]) => (
                      <div key={l} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                        <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{l}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Note */}
                  <div style={{ margin:'0 18px 18px', padding:'10px 14px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, fontSize:12, color:'#1d4ed8' }}>
                    ℹ {r.ssl_info.note || 'HTTPS active — certificate data from Certificate Transparency logs.'}
                  </div>
                </div>
              )
            }) : (
              <div style={{ padding:'28px', textAlign:'center', color:'#9ca3af' }}>
                <Lock size={28} style={{ marginBottom:8, opacity:0.3 }}/>
                <div style={{ fontSize:13, fontWeight:600 }}>No certificate data</div>
                <div style={{ fontSize:12, marginTop:4 }}>Run a scan to fetch SSL details</div>
              </div>
            )}
          </Section>
        </div>

        {/* ── PROPAGATION ── */}
        <div className="fade" style={{ animationDelay:'0.17s' }}>
          <Section icon={Network} iconColor="#d97706" title="DNS Propagation" badge={r.propagation?.consistent ? 'Consistent' : 'Inconsistent'}>
            <div style={{ padding:'16px 18px' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:400 }}>
                  <thead>
                    <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                      <th style={{ padding:'8px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em' }}>Record</th>
                      {['🇺🇸 Americas','🇪🇺 Europe','🌏 Asia-Pacific','🇦🇺 Oceania'].map(r => (
                        <th key={r} style={{ padding:'8px 14px', fontSize:10, fontWeight:700, color:'#6b7280', textAlign:'center', textTransform:'uppercase', letterSpacing:'0.06em' }}>{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.propagation?.records?.map((rec, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f3f4f6' }}>
                        <td style={{ padding:'9px 14px', fontFamily:MONO, fontSize:12, fontWeight:700, color:'#374151' }}>{rec.type}</td>
                        {['us','eu','apac','au'].map(region => (
                          <td key={region} style={{ padding:'9px 14px', textAlign:'center' }}>
                            <span style={{ fontSize:14 }}>{rec[region]==='pass' ? '✅' : rec[region]==='warn' ? '⚠️' : '–'}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        </div>

        {/* ── SECURITY ── */}
        <div className="fade" style={{ animationDelay:'0.2s' }}>
          <Section icon={Shield} iconColor="#7c3aed" title="Security Checks" badge={r.security?.overall || 'Warn'}>
            {[
              { label:'DNSSEC',      status:r.security?.dnssec_status||'Not signed',  note:'Cryptographic validation of DNS responses. Prevents DNS spoofing and cache poisoning attacks.' },
              { label:'CAA Record',  status:r.security?.caa_status||'Missing',        value:r.security?.caa_value, note:'Restricts which Certificate Authorities can issue SSL certificates for this domain.', fix: r.security?.caa_status==='Missing' ? `Recommended: ${r.security?.caa_suggestion || '0 issue "letsencrypt.org"'}` : null },
              { label:'Zone AXFR',   status:r.security?.axfr_status||'Blocked',       note:'Nameservers should reject unauthorised zone transfer requests.' },
              { label:'Open Resolver', status:r.security?.open_resolver_status||'Not open', note:'Nameserver should not act as a public open resolver.' },
            ].map(row => <Row key={row.label} {...row}/>)}
          </Section>
        </div>

        {/* ── BLACKLISTS ── */}
        <div className="fade" style={{ animationDelay:'0.23s' }}>
          <Section icon={Ban} iconColor="#dc2626" title="Blacklist Reputation"
            badge={(r.blacklists?.listed_count||0) > 0 ? `Listed on ${r.blacklists.listed_count}` : 'Clean'}>
            <div style={{ padding:'16px 18px' }}>
              {r.blacklists?.ip && (
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'8px 12px', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, fontSize:12 }}>
                  <Globe size={12} color="#6b7280"/>
                  <span style={{ color:'#6b7280' }}>IP address:</span>
                  <span style={{ fontFamily:MONO, fontWeight:600, color:'#111' }}>{r.blacklists.ip}</span>
                  <span style={{ marginLeft:'auto', fontSize:11, color:'#9ca3af' }}>Checked {r.blacklists?.results?.length || 0} lists</span>
                </div>
              )}
              {(r.blacklists?.listed_count||0) > 0 && (
                <div style={{ marginBottom:14, padding:'10px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:13, color:'#dc2626', fontWeight:600 }}>
                  ⚠ Listed on {r.blacklists.listed_count} blacklist{r.blacklists.listed_count > 1 ? 's' : ''} — email deliverability may be affected. Request delisting from each flagged list.
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:6 }}>
                {r.blacklists?.results?.map((bl, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 12px', background: bl.listed ? '#fef2f2' : '#f9fafb', borderRadius:8, border:`1px solid ${bl.listed ? '#fecaca' : '#e5e7eb'}` }}>
                    <span style={{ fontSize:11, fontFamily:MONO, color: bl.listed ? '#dc2626' : '#6b7280', fontWeight: bl.listed ? 700 : 400 }}>{bl.name}</span>
                    <span style={{ fontSize:11, fontWeight:700, color: bl.listed ? '#dc2626' : '#16a34a' }}>{bl.listed ? '✗ Listed' : '✓'}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* ── CTA ── */}
        {!user && (
          <div className="fade" style={{ background:'#111', borderRadius:16, padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16, animationDelay:'0.26s' }}>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:'#f9fafb', marginBottom:5 }}>Monitor {domain} continuously</div>
              <div style={{ fontSize:13, color:'#9ca3af', lineHeight:1.6 }}>Instant alerts when DNS changes, SSL nears expiry, or a blacklisting is detected. Free to start.</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => exportPDF(domain, r)} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', background:'rgba(255,255,255,0.08)', color:'#f9fafb', border:'1px solid #374151', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:F }}>
                <FileDown size={13}/> Export PDF
              </button>
              <button onClick={() => setPage('auth')} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#16a34a', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F }}>
                <Bell size={13}/> Start monitoring free →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
