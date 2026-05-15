import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Radar, ArrowLeft, Shield, Globe, Lock, Mail, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const F = "'Inter',system-ui,sans-serif"

function Score({ value }) {
  const color = value >= 70 ? '#16a34a' : value >= 50 ? '#d97706' : '#dc2626'
  const pct = value || 0
  const r = 36, c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
      <svg width="100" height="100" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:24, fontWeight:800, color, letterSpacing:'-0.03em', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:10, color:'#9ca3af', fontWeight:500 }}>/ 100</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const pass = ['pass','active','configured','enforced','consistent','present','signed','blocked'].some(p => s.includes(p))
  const fail = ['fail','missing','critical','listed','expired'].some(p => s.includes(p))
  const warn = ['warn','none','not configured','not signed','quarantine','near'].some(p => s.includes(p))
  const bg = pass ? '#f0fdf4' : fail ? '#fef2f2' : warn ? '#fffbeb' : '#f9fafb'
  const color = pass ? '#16a34a' : fail ? '#dc2626' : warn ? '#d97706' : '#6b7280'
  const border = pass ? '#bbf7d0' : fail ? '#fecaca' : warn ? '#fde68a' : '#e5e7eb'
  return <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10, background:bg, color, border:`1px solid ${border}` }}>{status || '—'}</span>
}

function Section({ title, icon: Icon, color, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', marginBottom:14, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #f0f2f5', background:'#fafafa', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={14} color={color}/>
        </div>
        <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{title}</span>
      </div>
      <div style={{ padding:'14px 16px' }}>{children}</div>
    </div>
  )
}

function Row({ label, value, status }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f9fafb' }}>
      <span style={{ fontSize:12, color:'#6b7280', fontWeight:500 }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {value && <span style={{ fontSize:12, color:'#374151', fontFamily:'monospace', maxWidth:300, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</span>}
        {status && <StatusBadge status={status}/>}
      </div>
    </div>
  )
}

export default function SharedScan({ shareId, setPage }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Step 1: get the share record
        const { data: share, error: err } = await supabase
          .from('public_scan_shares')
          .select('id, domain_name, scan_result_id, created_at')
          .eq('id', shareId)
          .single()
        if (err || !share) { setError('Share link not found or has expired.'); return }

        // Step 2: get the scan result separately (avoids FK join issues)
        let scanResult = null
        if (share.scan_result_id) {
          const { data: sr } = await supabase
            .from('scan_results')
            .select('*')
            .eq('id', share.scan_result_id)
            .single()
          scanResult = sr
        }

        setData({ ...share, scan_results: scanResult })
      } catch (e) { setError('Failed to load shared scan.') }
      finally { setLoading(false) }
    }
    load()
  }, [shareId])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f7f8fa', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#16a34a', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }}/>
        <div style={{ fontSize:13, color:'#6b7280' }}>Loading shared scan…</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#f7f8fa', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F }}>
      <div style={{ textAlign:'center', padding:24 }}>
        <AlertTriangle size={32} color="#d97706" style={{ margin:'0 auto 12px' }}/>
        <div style={{ fontSize:16, fontWeight:600, color:'#111827', marginBottom:6 }}>Link not found</div>
        <div style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>{error}</div>
        <button onClick={() => setPage('landing')} style={{ padding:'9px 20px', background:'#111827', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:F }}>
          Go to DomainRadar
        </button>
      </div>
    </div>
  )

  const scan = data.scan_results
  const ea = scan?.email_auth || {}
  const ssl = scan?.ssl_info || {}
  const sec = scan?.security || {}
  const bl = scan?.blacklists || {}
  const issues = scan?.issues || []

  return (
    <div style={{ minHeight:'100vh', background:'#f7f8fa', fontFamily:F }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Navbar */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 24px', height:54, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:28, height:28, background:'#16a34a', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radar size={14} color="#fff"/>
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:'#111827', letterSpacing:'-0.02em' }}>DomainRadar</span>
          <span style={{ fontSize:11, color:'#9ca3af' }}>· Shared scan</span>
        </div>
        <button onClick={() => setPage('landing')} style={{ display:'flex', alignItems:'center', gap:6, background:'#111827', color:'#fff', border:'none', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F }}>
          Try DomainRadar free →
        </button>
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'24px 20px' }}>

        {/* Header */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'20px 24px', marginBottom:16, display:'flex', alignItems:'center', gap:20, boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          {scan?.health_score != null && <Score value={scan.health_score}/>}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#111827', letterSpacing:'-0.03em', marginBottom:4 }}>{data.domain_name}</div>
            <div style={{ fontSize:12, color:'#6b7280', marginBottom:10 }}>
              Scanned {scan?.scanned_at ? new Date(scan.scanned_at).toLocaleString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {issues.filter(i => i.severity === 'critical').length > 0 && (
                <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:10, background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }}>
                  {issues.filter(i => i.severity === 'critical').length} critical
                </span>
              )}
              {issues.filter(i => i.severity === 'warn').length > 0 && (
                <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:10, background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a' }}>
                  {issues.filter(i => i.severity === 'warn').length} warnings
                </span>
              )}
              {issues.length === 0 && (
                <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:10, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>All clear</span>
              )}
            </div>
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <Section title="Issues found" icon={AlertTriangle} color="#dc2626">
            {issues.map((issue, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'9px 0', borderBottom: i < issues.length-1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: issue.severity === 'critical' ? '#dc2626' : issue.severity === 'warn' ? '#d97706' : '#3b82f6', flexShrink:0, marginTop:4 }}/>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:2 }}>{issue.type} — {issue.message}</div>
                  {issue.fix && <div style={{ fontSize:12, color:'#6b7280' }}>{issue.fix}</div>}
                </div>
              </div>
            ))}
          </Section>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Email auth */}
          <Section title="Email authentication" icon={Mail} color="#6366f1">
            <Row label="SPF" status={ea.spf_status}/>
            <Row label="DKIM" status={ea.dkim_status}/>
            <Row label="DMARC" status={ea.dmarc_status}/>
            <Row label="BIMI" status={ea.bimi_status}/>
            <Row label="MTA-STS" status={ea.mta_sts_status}/>
          </Section>

          {/* SSL */}
          <Section title="SSL / TLS" icon={Lock} color="#16a34a">
            <Row label="Status" status={ssl.overall_status}/>
            {ssl.certs?.[0] && <>
              <Row label="Issuer" value={ssl.certs[0].issuer_org || ssl.certs[0].issuer_cn || '—'}/>
              <Row label="Expires" value={ssl.certs[0].expires_at ? new Date(ssl.certs[0].expires_at).toLocaleDateString('en-GB') : '—'}/>
              <Row label="Days remaining" value={ssl.certs[0].days_remaining != null ? `${ssl.certs[0].days_remaining} days` : '—'}/>
              <Row label="HSTS" status={ssl.certs[0].hsts === 'HSTS enabled' ? 'Enabled' : 'Not set'}/>
            </>}
            <Row label="Note" value={ssl.note}/>
          </Section>

          {/* Security */}
          <Section title="Security" icon={Shield} color="#7c3aed">
            <Row label="DNSSEC" status={sec.dnssec_status}/>
            <Row label="CAA record" status={sec.caa_status}/>
            <Row label="Zone transfer" status={sec.axfr_status}/>
          </Section>

          {/* Blacklists */}
          <Section title="Blacklists" icon={Globe} color="#dc2626">
            <Row label="IP address" value={bl.ip || '—'}/>
            <Row label="Listed on" value={bl.listed_count != null ? `${bl.listed_count} / ${bl.results?.length || 10} lists` : '—'} status={bl.listed_count > 0 ? 'Listed' : 'Clean'}/>
          </Section>
        </div>

        {/* CTA */}
        <div style={{ background:'#111827', borderRadius:14, padding:'24px', textAlign:'center', marginTop:8 }}>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:6, letterSpacing:'-0.02em' }}>Monitor your own domain for free</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:16 }}>Get alerts when anything changes. Auto-fix DNS issues with one click.</div>
          <button onClick={() => setPage('auth')} style={{ padding:'10px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:F }}>
            Start free →
          </button>
        </div>
      </div>
    </div>
  )
}
