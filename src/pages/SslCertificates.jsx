import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Lock, RefreshCw, ChevronDown, ChevronUp, Search, Trash2, Plus } from 'lucide-react'

const D = { bg:'#0b0f14', surface:'#111827', surface2:'#1a2235', border:'rgba(255,255,255,0.07)', text:'#e2e8f0', muted:'rgba(255,255,255,0.45)', dim:'rgba(255,255,255,0.2)' }
const card = { background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, overflow:'hidden' }

function daysColor(days) {
  if (days == null) return '#6b7280'
  if (days <= 7)  return '#ef4444'
  if (days <= 30) return '#f59e0b'
  if (days <= 60) return '#3b82f6'
  return '#10b981'
}

function DaysBadge({ days }) {
  const color = daysColor(days)
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background:color+'18', color, border:`1px solid ${color}28`, whiteSpace:'nowrap' }}>
      {days == null ? '–' : days <= 0 ? 'Expired' : `${days}d left`}
    </span>
  )
}

function Field({ label, value, good }) {
  const color = good === true ? '#10b981' : good === false ? '#ef4444' : D.muted
  return (
    <div>
      <div style={{ fontSize:10, color:D.dim, marginBottom:2, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
      <div style={{ fontSize:12, color, fontWeight:500 }}>{value || '–'}</div>
    </div>
  )
}

function CertCard({ cert, open, onToggle, onDelete }) {
  const sans = cert.subject_alt_names || []
  const tlsVersions = cert.tls_versions_supported || []
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e) {
    e.stopPropagation()
    if (!confirm(`Delete SSL record for ${cert.domain_name}?`)) return
    setDeleting(true)
    await onDelete(cert.id)
  }

  return (
    <div style={{ ...card, marginBottom:10 }}>
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', flexWrap:'wrap' }} onClick={onToggle}>
        {/* Lock icon with expiry colour */}
        <div style={{ width:34, height:34, borderRadius:9, background:daysColor(cert.days_remaining)+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Lock size={15} color={daysColor(cert.days_remaining)}/>
        </div>

        {/* Domain + issuer */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:D.text, marginBottom:2 }}>{cert.domain_name}</div>
          <div style={{ fontSize:11, color:D.muted }}>{cert.issuer_org || cert.issuer_cn || 'Unknown issuer'}</div>
        </div>

        {/* Badges + actions */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <DaysBadge days={cert.days_remaining}/>
          {cert.chain_valid === false && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:6, background:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', fontWeight:500 }}>Chain error</span>}
          {cert.weak_cipher_detected && <span style={{ fontSize:10, padding:'2px 7px', borderRadius:6, background:'rgba(245,158,11,0.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.2)', fontWeight:500 }}>Weak cipher</span>}
          <button onClick={handleDelete} disabled={deleting}
            style={{ padding:'5px 7px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:7, color:'rgba(239,68,68,0.7)', cursor:'pointer', lineHeight:0, flexShrink:0 }}
            title="Delete this SSL record">
            <Trash2 size={13}/>
          </button>
          {open ? <ChevronUp size={14} color={D.dim}/> : <ChevronDown size={14} color={D.dim}/>}
        </div>
      </div>

      {open && (
        <div style={{ borderTop:`1px solid ${D.border}`, padding:'14px 16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:14 }}>
            <Field label="Subject CN" value={cert.subject_cn}/>
            <Field label="Valid from" value={cert.valid_from ? new Date(cert.valid_from).toLocaleDateString() : null}/>
            <Field label="Expires" value={cert.valid_to ? new Date(cert.valid_to).toLocaleDateString() : null}/>
            <Field label="Key" value={cert.key_algorithm ? `${cert.key_size||'?'}-bit ${cert.key_algorithm}` : null}/>
            <Field label="Signature" value={cert.signature_algorithm}/>
            <Field label="Chain length" value={cert.chain_length != null ? `${cert.chain_length} cert${cert.chain_length!==1?'s':''}` : null}/>
            <Field label="HSTS" value={cert.hsts_enabled ? (cert.hsts_max_age ? `${Math.round(cert.hsts_max_age/86400)}d max-age` : 'Enabled') : 'Not set'} good={cert.hsts_enabled}/>
            <Field label="OCSP stapling" value={cert.ocsp_stapling ? 'Enabled' : 'Not enabled'} good={cert.ocsp_stapling}/>
            <Field label="CT logged" value={cert.ct_logged ? 'Yes' : 'No'} good={cert.ct_logged}/>
          </div>
          {tlsVersions.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:D.muted, marginBottom:6, fontWeight:500 }}>TLS versions</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {tlsVersions.map(v => (
                  <span key={v} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:(v==='TLSv1.0'||v==='TLSv1.1')?'rgba(239,68,68,0.12)':'rgba(16,185,129,0.12)', color:(v==='TLSv1.0'||v==='TLSv1.1')?'#ef4444':'#10b981', border:`1px solid ${(v==='TLSv1.0'||v==='TLSv1.1')?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`, fontWeight:500 }}>{v}</span>
                ))}
              </div>
            </div>
          )}
          {sans.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:D.muted, marginBottom:6, fontWeight:500 }}>Subject alt names ({sans.length})</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {sans.slice(0,12).map(s => (
                  <span key={s} style={{ fontSize:10, fontFamily:'monospace', padding:'2px 7px', borderRadius:5, background:'rgba(255,255,255,0.04)', color:D.muted, border:`1px solid ${D.border}` }}>{s}</span>
                ))}
                {sans.length > 12 && <span style={{ fontSize:10, color:D.dim }}>+{sans.length-12} more</span>}
              </div>
            </div>
          )}
          {cert.serial_number && <div style={{ fontSize:10, fontFamily:'monospace', color:D.dim, marginTop:4 }}>Serial: {cert.serial_number}</div>}
          <div style={{ fontSize:10, color:D.dim, marginTop:6 }}>Last scanned {cert.scanned_at ? new Date(cert.scanned_at).toLocaleString() : '–'}</div>
        </div>
      )}
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

export default function SslCertificates({ user }) {
  const [certs, setCerts] = useState([])
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const [scanError, setScanError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('all')

  // Manual domain input
  const [manualDomain, setManualDomain] = useState('')
  const [manualScanning, setManualScanning] = useState(false)

  useEffect(() => { loadData() }, [user.id])

  async function loadData() {
    setLoading(true)
    const dRes = await supabase.from('domains').select('id,domain_name,verified').eq('user_id', user.id).order('domain_name')
    const domainIds = (dRes.data||[]).map(d=>d.id)
    const cRes = domainIds.length
      ? await supabase.from('ssl_certificates').select('*').in('domain_id', domainIds).order('days_remaining', { ascending:true })
      : { data: [] }
    setDomains(dRes.data||[])
    setCerts(cRes.data||[])
    setLoading(false)
  }

  async function scanAll() {
    const verified = domains.filter(d=>d.verified)
    if (!verified.length) return
    setScanning(true); setScanError('')
    for (const d of verified) {
      setScanMsg(`Scanning ${d.domain_name}…`)
      await supabase.functions.invoke('dns-scan', { body:{ domain:d.domain_name, scan_type:'website', save_to_db:true, domain_id:d.id }})
    }
    setScanMsg('All scans complete')
    await loadData()
    setTimeout(() => setScanMsg(''), 3000)
    setScanning(false)
  }

  async function scanDomain(d) {
    setScanning(true); setScanMsg(`Scanning ${d.domain_name}…`); setScanError('')
    const res = await supabase.functions.invoke('dns-scan', { body:{ domain:d.domain_name, scan_type:'website', save_to_db:true, domain_id:d.id }})
    if (res.error) setScanError(`Scan failed: ${res.error.message}`)
    else { setScanMsg('Done'); await loadData(); setTimeout(() => setScanMsg(''), 2000) }
    setScanning(false)
  }

  async function scanManualDomain() {
    const raw = manualDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*/, '').toLowerCase()
    if (!raw) return
    setManualScanning(true); setScanError(''); setScanMsg(`Checking ${raw}…`)

    // Check if domain already in user's list
    let domainId = domains.find(d => d.domain_name === raw)?.id

    // If not in list, add it (unverified is fine for SSL check)
    if (!domainId) {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
      const { data: newDomain, error } = await supabase.from('domains').insert({
        user_id: user.id, domain_name: raw, verify_token: token, monitor_interval: '6h'
      }).select('id').single()
      if (error && error.code !== '23505') {
        setScanError(`Could not add domain: ${error.message}`)
        setManualScanning(false); setScanMsg(''); return
      }
      if (newDomain) domainId = newDomain.id
      else {
        // Already exists, fetch it
        const { data: existing } = await supabase.from('domains').select('id').eq('user_id', user.id).eq('domain_name', raw).single()
        domainId = existing?.id
      }
    }

    if (!domainId) { setScanError('Could not resolve domain ID'); setManualScanning(false); setScanMsg(''); return }

    const res = await supabase.functions.invoke('dns-scan', { body:{ domain:raw, scan_type:'website', save_to_db:true, domain_id:domainId }})
    if (res.error || res.data?.error) {
      setScanError(`Scan failed: ${res.data?.error || res.error?.message}`)
    } else {
      setScanMsg(`SSL data fetched for ${raw}`)
      setManualDomain('')
      await loadData()
      setTimeout(() => setScanMsg(''), 3000)
    }
    setManualScanning(false)
  }

  async function deleteCert(certId) {
    await supabase.from('ssl_certificates').delete().eq('id', certId)
    setCerts(c => c.filter(x => x.id !== certId))
  }

  const expiringSoon = certs.filter(c => c.days_remaining != null && c.days_remaining <= 30).length
  const issues = certs.filter(c => !c.chain_valid || c.weak_cipher_detected).length
  const filtered = filter==='expiring' ? certs.filter(c=>c.days_remaining!=null&&c.days_remaining<=30)
    : filter==='issues' ? certs.filter(c=>!c.chain_valid||c.weak_cipher_detected) : certs

  return (
    <div style={{ maxWidth:940, margin:'0 auto', padding:'24px 20px', fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes sslspin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, color:D.text, marginBottom:4 }}>SSL Certificates</h2>
          <p style={{ fontSize:13, color:D.muted }}>TLS certificate health across all monitored domains</p>
        </div>
        <button onClick={scanAll} disabled={scanning || !domains.some(d=>d.verified)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, color:'#10b981', fontSize:12, fontWeight:600, cursor:'pointer', opacity:scanning?0.6:1 }}>
          <RefreshCw size={13} style={{ animation:scanning?'sslspin 1s linear infinite':'none' }}/> Scan all
        </button>
      </div>

      {/* Manual domain input */}
      <div style={{ ...card, marginBottom:20, padding:'14px 16px' }}>
        <div style={{ fontSize:12, fontWeight:600, color:D.text, marginBottom:10, display:'flex', alignItems:'center', gap:7 }}>
          <Search size={13} color="#10b981"/> Check any domain
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input
            value={manualDomain}
            onChange={e => setManualDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !manualScanning && scanManualDomain()}
            placeholder="Enter any domain — e.g. github.com"
            style={{ flex:1, padding:'9px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:8, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}
          />
          <button
            onClick={scanManualDomain}
            disabled={manualScanning || !manualDomain.trim()}
            style={{ padding:'9px 18px', background:'#10b981', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7, opacity: manualScanning || !manualDomain.trim() ? 0.6 : 1 }}>
            {manualScanning
              ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'sslspin 0.7s linear infinite' }}/> Scanning…</>
              : <><Plus size={13}/> Check SSL</>
            }
          </button>
        </div>
        <div style={{ fontSize:11, color:D.dim, marginTop:7 }}>
          Checks any domain — doesn't need to be in your account. Result is saved so you can track it.
        </div>
      </div>

      {/* Status messages */}
      {scanMsg && <div style={{ padding:'9px 14px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, color:'#10b981', fontSize:12, marginBottom:14 }}>{scanMsg}</div>}
      {scanError && <div style={{ padding:'9px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#ef4444', fontSize:12, marginBottom:14 }}>{scanError}</div>}

      {/* Summary cards */}
      {certs.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10, marginBottom:18 }}>
          <SummaryCard label="Total" value={certs.length} color="#6b7280"/>
          <SummaryCard label="Expiring ≤ 30d" value={expiringSoon} color={expiringSoon>0?'#f59e0b':'#10b981'} onClick={()=>setFilter('expiring')}/>
          <SummaryCard label="Issues" value={issues} color={issues>0?'#ef4444':'#10b981'} onClick={()=>setFilter('issues')}/>
          <SummaryCard label="Healthy" value={certs.filter(c=>c.days_remaining>30&&c.chain_valid&&!c.weak_cipher_detected).length} color="#10b981"/>
        </div>
      )}

      {/* Filter tabs */}
      {certs.length > 0 && (
        <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
          {[['all','All'],['expiring','Expiring soon'],['issues','Issues']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{ padding:'5px 12px', background:filter===v?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.04)', border:`1px solid ${filter===v?'rgba(16,185,129,0.25)':'rgba(255,255,255,0.08)'}`, borderRadius:7, color:filter===v?'#10b981':D.muted, fontSize:12, fontWeight:filter===v?600:400, cursor:'pointer' }}>{l}</button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:60, background:D.surface, borderRadius:12, opacity:0.4 }}/>)}
        </div>
      ) : certs.length === 0 ? (
        <div style={{ ...card, padding:'48px 24px', textAlign:'center' }}>
          <Lock size={36} color={D.dim} style={{ marginBottom:14 }}/>
          <div style={{ fontSize:15, fontWeight:600, color:D.text, marginBottom:8 }}>No SSL data yet</div>
          <p style={{ fontSize:13, color:D.muted, maxWidth:420, margin:'0 auto 16px', lineHeight:1.6 }}>
            Enter a domain above to check its certificate, or scan all your tracked domains at once.
          </p>
          {domains.filter(d=>d.verified).length > 0 && (
            <button onClick={scanAll} disabled={scanning} style={{ padding:'8px 20px', background:'#10b981', border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Scan all domains now
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:D.muted, fontSize:13 }}>No certificates match this filter</div>
      ) : (
        filtered.map(cert => (
          <CertCard
            key={cert.id}
            cert={cert}
            open={openId === cert.id}
            onToggle={() => setOpenId(openId === cert.id ? null : cert.id)}
            onDelete={deleteCert}
          />
        ))
      )}

      {/* Unscanned domains */}
      {!loading && domains.filter(d=>d.verified&&!certs.find(c=>c.domain_name===d.domain_name)).length > 0 && (
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:12, color:D.muted, marginBottom:10, fontWeight:500 }}>Tracked domains not yet scanned for SSL</div>
          {domains.filter(d=>d.verified&&!certs.find(c=>c.domain_name===d.domain_name)).map(d=>(
            <div key={d.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, marginBottom:6 }}>
              <span style={{ fontSize:13, color:D.muted }}>{d.domain_name}</span>
              <button onClick={()=>scanDomain(d)} disabled={scanning} style={{ padding:'5px 14px', background:'rgba(255,255,255,0.06)', border:`1px solid ${D.border}`, borderRadius:6, color:D.muted, fontSize:11, fontWeight:500, cursor:'pointer' }}>Scan now</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
