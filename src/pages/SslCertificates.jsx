import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Lock, RefreshCw, AlertTriangle, CheckCircle, Clock, Shield, ChevronDown, ChevronUp, ExternalLink, Info } from 'lucide-react'

const D = { bg:'#0d1117', surface:'#161b22', surface2:'#1c2333', border:'rgba(255,255,255,0.08)', text:'#e6edf3', muted:'rgba(255,255,255,0.5)', dim:'rgba(255,255,255,0.25)' }
const card = { background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, overflow:'hidden' }
const cardHd = { padding:'11px 16px', borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:D.surface2 }

function daysColor(days) {
  if (days == null) return '#6b7280'
  if (days <= 7)  return '#ef4444'
  if (days <= 30) return '#f59e0b'
  if (days <= 60) return '#3b82f6'
  return '#10b981'
}

function DaysBadge({ days }) {
  const color = daysColor(days)
  const bg = color + '18'
  const label = days == null ? '–' : days <= 0 ? 'Expired' : `${days}d`
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:8, background:bg, color, border:`1px solid ${color}28`, whiteSpace:'nowrap' }}>
      {label}
    </span>
  )
}

function CertDetail({ cert, open, onToggle }) {
  const sans = cert.subject_alt_names || []
  const tlsVersions = cert.tls_versions_supported || []
  return (
    <div style={{ ...card, marginBottom:10 }}>
      {/* Header row */}
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', flexWrap:'wrap' }} onClick={onToggle}>
        <div style={{ width:32, height:32, borderRadius:8, background: cert.days_remaining <= 7 ? 'rgba(239,68,68,0.12)' : cert.days_remaining <= 30 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Lock size={14} color={daysColor(cert.days_remaining)}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:D.text, marginBottom:2 }}>{cert.domain_name}</div>
          <div style={{ fontSize:11, color:D.muted }}>{cert.issuer_cn || cert.issuer_org || 'Unknown issuer'}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <DaysBadge days={cert.days_remaining}/>
          {cert.chain_valid === false && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:6, background:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', fontWeight:500 }}>Chain error</span>}
          {cert.weak_cipher_detected && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:6, background:'rgba(245,158,11,0.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.2)', fontWeight:500 }}>Weak cipher</span>}
          {open ? <ChevronUp size={14} color={D.dim}/> : <ChevronDown size={14} color={D.dim}/>}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop:`1px solid ${D.border}`, padding:'14px 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:14 }}>
            <Field label="Subject CN" value={cert.subject_cn || '–'}/>
            <Field label="Valid from" value={cert.valid_from ? new Date(cert.valid_from).toLocaleDateString() : '–'}/>
            <Field label="Expires" value={cert.valid_to ? new Date(cert.valid_to).toLocaleDateString() : '–'}/>
            <Field label="Key" value={cert.key_algorithm ? `${cert.key_size || '?'}-bit ${cert.key_algorithm}` : '–'}/>
            <Field label="Signature" value={cert.signature_algorithm || '–'}/>
            <Field label="Chain length" value={cert.chain_length != null ? `${cert.chain_length} cert${cert.chain_length !== 1 ? 's':''}` : '–'}/>
            <Field label="HSTS" value={cert.hsts_enabled ? (cert.hsts_max_age ? `${Math.round(cert.hsts_max_age/86400)}d max-age` : 'Enabled') : 'Not set'} good={cert.hsts_enabled}/>
            <Field label="OCSP stapling" value={cert.ocsp_stapling ? 'Enabled' : 'Not enabled'} good={cert.ocsp_stapling}/>
            <Field label="CT logged" value={cert.ct_logged ? 'Yes' : 'No'} good={cert.ct_logged}/>
          </div>

          {tlsVersions.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:D.muted, marginBottom:6, fontWeight:500 }}>TLS versions supported</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {tlsVersions.map(v => (
                  <span key={v} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background: v === 'TLSv1.0' || v === 'TLSv1.1' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: v === 'TLSv1.0' || v === 'TLSv1.1' ? '#ef4444' : '#10b981', border:`1px solid ${ v === 'TLSv1.0' || v === 'TLSv1.1' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, fontWeight:500 }}>{v}</span>
                ))}
              </div>
            </div>
          )}

          {sans.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:D.muted, marginBottom:6, fontWeight:500 }}>Subject alt names ({sans.length})</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {sans.slice(0,12).map(s => (
                  <span key={s} style={{ fontSize:10, fontFamily:'monospace', padding:'2px 7px', borderRadius:5, background:'rgba(255,255,255,0.05)', color:D.muted, border:`1px solid ${D.border}` }}>{s}</span>
                ))}
                {sans.length > 12 && <span style={{ fontSize:10, color:D.dim }}>+{sans.length-12} more</span>}
              </div>
            </div>
          )}

          {cert.serial_number && (
            <div style={{ fontSize:10, fontFamily:'monospace', color:D.dim, marginTop:4 }}>
              Serial: {cert.serial_number}
            </div>
          )}

          <div style={{ fontSize:10, color:D.dim, marginTop:6 }}>
            Last scanned {cert.scanned_at ? new Date(cert.scanned_at).toLocaleString() : '–'}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, good }) {
  const color = good === true ? '#10b981' : good === false ? '#ef4444' : D.muted
  return (
    <div>
      <div style={{ fontSize:10, color:D.dim, marginBottom:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
      <div style={{ fontSize:12, color, fontWeight:500 }}>{value}</div>
    </div>
  )
}

export default function SslCertificates({ user }) {
  const [certs, setCerts] = useState([])
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadData() }, [user.id])

  async function loadData() {
    setLoading(true)
    const [dRes, cRes] = await Promise.all([
      supabase.from('domains').select('id,domain_name,verified').eq('user_id', user.id).order('domain_name'),
      supabase.from('ssl_certificates').select('*').in(
        'domain_id',
        (await supabase.from('domains').select('id').eq('user_id', user.id)).data?.map(d=>d.id) || []
      ).order('days_remaining', { ascending:true })
    ])
    setDomains(dRes.data || [])
    setCerts(cRes.data || [])
    setLoading(false)
  }

  async function scanDomain(domain) {
    setScanning(true)
    setScanMsg(`Scanning ${domain.domain_name}…`)
    try {
      const res = await supabase.functions.invoke('dns-scan', {
        body: { domain: domain.domain_name, scan_type:'website', save_to_db:true, domain_id:domain.id }
      })
      setScanMsg(res.error ? 'Scan failed' : 'Scan complete — refreshing…')
      await loadData()
      setTimeout(() => setScanMsg(''), 3000)
    } catch {
      setScanMsg('Scan failed')
    } finally {
      setScanning(false)
    }
  }

  async function scanAll() {
    const verified = domains.filter(d=>d.verified)
    if (!verified.length) return
    setScanning(true)
    for (const d of verified) {
      setScanMsg(`Scanning ${d.domain_name}…`)
      await supabase.functions.invoke('dns-scan', { body:{ domain:d.domain_name, scan_type:'website', save_to_db:true, domain_id:d.id }})
    }
    setScanMsg('All scans complete — refreshing…')
    await loadData()
    setTimeout(() => setScanMsg(''), 3000)
    setScanning(false)
  }

  const filtered = filter === 'all' ? certs
    : filter === 'expiring' ? certs.filter(c => c.days_remaining != null && c.days_remaining <= 30)
    : filter === 'issues' ? certs.filter(c => !c.chain_valid || c.weak_cipher_detected)
    : certs

  const expiringSoon = certs.filter(c => c.days_remaining != null && c.days_remaining <= 30).length
  const issues = certs.filter(c => !c.chain_valid || c.weak_cipher_detected).length

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 16px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:D.text, marginBottom:4 }}>SSL Certificates</h2>
          <p style={{ fontSize:13, color:D.muted }}>TLS certificate health across all your monitored domains</p>
        </div>
        <button onClick={scanAll} disabled={scanning || !domains.some(d=>d.verified)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:8, color:'#10b981', fontSize:12, fontWeight:600, cursor:'pointer', opacity: scanning ? 0.6 : 1 }}>
          <RefreshCw size={13} style={{ animation: scanning ? 'dr-spin 1s linear infinite' : 'none' }}/>
          Scan all domains
        </button>
      </div>

      {/* Status message */}
      {scanMsg && (
        <div style={{ padding:'10px 14px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, color:'#10b981', fontSize:12, marginBottom:16 }}>
          {scanMsg}
        </div>
      )}

      {/* Summary cards */}
      {certs.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:20 }}>
          <SummaryCard label="Certificates" value={certs.length} color="#6b7280"/>
          <SummaryCard label="Expiring ≤ 30d" value={expiringSoon} color={expiringSoon > 0 ? '#f59e0b' : '#10b981'} onClick={() => setFilter('expiring')}/>
          <SummaryCard label="Issues found" value={issues} color={issues > 0 ? '#ef4444' : '#10b981'} onClick={() => setFilter('issues')}/>
          <SummaryCard label="Healthy" value={certs.filter(c=>c.days_remaining>30&&c.chain_valid&&!c.weak_cipher_detected).length} color="#10b981"/>
        </div>
      )}

      {/* Filter tabs */}
      {certs.length > 0 && (
        <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
          {[['all','All'],['expiring','Expiring soon'],['issues','Issues']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ padding:'5px 12px', background:filter===v?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.04)', border:`1px solid ${filter===v?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'}`, borderRadius:7, color:filter===v?'#10b981':D.muted, fontSize:12, fontWeight:filter===v?600:400, cursor:'pointer' }}>
              {l}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:60, background:D.surface, borderRadius:12, opacity:0.5 }}/>)}
        </div>
      ) : filtered.length === 0 && certs.length > 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:D.muted, fontSize:13 }}>No certificates match this filter</div>
      ) : certs.length === 0 ? (
        <div style={{ ...card }}>
          <div style={{ padding:'48px 24px', textAlign:'center' }}>
            <Lock size={36} color={D.dim} style={{ marginBottom:14 }}/>
            <div style={{ fontSize:15, fontWeight:600, color:D.text, marginBottom:8 }}>No SSL data yet</div>
            <p style={{ fontSize:13, color:D.muted, maxWidth:400, margin:'0 auto 20px' }}>
              Scan your domains to pull TLS certificate details including expiry, chain validity, key strength, and cipher support.
            </p>
            {domains.filter(d=>d.verified).length > 0 ? (
              <button onClick={scanAll} disabled={scanning}
                style={{ padding:'8px 20px', background:'#10b981', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Scan all domains now
              </button>
            ) : (
              <div style={{ fontSize:12, color:D.dim }}>Add and verify a domain in the Dashboard first</div>
            )}
          </div>
        </div>
      ) : (
        <>
          {filtered.map(cert => (
            <CertDetail key={cert.id} cert={cert} open={openId===cert.id} onToggle={() => setOpenId(openId===cert.id ? null : cert.id)}/>
          ))}
        </>
      )}

      {/* Unscanned domains */}
      {domains.filter(d => d.verified && !certs.find(c=>c.domain_name===d.domain_name)).length > 0 && (
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:12, color:D.muted, marginBottom:10, fontWeight:500 }}>Domains not yet scanned for SSL</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {domains.filter(d => d.verified && !certs.find(c=>c.domain_name===d.domain_name)).map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:D.surface, border:`1px solid ${D.border}`, borderRadius:10 }}>
                <span style={{ fontSize:13, color:D.muted }}>{d.domain_name}</span>
                <button onClick={() => scanDomain(d)} disabled={scanning}
                  style={{ padding:'4px 12px', background:'rgba(255,255,255,0.06)', border:`1px solid ${D.border}`, borderRadius:6, color:D.muted, fontSize:11, cursor:'pointer' }}>
                  Scan now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes dr-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function SummaryCard({ label, value, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'12px 14px', cursor:onClick?'pointer':'default' }}>
      <div style={{ fontSize:22, fontWeight:700, color, marginBottom:2 }}>{value}</div>
      <div style={{ fontSize:11, color:D.muted }}>{label}</div>
    </div>
  )
}
