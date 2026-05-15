import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, RefreshCw, Download, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Globe, Mail, Lock, Shield, Ban, Wifi } from 'lucide-react'

const F = "'Inter',system-ui,sans-serif"

// ── Helpers ─────────────────────────────────────────────────────────
function scoreGrade(s) {
  if (s >= 90) return { grade:'A+', color:'#16a34a', bg:'#f0fdf4', bd:'#86efac' }
  if (s >= 80) return { grade:'A',  color:'#16a34a', bg:'#f0fdf4', bd:'#86efac' }
  if (s >= 70) return { grade:'B',  color:'#65a30d', bg:'#f7fee7', bd:'#bef264' }
  if (s >= 60) return { grade:'C',  color:'#d97706', bg:'#fffbeb', bd:'#fde68a' }
  if (s >= 50) return { grade:'D',  color:'#ea580c', bg:'#fff7ed', bd:'#fed7aa' }
  return              { grade:'F',  color:'#dc2626', bg:'#fef2f2', bd:'#fecaca' }
}

function statusIcon(status) {
  if (['Pass','Valid','Consistent','Clean','Enforced'].includes(status))
    return <CheckCircle size={14} color="#16a34a"/>
  if (['Warn','Warning','Partial','Partial SPF','Partial DKIM'].includes(status))
    return <AlertTriangle size={14} color="#d97706"/>
  return <XCircle size={14} color="#dc2626"/>
}

function StatusBadge({ status }) {
  const ok  = ['Pass','Valid','Consistent','Clean','Enforced'].includes(status)
  const wn  = ['Warn','Warning','Partial','Partial SPF','Partial DKIM'].includes(status)
  const c   = ok ? '#16a34a' : wn ? '#d97706' : '#dc2626'
  const bg  = ok ? '#f0fdf4' : wn ? '#fffbeb' : '#fef2f2'
  const bd  = ok ? '#86efac' : wn ? '#fde68a' : '#fecaca'
  return (
    <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:8,background:bg,color:c,border:`1px solid ${bd}`,whiteSpace:'nowrap'}}>
      {status || 'Unknown'}
    </span>
  )
}

// ── PDF generator ────────────────────────────────────────────────────
function generatePDF(domain, data) {
  const score = data.health_score || 0
  const g = scoreGrade(score)
  const ea = data.email_auth || {}
  const ssl = data.ssl_info || {}
  const bl = data.blacklists || {}
  const sec = data.security || {}
  const prop = data.propagation || {}
  const issues = data.issues || []
  const critical = issues.filter(i => i.severity === 'critical')
  const warns = issues.filter(i => i.severity === 'warn')
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })

  const row = (label, status, detail = '', fix = '') => {
    const ok = ['Pass','Valid','Consistent','Clean','Enforced'].includes(status)
    const wn = ['Warn','Warning','Partial'].includes(status)
    const c  = ok ? '#16a34a' : wn ? '#d97706' : '#dc2626'
    const bg = ok ? '#f0fdf4' : wn ? '#fffbeb' : '#fef2f2'
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:500;color:#111827;">${label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;">
        <span style="background:${bg};color:${c};padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600;">${status||'Unknown'}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;font-family:monospace;word-break:break-all;max-width:260px;">${detail||'—'}</td>
    </tr>${fix ? `<tr><td colspan="3" style="padding:4px 14px 10px;border-bottom:1px solid #f3f4f6;font-size:11px;color:#d97706;background:#fffbeb;">💡 ${fix}</td></tr>` : ''}`
  }

  const section = (title, icon, rows) => `
    <div style="margin-bottom:28px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">
        <span style="font-size:20px;">${icon}</span>
        <h2 style="margin:0;font-size:15px;font-weight:700;color:#111827;letter-spacing:-0.02em;">${title}</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e5e7eb;">Check</th>
          <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e5e7eb;">Status</th>
          <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e5e7eb;">Detail</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`

  const complianceItem = (label, ok) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f3f4f6;">
      <span style="font-size:13px;color:#374151;">${label}</span>
      <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:6px;${ok?'background:#f0fdf4;color:#16a34a;':'background:#fef2f2;color:#dc2626;'}">${ok?'✓ Compliant':'✗ Non-compliant'}</span>
    </div>`

  const issueRow = (iss) => {
    const c = iss.severity==='critical'?'#dc2626':iss.severity==='warn'?'#d97706':'#2563eb'
    const bg = iss.severity==='critical'?'#fef2f2':iss.severity==='warn'?'#fffbeb':'#eff6ff'
    return `<tr>
      <td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;font-weight:600;font-size:12px;color:#111827;">${iss.type}</td>
      <td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;"><span style="background:${bg};color:${c};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${iss.severity}</span></td>
      <td style="padding:9px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${iss.message}</td>
    </tr>`
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>DNS Audit Report — ${domain}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Segoe UI', 'Inter', sans-serif; color: #111827; background: #fff; }
    .page { max-width: 860px; margin: 0 auto; padding: 40px 40px 60px; }
    @media print {
      .page { padding: 20px; max-width: 100%; }
      .no-print { display: none !important; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Cover header -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #16a34a;">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:36px;height:36px;background:#16a34a;border-radius:9px;display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6" opacity=".5"/><circle cx="12" cy="12" r="10" opacity=".25"/><line x1="12" y1="2" x2="19" y2="5"/></svg>
        </div>
        <div>
          <div style="font-size:16px;font-weight:800;color:#111827;letter-spacing:-0.03em;">DomainRadar</div>
          <div style="font-size:9px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">DNS Intelligence</div>
        </div>
      </div>
      <h1 style="font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.04em;margin-bottom:4px;">${domain}</h1>
      <div style="font-size:13px;color:#6b7280;">DNS Security Audit Report &nbsp;·&nbsp; ${dateStr}</div>
    </div>
    <!-- Score card -->
    <div style="text-align:center;padding:18px 24px;background:${g.bg};border:2px solid ${g.bd};border-radius:14px;min-width:120px;">
      <div style="font-size:46px;font-weight:900;color:${g.color};line-height:1;letter-spacing:-0.05em;">${score}</div>
      <div style="font-size:11px;color:${g.color};font-weight:700;margin-top:2px;">/ 100</div>
      <div style="font-size:22px;font-weight:900;color:${g.color};margin-top:4px;">${g.grade}</div>
      <div style="font-size:10px;color:${g.color};font-weight:600;opacity:0.8;">Health Score</div>
    </div>
  </div>

  <!-- Score breakdown cards -->
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:32px;">
    ${[
      {label:'DNS',         score:data.score_dns||0,        max:25, icon:'🌐'},
      {label:'Email Auth',  score:data.score_email||0,      max:30, icon:'✉️'},
      {label:'SSL/TLS',     score:data.score_ssl||0,        max:20, icon:'🔒'},
      {label:'Propagation', score:data.score_propagation||0,max:10, icon:'📡'},
      {label:'Security',    score:data.score_security||0,   max:10, icon:'🛡️'},
      {label:'Blacklists',  score:data.score_blacklist||0,  max:5,  icon:'🚫'},
    ].map(c => {
      const pct = Math.round((c.score/c.max)*100)
      const cc = pct>=80?'#16a34a':pct>=60?'#d97706':'#dc2626'
      return `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 10px;text-align:center;">
        <div style="font-size:18px;margin-bottom:4px;">${c.icon}</div>
        <div style="font-size:18px;font-weight:800;color:${cc};letter-spacing:-0.04em;">${c.score}</div>
        <div style="font-size:9px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">/${c.max}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:3px;font-weight:500;">${c.label}</div>
        <div style="height:3px;background:#e5e7eb;border-radius:2px;margin-top:6px;"><div style="height:100%;width:${pct}%;background:${cc};border-radius:2px;"></div></div>
      </div>`
    }).join('')}
  </div>

  <!-- Compliance summary -->
  <div style="margin-bottom:28px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">
      <span style="font-size:20px;">📋</span>
      <h2 style="margin:0;font-size:15px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Compliance Summary</h2>
    </div>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:4px 16px;">
      ${complianceItem('Google & Yahoo Bulk Sender Mandate (2024)', ea.spf_status==='Pass'&&ea.dkim_status==='Pass'&&ea.dmarc_status!=='Missing')}
      ${complianceItem('PCI DSS v4.0 — DMARC p=reject required', ea.dmarc_raw?.includes('p=reject'))}
      ${complianceItem('CISA BOD 18-01 — SPF + DMARC configured', ea.spf_status==='Pass'&&ea.dmarc_status!=='Missing')}
      ${complianceItem('DKIM email signing enabled', ea.dkim_status==='Pass')}
      ${complianceItem('SSL/TLS certificate valid', ssl.overall_status==='Pass')}
      ${complianceItem('Not listed on any email blacklist', (bl.listed_count||0)===0)}
    </div>
  </div>

  ${section('Email Authentication', '✉️',
    row('SPF Record',   ea.spf_status||'Missing',   ea.spf_raw?.slice(0,80),   ea.spf_fix) +
    row('DKIM Signing', ea.dkim_status||'Missing',  ea.dkim_selector?`Selector: ${ea.dkim_selector}`:'', ea.dkim_note) +
    row('DMARC Policy', ea.dmarc_status||'Missing', ea.dmarc_raw?.slice(0,80), ea.dmarc_fix) +
    row('BIMI Logo',    ea.bimi_status||'Not configured', ea.bimi_raw?.slice(0,60)||'', '') +
    row('MTA-STS',      ea.mta_sts_status||'Not configured', '', '') +
    row('TLS-RPT',      ea.tls_rpt_status||'Not configured', '', '')
  )}

  ${section('SSL / TLS Certificate', '🔒',
    row('Certificate', ssl.overall_status||'Unknown', ssl.note||'', '') +
    (ssl.certs?.[0] ? row('Issuer', 'Info', ssl.certs[0].issuer||ssl.certs[0].issuer_cn||'', '') : '') +
    (ssl.certs?.[0] ? row('Expiry', ssl.certs[0].days_remaining>30?'Pass':ssl.certs[0].days_remaining>7?'Warn':'Fail', ssl.certs[0].days_remaining!=null?`${ssl.certs[0].days_remaining} days remaining`:'', '') : '')
  )}

  ${section('Security', '🛡️',
    row('DNSSEC', sec.dnssec_status||'Not configured', sec.dnssec_algorithm||'', '') +
    row('CAA Record', sec.caa_status||'Missing', sec.caa_records?.join(', ')?.slice(0,60)||'', sec.caa_status==='Missing'?'Add CAA record to restrict which CAs can issue certificates':'') +
    row('HTTPS Redirect', sec.https_redirect?'Pass':'Warn', sec.https_redirect?'HTTP redirects to HTTPS':'No redirect detected', '')
  )}

  ${section('Blacklists', '🚫',
    row('IP Address', bl.ip?'Info':'-', bl.ip||'Not detected', '') +
    row('Blacklist Status', (bl.listed_count||0)===0?'Clean':'Listed', `Checked ${bl.results?.length||0} lists — ${bl.listed_count||0} listings`, '') +
    (bl.results?.filter(r=>r.listed).map(r => row(r.name,'Listed','','Request removal at the DNSBL website')).join('')||'')
  )}

  ${section('DNS Propagation', '📡',
    row('Overall', prop.consistent?'Consistent':'Inconsistent', `${prop.records?.length||0} record types checked`, '') +
    ['us','eu','apac','au'].map(region => {
      const labels = { us:'North America', eu:'Europe', apac:'Asia Pacific', au:'Australia' }
      const allPass = prop.records?.every(r=>r[region]==='pass')
      return row(labels[region]||region, allPass?'Pass':'Inconsistent', '', '')
    }).join('')
  )}

  ${issues.length > 0 ? `
  <div style="margin-bottom:28px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6;">
      <span style="font-size:20px;">⚠️</span>
      <h2 style="margin:0;font-size:15px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Issues to Fix (${issues.length})</h2>
      <span style="font-size:11px;padding:3px 9px;border-radius:6px;background:#fef2f2;color:#dc2626;font-weight:600;">${critical.length} critical</span>
      <span style="font-size:11px;padding:3px 9px;border-radius:6px;background:#fffbeb;color:#d97706;font-weight:600;">${warns.length} warnings</span>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <thead><tr style="background:#f9fafb;">
        <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e5e7eb;width:80px;">Type</th>
        <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e5e7eb;width:90px;">Severity</th>
        <th style="padding:8px 14px;text-align:left;font-size:10px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e5e7eb;">Description</th>
      </tr></thead>
      <tbody>${issues.map(issueRow).join('')}</tbody>
    </table>
  </div>` : `<div style="padding:20px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;margin-bottom:28px;text-align:center;font-weight:600;color:#16a34a;">✅ No issues detected — excellent configuration!</div>`}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:12px;font-weight:600;color:#111827;">DomainRadar DNS Intelligence</div>
      <div style="font-size:11px;color:#9ca3af;">dns-radar.vercel.app · dnsradar.easysecurity.in</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#9ca3af;">
      <div>Generated ${dateStr}</div>
      <div>Score: ${score}/100 · Grade: ${g.grade}</div>
    </div>
  </div>

</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `DomainRadar-Audit-${domain}-${now.toISOString().slice(0,10)}.html`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ── Main component ───────────────────────────────────────────────────
export default function AuditReport({ setPage }) {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  async function runAudit(d) {
    const clean = (d || domain).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase().trim()
    if (!clean) return
    setLoading(true); setResult(null); setError('')
    try {
      const { data, error: err } = await supabase.functions.invoke('dns-scan', {
        body: { domain: clean, scan_type: 'website', save_to_db: false }
      })
      if (err || data?.error) throw new Error(err?.message || data?.error || 'Scan failed')
      setResult({ ...data, _domain: clean })
    } catch(e) { setError(e.message || 'Scan failed. Please try again.') }
    finally { setLoading(false) }
  }

  function handleExport() {
    setExporting(true)
    generatePDF(result._domain, result)
    setTimeout(() => setExporting(false), 1500)
  }

  const card = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', marginBottom:12 }
  const cardHd = { padding:'11px 16px', borderBottom:'1px solid #f0f2f5', background:'#fafafa', display:'flex', alignItems:'center', gap:8 }

  return (
    <div style={{ background:'#f7f8fa', minHeight:'100vh', fontFamily:F }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .scan-row:hover { background:#f9fafb !important; }
      `}</style>

      {/* Page header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setPage('dashboard')} style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280', display:'flex', alignItems:'center', gap:5, fontSize:13, padding:'5px 8px', borderRadius:7, fontFamily:F }}
            onMouseEnter={e => { e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.color='#111827' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#6b7280' }}>
            <ArrowLeft size={14}/> Back
          </button>
          <div style={{ width:1, height:20, background:'#e5e7eb' }}/>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#111827', letterSpacing:'-0.02em' }}>Instant DNS Audit</div>
            <div style={{ fontSize:11, color:'#9ca3af', marginTop:1 }}>Full security scan + PDF export — no account needed</div>
          </div>
        </div>
        {result && (
          <button onClick={handleExport} disabled={exporting}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', background:'#111827', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#1f2937'}
            onMouseLeave={e => e.currentTarget.style.background='#111827'}>
            {exporting ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Generating…</> : <><Download size={14}/> Export PDF report</>}
          </button>
        )}
      </div>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'24px 20px' }}>

        {/* Search box */}
        <div style={{ ...card, padding:'20px 22px', marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 }}>Enter any domain to audit</div>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>We'll check DNS records, SPF, DKIM, DMARC, SSL, blacklists, propagation and generate a full PDF report.</div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, position:'relative' }}>
              <Search size={14} color="#9ca3af" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input value={domain} onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runAudit()}
                placeholder="example.com"
                style={{ width:'100%', padding:'10px 12px 10px 34px', background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:9, fontSize:14, color:'#111827', outline:'none', fontFamily:F, transition:'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor='#16a34a'}
                onBlur={e => e.target.style.borderColor='#e5e7eb'}
              />
            </div>
            <button onClick={() => runAudit()} disabled={loading || !domain.trim()}
              style={{ padding:'10px 24px', background: loading || !domain.trim() ? '#9ca3af' : '#16a34a', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor: loading || !domain.trim() ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:F, transition:'background 0.15s', flexShrink:0 }}
              onMouseEnter={e => { if(!loading && domain.trim()) e.currentTarget.style.background='#15803d' }}
              onMouseLeave={e => { if(!loading && domain.trim()) e.currentTarget.style.background='#16a34a' }}>
              {loading ? <><div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> Scanning…</> : <><Search size={14}/> Run Audit</>}
            </button>
          </div>
          {/* Example domains */}
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:11, color:'#9ca3af' }}>Try:</span>
            {['google.com','github.com','cloudflare.com'].map(d => (
              <button key={d} onClick={() => { setDomain(d); runAudit(d) }}
                style={{ fontSize:11, color:'#6b7280', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:6, padding:'3px 9px', cursor:'pointer', fontFamily:'monospace', transition:'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#e5e7eb'; e.currentTarget.style.color='#111827' }}
                onMouseLeave={e => { e.currentTarget.style.background='#f3f4f6'; e.currentTarget.style.color='#6b7280' }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ ...card, padding:'40px 24px', textAlign:'center', animation:'fadeIn 0.2s ease both' }}>
            <div style={{ width:48, height:48, border:'3px solid #e5e7eb', borderTopColor:'#16a34a', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
            <div style={{ fontSize:15, fontWeight:600, color:'#111827', marginBottom:6 }}>Scanning {domain}…</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6, maxWidth:280, margin:'16px auto 0' }}>
              {[
                'Checking DNS records…',
                'Validating SPF, DKIM, DMARC…',
                'Testing SSL certificate…',
                'Checking 52 blacklists…',
                'Testing global propagation…',
              ].map((t, i) => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#9ca3af', animation:`pulse 1.5s ${i*0.3}s ease-in-out infinite` }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', flexShrink:0 }}/>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ ...card, padding:'24px', textAlign:'center', animation:'fadeIn 0.2s ease both' }}>
            <XCircle size={32} color="#dc2626" style={{ marginBottom:10 }}/>
            <div style={{ fontSize:14, fontWeight:600, color:'#111827', marginBottom:6 }}>Scan failed</div>
            <div style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>{error}</div>
            <button onClick={() => runAudit()} style={{ padding:'8px 20px', background:'#111827', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{ animation:'fadeIn 0.25s ease both' }}>

            {/* Score hero */}
            <div style={{ ...card, padding:'20px 24px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  {(()=>{
                    const g = scoreGrade(result.health_score||0)
                    return (
                      <>
                        <div style={{ textAlign:'center', padding:'12px 16px', background:g.bg, border:`2px solid ${g.bd}`, borderRadius:12, minWidth:80 }}>
                          <div style={{ fontSize:36, fontWeight:900, color:g.color, lineHeight:1, letterSpacing:'-0.05em' }}>{result.health_score||0}</div>
                          <div style={{ fontSize:10, color:g.color, fontWeight:700 }}>/ 100</div>
                          <div style={{ fontSize:20, fontWeight:900, color:g.color }}>{g.grade}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:17, fontWeight:800, color:'#111827', letterSpacing:'-0.03em', marginBottom:4 }}>{result._domain}</div>
                          <div style={{ fontSize:12, color:'#6b7280', marginBottom:8 }}>
                            {result.issues?.filter(i=>i.severity==='critical').length||0} critical &nbsp;·&nbsp;
                            {result.issues?.filter(i=>i.severity==='warn').length||0} warnings &nbsp;·&nbsp;
                            {result.dns_records?.length||0} DNS records
                          </div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {[
                              { label:'Email auth', score:result.score_email, max:30, icon:<Mail size={11}/> },
                              { label:'SSL/TLS', score:result.score_ssl, max:20, icon:<Lock size={11}/> },
                              { label:'Security', score:result.score_security, max:10, icon:<Shield size={11}/> },
                              { label:'Blacklists', score:result.score_blacklist, max:5, icon:<Ban size={11}/> },
                            ].map(c => {
                              const pct = Math.round(((c.score||0)/c.max)*100)
                              const cc = pct>=80?'#16a34a':pct>=60?'#d97706':'#dc2626'
                              const bg = pct>=80?'#f0fdf4':pct>=60?'#fffbeb':'#fef2f2'
                              const bd = pct>=80?'#bbf7d0':pct>=60?'#fde68a':'#fecaca'
                              return (
                                <span key={c.label} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, padding:'3px 9px', borderRadius:8, background:bg, color:cc, border:`1px solid ${bd}`, fontWeight:600 }}>
                                  {c.icon} {c.label} {c.score||0}/{c.max}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <button onClick={handleExport} disabled={exporting}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', background:'#111827', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F }}>
                  {exporting ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Generating…</> : <><Download size={14}/> Download PDF</>}
                </button>
              </div>
            </div>

            {/* Email auth */}
            <div style={card}>
              <div style={cardHd}>
                <Mail size={14} color="#a78bfa"/>
                <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>Email Authentication</span>
              </div>
              {[
                { label:'SPF',     status:result.email_auth?.spf_status,   val:result.email_auth?.spf_raw,     fix:result.email_auth?.spf_fix },
                { label:'DKIM',    status:result.email_auth?.dkim_status,  val:result.email_auth?.dkim_selector?`Selector: ${result.email_auth.dkim_selector}`:null, fix:result.email_auth?.dkim_note },
                { label:'DMARC',   status:result.email_auth?.dmarc_status, val:result.email_auth?.dmarc_raw,   fix:result.email_auth?.dmarc_fix },
                { label:'BIMI',    status:result.email_auth?.bimi_status||'Not configured', val:null },
                { label:'MTA-STS', status:result.email_auth?.mta_sts_status||'Not configured', val:null },
              ].map((r,i) => (
                <div key={r.label} className="scan-row" style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 16px', borderBottom:'1px solid #f3f4f6' }}>
                  <div style={{ width:60, flexShrink:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#111827', fontFamily:'monospace' }}>{r.label}</div>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    {r.val && <div style={{ fontSize:11, fontFamily:'monospace', color:'#374151', marginBottom:r.fix?4:0, wordBreak:'break-all', background:'#f8fafc', padding:'4px 8px', borderRadius:5, border:'1px solid #e2e8f0' }}>{r.val.slice(0,120)}{r.val.length>120?'…':''}</div>}
                    {r.fix && <div style={{ fontSize:11, color:'#d97706', marginTop:3 }}>💡 {r.fix}</div>}
                  </div>
                  <StatusBadge status={r.status}/>
                </div>
              ))}
            </div>

            {/* SSL + Security */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div style={card}>
                <div style={cardHd}><Lock size={14} color="#10b981"/><span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>SSL Certificate</span></div>
                {[
                  { label:'Status',  val:result.ssl_info?.overall_status||'Unknown' },
                  { label:'Expiry',  val:result.ssl_info?.certs?.[0]?.days_remaining!=null?`${result.ssl_info.certs[0].days_remaining}d remaining`:'—' },
                  { label:'Protocol',val:result.ssl_info?.certs?.[0]?.protocol||'TLS' },
                  { label:'HSTS',    val:result.ssl_info?.certs?.[0]?.hsts||'Not configured' },
                ].map(r => (
                  <div key={r.label} className="scan-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 16px', borderBottom:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>{r.label}</span>
                    <span style={{ fontSize:12, color:'#111827', fontFamily:'monospace', fontWeight:500 }}>{r.val}</span>
                  </div>
                ))}
              </div>
              <div style={card}>
                <div style={cardHd}><Shield size={14} color="#6366f1"/><span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>Security</span></div>
                {[
                  { label:'DNSSEC',   val:result.security?.dnssec_status||'Not configured' },
                  { label:'CAA',      val:result.security?.caa_status||'Missing' },
                  { label:'Blacklist',val:(result.blacklists?.listed_count||0)===0?`Clean (${result.blacklists?.results?.length||0} checked)`:`Listed on ${result.blacklists?.listed_count}` },
                  { label:'IP',       val:result.blacklists?.ip||'—' },
                ].map(r => (
                  <div key={r.label} className="scan-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 16px', borderBottom:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>{r.label}</span>
                    <span style={{ fontSize:12, color:'#111827', fontFamily:'monospace', fontWeight:500 }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues */}
            {result.issues?.length > 0 && (
              <div style={card}>
                <div style={{ ...cardHd, justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <AlertTriangle size={14} color="#d97706"/>
                    <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>Issues to Fix</span>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {result.issues.filter(i=>i.severity==='critical').length>0 && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:8, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}>{result.issues.filter(i=>i.severity==='critical').length} critical</span>}
                    {result.issues.filter(i=>i.severity==='warn').length>0 && <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:8, background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a' }}>{result.issues.filter(i=>i.severity==='warn').length} warnings</span>}
                  </div>
                </div>
                {result.issues.map((iss, i) => {
                  const c = iss.severity==='critical'?'#dc2626':iss.severity==='warn'?'#d97706':'#2563eb'
                  const bg = iss.severity==='critical'?'#fef2f2':iss.severity==='warn'?'#fffbeb':'#eff6ff'
                  const bd = iss.severity==='critical'?'#fecaca':iss.severity==='warn'?'#fde68a':'#bfdbfe'
                  return (
                    <div key={i} className="scan-row" style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 16px', borderBottom:'1px solid #f3f4f6', background: iss.severity==='critical'?'#fefafa':'transparent' }}>
                      <div style={{ width:28, height:28, borderRadius:8, background:bg, border:`1px solid ${bd}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                        <AlertTriangle size={13} color={c}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:'#111827' }}>{iss.type}</span>
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:8, background:bg, color:c, border:`1px solid ${bd}` }}>{iss.severity}</span>
                        </div>
                        <div style={{ fontSize:12, color:'#374151', lineHeight:1.6 }}>{iss.message}</div>
                        {iss.fix && <div style={{ fontSize:11, color:'#6b7280', marginTop:3, lineHeight:1.5 }}>💡 {iss.fix}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* CTA */}
            <div style={{ background:'#111827', borderRadius:12, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginTop:4 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#f9fafb', marginBottom:3 }}>Monitor {result._domain} continuously</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>Get alerts when DNS, SSL or email auth changes. Auto-fix issues with one click.</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleExport} style={{ padding:'8px 16px', background:'rgba(255,255,255,0.08)', color:'#f9fafb', border:'1px solid #374151', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:F }}>
                  <Download size={13}/> Download PDF
                </button>
                <button onClick={() => setPage('auth')} style={{ padding:'8px 16px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:F }}>
                  Start monitoring free →
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div style={{ ...card, padding:'48px 24px', textAlign:'center', color:'#9ca3af' }}>
            <div style={{ width:56, height:56, borderRadius:14, background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Search size={24} color="#16a34a"/>
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:'#374151', marginBottom:6 }}>Instant DNS Audit</div>
            <div style={{ fontSize:13, color:'#9ca3af', maxWidth:360, margin:'0 auto', lineHeight:1.7 }}>
              Enter any domain above. We'll scan DNS records, email authentication, SSL certificates, blacklists and propagation — then generate a professional PDF report.
            </div>
            <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:24, flexWrap:'wrap' }}>
              {[['✉️','Email auth','SPF, DKIM, DMARC'],['🔒','SSL/TLS','Certificate health'],['🚫','Blacklists','52 DNSBL checks'],['📡','Propagation','4 global resolvers']].map(([icon,title,sub])=>(
                <div key={title} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{title}</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
