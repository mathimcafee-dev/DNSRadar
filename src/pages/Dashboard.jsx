import { useState, useEffect } from 'react'
import { Plus, Globe, AlertTriangle, Trash2, RefreshCw, ExternalLink, Shield, Pause, Play, Clock, MoreVertical, X, Mail, Lock, Ban, Radar, CheckCircle, Copy, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddDomainModal from '../components/AddDomainModal'
import ScoreRing from '../components/ScoreRing'
import { timeAgo, getScoreColor, formatTTL } from '../lib/scoreEngine'

function DeleteModal({ domain, onConfirm, onCancel, loading }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()}
      style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000 }}>
      <div className="fade-in" style={{ background:'#fff',borderRadius:14,width:'100%',maxWidth:400,margin:'0 16px',padding:24,boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:16 }}>
          <div style={{ width:40,height:40,borderRadius:10,background:'var(--red-light)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <Trash2 size={18} color="var(--red-text)" />
          </div>
          <div>
            <div style={{ fontSize:15,fontWeight:600,marginBottom:4 }}>Delete domain?</div>
            <div style={{ fontSize:13,color:'var(--gray-500)',lineHeight:1.5 }}>
              Permanently delete <span style={{ fontFamily:'var(--mono)',fontWeight:600,color:'var(--gray-800)' }}>{domain?.domain_name}</span> and all scan history. Cannot be undone.
            </div>
          </div>
        </div>
        <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:'var(--red)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',fontSize:13,fontWeight:500,cursor:'pointer' }}>
            {loading ? <><div className="spinner" style={{ width:13,height:13,borderTopColor:'#fff',borderColor:'rgba(255,255,255,0.3)' }}/> Deleting…</> : <><Trash2 size={13}/> Delete forever</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase()
  const cls = ['pass','valid','clean','present','consistent','signed','enforced','active','blocked','configured'].includes(s) ? 'pill-pass'
    : ['warn','warning','expiring','partial','inconsistent'].includes(s) ? 'pill-warn'
    : ['fail','critical','missing','error','invalid','listed','not signed','not open'].includes(s) ? 'pill-fail'
    : 'pill-gray'
  return <span className={`pill ${cls}`}>{status}</span>
}

function CategoryBar({ label, icon: Icon, color, bg, score, max }) {
  const pct = Math.round((score / max) * 100)
  const barColor = score === 0 ? '#E24B4A' : score < max * 0.5 ? '#EF9F27' : score < max * 0.8 ? '#378ADD' : '#639922'
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--gray-100)' }}>
      <div style={{ width:28,height:28,borderRadius:7,background:bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
        <Icon size={14} color={color} />
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
          <span style={{ fontSize:12,fontWeight:500,color:'var(--gray-800)' }}>{label}</span>
          <span style={{ fontSize:11,color:'var(--gray-500)' }}>{score}/{max}</span>
        </div>
        <div style={{ height:5,background:'var(--gray-200)',borderRadius:3 }}>
          <div style={{ height:'100%',borderRadius:3,width:`${pct}%`,background:barColor,transition:'width 0.8s ease' }}/>
        </div>
      </div>
    </div>
  )
}

function PropagationGrid({ records }) {
  if (!records?.length) return <div style={{ padding:'20px',textAlign:'center',fontSize:12,color:'var(--gray-400)' }}>No propagation data</div>
  const regions = [
    { key:'us', label:'US', flag:'🇺🇸', sub:'Cloudflare' },
    { key:'eu', label:'EU', flag:'🇪🇺', sub:'Google' },
    { key:'apac', label:'APAC', flag:'🌏', sub:'OpenDNS' },
    { key:'au', label:'AU', flag:'🇦🇺', sub:'Quad9' },
  ]
  return (
    <div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,padding:'12px 16px' }}>
        {regions.map(r => (
          <div key={r.key} style={{ background:'var(--gray-50)',borderRadius:8,padding:'10px 8px',textAlign:'center' }}>
            <div style={{ fontSize:18,marginBottom:2 }}>{r.flag}</div>
            <div style={{ fontSize:11,fontWeight:500,color:'var(--gray-700)' }}>{r.label}</div>
            <div style={{ fontSize:10,color:'var(--gray-400)',marginBottom:8 }}>{r.sub}</div>
            {records.map(rec => (
              <div key={rec.type} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:10,padding:'2px 0' }}>
                <span style={{ color:'var(--gray-500)',fontFamily:'var(--mono)' }}>{rec.type}</span>
                <div style={{ width:8,height:8,borderRadius:'50%',background:rec[r.key]==='pass'?'#639922':'#EF9F27' }}/>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:16,padding:'4px 16px 12px',fontSize:10,color:'var(--gray-400)' }}>
        <span style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:7,height:7,borderRadius:'50%',background:'#639922' }}/> Consistent</span>
        <span style={{ display:'flex',alignItems:'center',gap:4 }}><div style={{ width:7,height:7,borderRadius:'50%',background:'#EF9F27' }}/> Inconsistent</span>
      </div>
    </div>
  )
}

function BlacklistGrid({ blacklists }) {
  if (!blacklists?.results?.length) return <div style={{ padding:'20px',textAlign:'center',fontSize:12,color:'var(--gray-400)' }}>No data</div>
  return (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,padding:'12px 14px' }}>
      {blacklists.results.map(bl => (
        <div key={bl.name} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 8px',borderRadius:6,background:bl.listed?'var(--red-light)':'var(--gray-50)' }}>
          <span style={{ fontSize:11,fontFamily:'var(--mono)',color:bl.listed?'var(--red-text)':'var(--gray-600)' }}>{bl.name}</span>
          <span className={`pill ${bl.listed?'pill-fail':'pill-pass'}`} style={{ fontSize:10,padding:'1px 6px' }}>{bl.listed?'Listed':'Clean'}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ user, setPage, setScanDomain, setScanType }) {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [scanning, setScanning] = useState({})
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => { if (user) fetchDomains() }, [user])

  async function fetchDomains() {
    setLoading(true)
    const { data } = await supabase.from('domains')
      .select(`*, scan_results(health_score,score_dns,score_email,score_ssl,score_propagation,score_security,score_blacklist,email_auth,ssl_info,security,propagation,blacklists,issues,dns_records,scanned_at)`)
      .eq('user_id', user.id).order('created_at', { ascending: false })
    setDomains(data || [])
    if (data?.length && !selected) setSelected(data[0])
    setLoading(false)
  }

  async function triggerScan(domain) {
    setScanning(s => ({ ...s, [domain.id]: true }))
    try {
      await supabase.functions.invoke('dns-scan', { body: { domain: domain.domain_name, scan_type: 'website', save_to_db: true, domain_id: domain.id } })
      await fetchDomains()
    } finally { setScanning(s => ({ ...s, [domain.id]: false })) }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await supabase.from('domains').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    if (selected?.id === deleteTarget.id) setSelected(null)
    fetchDomains()
  }

  async function togglePause(domain) {
    await supabase.from('domains').update({ paused: !domain.paused }).eq('id', domain.id)
    fetchDomains()
  }

  async function updateInterval(domainId, interval) {
    await supabase.from('domains').update({ monitor_interval: interval }).eq('id', domainId)
    fetchDomains()
  }

  const scan = selected?.scan_results?.[0]
  const issues = scan?.issues || []
  const critical = issues.filter(i => i.severity === 'critical')
  const warns = issues.filter(i => i.severity === 'warn')

  const cats = scan ? [
    { label:'DNS records', icon:Globe, color:'#185FA5', bg:'#E6F1FB', score:scan.score_dns, max:25 },
    { label:'Email auth', icon:Mail, color:'#A32D2D', bg:'#FCEBEB', score:scan.score_email, max:30 },
    { label:'SSL / TLS', icon:Lock, color:'#27500A', bg:'#EAF3DE', score:scan.score_ssl, max:20 },
    { label:'Propagation', icon:Globe, color:'#633806', bg:'#FAEEDA', score:scan.score_propagation, max:10 },
    { label:'Security', icon:Shield, color:'#A32D2D', bg:'#FCEBEB', score:scan.score_security, max:10 },
    { label:'Blacklists', icon:Ban, color:'#A32D2D', bg:'#FCEBEB', score:scan.score_blacklist, max:5 },
  ] : []

  return (
    <div style={{ display:'flex',height:'calc(100vh - 56px)',fontFamily:'var(--font)' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width:240,flexShrink:0,background:'#fff',borderRight:'1px solid var(--gray-200)',display:'flex',flexDirection:'column',overflow:'hidden' }}>
        <div style={{ padding:12,borderBottom:'1px solid var(--gray-200)' }}>
          <button className="btn btn-primary" style={{ width:'100%',justifyContent:'center' }} onClick={() => setShowAdd(true)}>
            <Plus size={14}/> Add domain
          </button>
        </div>
        <div style={{ flex:1,overflowY:'auto',padding:'6px 0' }}>
          {loading ? (
            <div style={{ padding:12,display:'flex',flexDirection:'column',gap:8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:48,borderRadius:8 }}/>)}
            </div>
          ) : domains.length === 0 ? (
            <div style={{ padding:'32px 16px',textAlign:'center' }}>
              <Shield size={28} color="var(--gray-300)" style={{ marginBottom:8 }}/>
              <div style={{ fontSize:12,color:'var(--gray-400)' }}>No domains yet</div>
            </div>
          ) : domains.map(d => {
            const s = d.scan_results?.[0]
            const score = s?.health_score
            const issues = s?.issues?.length || 0
            const isActive = selected?.id === d.id
            return (
              <div key={d.id} onClick={() => { setSelected(d); setActiveSection('overview') }}
                style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',cursor:'pointer',borderLeft:`3px solid ${isActive?'var(--green)':'transparent'}`,background:isActive?'#EAF3DE':'transparent' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',flexShrink:0,background:d.paused?'var(--gray-300)':!d.verified?'var(--amber)':getScoreColor(score) }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div className="truncate" style={{ fontSize:12,fontWeight:500,color:'var(--gray-900)' }}>{d.domain_name}</div>
                  <div style={{ fontSize:10,color:'var(--gray-400)' }}>
                    {!d.verified?'Pending verification':d.paused?'Paused':`${d.monitor_interval} · ${issues>0?`${issues} issues`:'Clean'}`}
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  {score !== undefined && score !== null && <span style={{ fontSize:12,fontWeight:600,color:getScoreColor(score) }}>{score}</span>}
                  <div onClick={e => { e.stopPropagation(); setDeleteTarget(d) }}
                    style={{ width:20,height:20,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--gray-400)' }}>
                    <Trash2 size={11}/>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div style={{ flex:1,overflowY:'auto',background:'var(--gray-50)' }}>
        {!selected && !loading ? (
          <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:16 }}>
            <Shield size={48} color="var(--gray-200)"/>
            <div style={{ fontSize:16,fontWeight:600,color:'var(--gray-400)' }}>Add your first domain to start</div>
            <button className="btn btn-primary btn-lg" onClick={() => setShowAdd(true)}><Plus size={15}/> Add domain</button>
          </div>
        ) : selected ? (
          <div>
            {/* Domain header bar */}
            <div style={{ background:'#fff',borderBottom:'1px solid var(--gray-200)',padding:'14px 20px' }}>
              <div style={{ display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                    <h2 style={{ fontSize:17,fontWeight:600,color:'var(--gray-900)' }}>{selected.domain_name}</h2>
                    {selected.verified && <span className="pill pill-pass" style={{ fontSize:10 }}>Verified</span>}
                    {selected.paused && <span className="pill pill-gray" style={{ fontSize:10 }}>Paused</span>}
                    {critical.length > 0 && <span className="pill pill-fail" style={{ fontSize:10 }}>{critical.length} critical</span>}
                  </div>
                  <div style={{ fontSize:12,color:'var(--gray-500)',display:'flex',gap:12,flexWrap:'wrap' }}>
                    {scan?.blacklists?.ip && <span style={{ fontFamily:'var(--mono)' }}>{scan.blacklists.ip}</span>}
                    <span>{selected.monitor_interval} monitoring</span>
                    {scan?.scanned_at && <span>Scanned {timeAgo(scan.scanned_at)}</span>}
                  </div>
                  {/* Sub-nav */}
                  <div style={{ display:'flex',gap:2,marginTop:10 }}>
                    {['overview','email','ssl','propagation','blacklists','dns'].map(s => (
                      <button key={s} onClick={() => setActiveSection(s)}
                        style={{ padding:'4px 12px',borderRadius:'var(--radius-md)',border:'none',cursor:'pointer',fontSize:12,fontWeight:activeSection===s?500:400,background:activeSection===s?'#EAF3DE':'transparent',color:activeSection===s?'var(--green)':'var(--gray-600)' }}>
                        {s.charAt(0).toUpperCase()+s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Score ring */}
                {scan && <ScoreRing score={scan.health_score} size={80}/>}
                {/* Actions */}
                <div style={{ display:'flex',flexDirection:'column',gap:6,alignSelf:'flex-start' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => triggerScan(selected)} disabled={scanning[selected.id]}>
                    {scanning[selected.id]?<><div className="spinner" style={{ width:12,height:12,borderTopColor:'#fff' }}/> Scanning…</>:<><RefreshCw size={12}/> Scan now</>}
                  </button>
                  <div style={{ display:'flex',gap:6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => togglePause(selected)}>
                      {selected.paused?<Play size={11}/>:<Pause size={11}/>}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setScanDomain(selected.domain_name); setScanType('website'); setPage('scan') }}>
                      <ExternalLink size={11}/>
                    </button>
                    <button onClick={() => setDeleteTarget(selected)}
                      style={{ padding:'5px 8px',background:'var(--red-light)',color:'var(--red-text)',border:'none',borderRadius:'var(--radius-md)',cursor:'pointer',display:'flex',alignItems:'center' }}>
                      <Trash2 size={11}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding:'16px 20px',display:'flex',flexDirection:'column',gap:12 }}>

              {/* ── OVERVIEW ── */}
              {activeSection === 'overview' && (
                <>
                  {/* Metric cards */}
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10 }}>
                    {[
                      { label:'Health score', val:scan?.health_score??'–', color:getScoreColor(scan?.health_score), sub:'out of 100', pct:(scan?.health_score||0) },
                      { label:'Critical issues', val:critical.length, color:'var(--red)', sub:critical.length>0?'Fix immediately':'All clear', pct:Math.min(critical.length*25,100), barColor:'var(--red)' },
                      { label:'Blacklists', val:scan?.blacklists?.listed_count??0, color:scan?.blacklists?.listed_count>0?'var(--red)':'var(--green)', sub:`of ${scan?.blacklists?.results?.length||0} checked`, pct:scan?.blacklists?.listed_count>0?Math.min(scan.blacklists.listed_count*15,100):100, barColor:scan?.blacklists?.listed_count>0?'var(--red)':'var(--green)' },
                      { label:'DNS records', val:scan?.dns_records?.length??0, color:'var(--blue)', sub:'records found', pct:100, barColor:'var(--blue)' },
                    ].map(m => (
                      <div key={m.label} style={{ background:'#fff',border:'1px solid var(--gray-200)',borderRadius:10,padding:'12px 14px' }}>
                        <div style={{ fontSize:11,color:'var(--gray-500)',marginBottom:3 }}>{m.label}</div>
                        <div style={{ fontSize:22,fontWeight:600,color:m.color,lineHeight:1 }}>{m.val}</div>
                        <div style={{ fontSize:10,color:'var(--gray-400)',marginTop:4 }}>{m.sub}</div>
                        <div style={{ height:3,background:'var(--gray-200)',borderRadius:2,marginTop:8 }}>
                          <div style={{ height:'100%',borderRadius:2,width:`${m.pct}%`,background:m.barColor||m.color,transition:'width 0.8s ease' }}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Score breakdown + Issues */}
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                    {/* Category scores */}
                    <div className="card">
                      <div className="card-header"><span className="card-title">Score breakdown</span></div>
                      <div style={{ padding:'8px 16px' }}>
                        {cats.map(c => <CategoryBar key={c.label} {...c}/>)}
                      </div>
                    </div>

                    {/* Issues list */}
                    <div className="card">
                      <div className="card-header">
                        <span className="card-title">Issues to fix</span>
                        <div style={{ display:'flex',gap:4 }}>
                          {critical.length>0 && <span className="pill pill-fail">{critical.length} critical</span>}
                          {warns.length>0 && <span className="pill pill-warn">{warns.length} warn</span>}
                        </div>
                      </div>
                      {issues.length === 0 ? (
                        <div style={{ padding:'32px',textAlign:'center' }}>
                          <CheckCircle size={32} color="var(--green)" style={{ marginBottom:8 }}/>
                          <div style={{ fontSize:13,color:'var(--gray-500)' }}>All checks passing</div>
                        </div>
                      ) : issues.map((iss,i) => (
                        <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'10px 16px',borderBottom:'1px solid var(--gray-50)' }}>
                          <div style={{ width:24,height:24,borderRadius:6,background:iss.severity==='critical'?'var(--red-light)':iss.severity==='warn'?'#FAEEDA':'var(--blue-light)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                            <AlertTriangle size={12} color={iss.severity==='critical'?'var(--red-text)':iss.severity==='warn'?'var(--amber-text)':'var(--blue-text)'}/>
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}>
                              <span style={{ fontSize:12,fontWeight:500 }}>{iss.type}</span>
                              <span className={`pill ${iss.severity==='critical'?'pill-fail':iss.severity==='warn'?'pill-warn':'pill-info'}`} style={{ fontSize:10,padding:'1px 6px' }}>{iss.severity}</span>
                            </div>
                            <div style={{ fontSize:11,color:'var(--gray-500)',marginBottom:3 }}>{iss.message}</div>
                            {iss.fix && (
                              <div style={{ padding:'4px 8px',background:'var(--gray-50)',borderRadius:5,fontSize:10,fontFamily:'var(--mono)',color:'var(--gray-600)',wordBreak:'break-all' }}>
                                {iss.fix}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── EMAIL AUTH ── */}
              {activeSection === 'email' && scan?.email_auth && (
                <div className="card">
                  <div className="card-header"><span className="card-title"><Mail size={13}/> Email authentication</span></div>
                  {[
                    { name:'SPF', status:scan.email_auth.spf_status, value:scan.email_auth.spf_raw, note:scan.email_auth.spf_fix },
                    { name:'DKIM', status:scan.email_auth.dkim_status, value:scan.email_auth.dkim_selector?`Selector: ${scan.email_auth.dkim_selector}`:null, note:scan.email_auth.dkim_note },
                    { name:'DMARC', status:scan.email_auth.dmarc_status, value:scan.email_auth.dmarc_raw, note:scan.email_auth.dmarc_fix||scan.email_auth.dmarc_suggestion },
                    { name:'BIMI', status:scan.email_auth.bimi_status||'Missing', value:scan.email_auth.bimi_raw, note:scan.email_auth.bimi_note },
                    { name:'MTA-STS', status:scan.email_auth.mta_sts_status||'Not configured', value:null, note:null },
                    { name:'TLS-RPT', status:scan.email_auth.tls_rpt_status||'Not configured', value:null, note:null },
                  ].map((r,i) => (
                    <div key={r.name} style={{ display:'flex',alignItems:'flex-start',gap:12,padding:'11px 16px',borderBottom:'1px solid var(--gray-50)' }}>
                      <div style={{ width:80,flexShrink:0 }}>
                        <span style={{ fontSize:12,fontWeight:600,color:'var(--gray-700)',fontFamily:'var(--mono)' }}>{r.name}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        {r.value && <div style={{ fontSize:11,fontFamily:'var(--mono)',color:'var(--gray-600)',marginBottom:4,wordBreak:'break-all' }}>{r.value}</div>}
                        {r.note && <div style={{ fontSize:11,color:'var(--gray-400)',lineHeight:1.5 }}>{r.note}</div>}
                      </div>
                      <StatusBadge status={r.status}/>
                    </div>
                  ))}
                </div>
              )}

              {/* ── SSL ── */}
              {activeSection === 'ssl' && scan?.ssl_info && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title"><Lock size={13}/> SSL / TLS</span>
                    <StatusBadge status={scan.ssl_info.overall_status}/>
                  </div>
                  {scan.ssl_info.certs?.map((cert,i) => (
                    <div key={i} style={{ padding:'14px 16px',borderBottom:'1px solid var(--gray-50)' }}>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14 }}>
                        {[
                          { label:'Domain', val:cert.domain },
                          { label:'Protocol', val:cert.protocol||'TLS' },
                          { label:'Key size', val:`${cert.key_size||'?'}-bit` },
                          { label:'Chain valid', val:cert.chain_valid?'Valid':'Invalid' },
                          { label:'CT log', val:cert.ct_log?'Verified':'Not found' },
                          { label:'HSTS', val:cert.hsts||'Not set' },
                        ].map(f => (
                          <div key={f.label}>
                            <div style={{ fontSize:10,color:'var(--gray-400)',marginBottom:3 }}>{f.label}</div>
                            <div style={{ fontSize:12,fontWeight:500,color:'var(--gray-800)' }}>{f.val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop:12,padding:'8px 12px',background:'var(--blue-light)',borderRadius:7,fontSize:11,color:'var(--blue-text)' }}>
                        {scan.ssl_info.note}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── PROPAGATION ── */}
              {activeSection === 'propagation' && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title"><Globe size={13}/> Global propagation</span>
                    <StatusBadge status={scan?.propagation?.consistent?'Consistent':'Inconsistent'}/>
                  </div>
                  <PropagationGrid records={scan?.propagation?.records}/>
                </div>
              )}

              {/* ── BLACKLISTS ── */}
              {activeSection === 'blacklists' && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title"><Ban size={13}/> Blacklist reputation</span>
                    <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                      {scan?.blacklists?.ip && <span style={{ fontSize:11,fontFamily:'var(--mono)',color:'var(--gray-500)' }}>{scan.blacklists.ip}</span>}
                      <span className={`pill ${(scan?.blacklists?.listed_count||0)>0?'pill-fail':'pill-pass'}`}>{scan?.blacklists?.listed_count||0} listed</span>
                    </div>
                  </div>
                  <BlacklistGrid blacklists={scan?.blacklists}/>
                </div>
              )}

              {/* ── DNS RECORDS ── */}
              {activeSection === 'dns' && (
                <div className="card">
                  <div className="card-header">
                    <span className="card-title"><Globe size={13}/> DNS records</span>
                    <span style={{ fontSize:12,color:'var(--gray-500)' }}>{scan?.dns_records?.length||0} records</span>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table className="table">
                      <thead><tr><th>Type</th><th>Value</th><th>TTL</th><th>Status</th></tr></thead>
                      <tbody>
                        {scan?.dns_records?.map((r,i) => (
                          <tr key={i}>
                            <td><span className="pill pill-info" style={{ fontSize:10 }}>{r.type}</span></td>
                            <td style={{ fontFamily:'var(--mono)',fontSize:11,maxWidth:320,wordBreak:'break-all' }}>{r.value}</td>
                            <td style={{ fontFamily:'var(--mono)',fontSize:11 }}>{formatTTL(r.ttl)}</td>
                            <td><StatusBadge status={r.status}/></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monitor interval (overview only) */}
              {activeSection === 'overview' && (
                <div className="card">
                  <div className="card-header"><span className="card-title"><Clock size={13}/> Monitor interval</span></div>
                  <div style={{ padding:'12px 16px',display:'flex',gap:8 }}>
                    {['1h','6h','24h','off'].map(iv => (
                      <button key={iv} className={`btn btn-sm ${selected.monitor_interval===iv?'btn-primary':'btn-ghost'}`}
                        onClick={() => updateInterval(selected.id, iv)}>
                        {iv==='off'?'Off':`Every ${iv}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {showAdd && <AddDomainModal user={user} onClose={() => setShowAdd(false)} onSuccess={fetchDomains}/>}
      {deleteTarget && <DeleteModal domain={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading}/>}
    </div>
  )
}
