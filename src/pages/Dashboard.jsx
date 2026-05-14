import { useState, useEffect } from 'react'
import { Plus, Globe, AlertTriangle, Trash2, RefreshCw, ExternalLink, Shield, Pause, Play, Clock, MoreVertical, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddDomainModal from '../components/AddDomainModal'
import ScoreRing from '../components/ScoreRing'
import { timeAgo, getScoreColor, getScoreBg } from '../lib/scoreEngine'

// ─── Delete Confirm Modal ────────────────────────────────────────────
function DeleteModal({ domain, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 400, margin: '0 16px', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} className="fade-in">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={18} color="var(--red-text)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Delete domain?</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5 }}>
              This will permanently delete <span className="mono" style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{domain?.domain_name}</span> and all its scan history, alerts, and monitoring data. This cannot be undone.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn" onClick={onConfirm} disabled={loading}
            style={{ background: 'var(--red)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Deleting…</> : <><Trash2 size={13} /> Delete forever</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Domain Card (grid view) ─────────────────────────────────────────
function DomainCard({ domain, onClick, onDelete, onScan, scanning }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const latest = domain.scan_results?.[0]
  const issues = latest?.issues || []
  const critical = issues.filter(i => i.severity === 'critical').length
  const warns = issues.filter(i => i.severity === 'warn').length

  return (
    <div className="card" style={{ cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
      {/* 3-dot menu */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
        <button onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          className="btn btn-ghost btn-sm" style={{ padding: '4px 6px', opacity: 0.6 }}>
          <MoreVertical size={14} />
        </button>
        {menuOpen && (
          <div style={{ position: 'absolute', right: 0, top: '110%', width: 160, background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 10, boxShadow: 'var(--shadow-md)', padding: '4px 0', zIndex: 100 }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => { setMenuOpen(false); onScan(domain) }} disabled={scanning}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--gray-700)' }}>
              <RefreshCw size={13} /> Scan now
            </button>
            <button onClick={() => { setMenuOpen(false); onClick(domain) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--gray-700)' }}>
              <ExternalLink size={13} /> View details
            </button>
            <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--gray-100)' }} />
            <button onClick={() => { setMenuOpen(false); onDelete(domain) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--red-text)' }}>
              <Trash2 size={13} /> Delete domain
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }} onClick={() => onClick(domain)}>
        <ScoreRing score={latest?.health_score} size={64} />
        <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
          <div className="truncate" style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{domain.domain_name}</div>
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 8 }}>
            {latest ? `Scanned ${timeAgo(latest.scanned_at)}` : 'Not scanned yet'}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {!domain.verified && <span className="pill pill-warn">Unverified</span>}
            {critical > 0 && <span className="pill pill-fail">{critical} critical</span>}
            {warns > 0 && <span className="pill pill-warn">{warns} warnings</span>}
            {issues.length === 0 && latest && <span className="pill pill-pass">All passing</span>}
            {domain.paused && <span className="pill pill-gray">Paused</span>}
            {!domain.paused && domain.verified && <span className="pill pill-gray">{domain.monitor_interval}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar Domain Row ──────────────────────────────────────────────
function SidebarDomainRow({ domain, selected, onClick, onDelete }) {
  const latest = domain.scan_results?.[0]
  const score = latest?.health_score
  const issues = latest?.issues?.length || 0
  const [hover, setHover] = useState(false)

  return (
    <div onClick={() => onClick(domain)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        cursor: 'pointer', position: 'relative',
        background: selected?.id === domain.id ? '#EAF3DE' : hover ? 'var(--gray-50)' : 'transparent',
        borderLeft: selected?.id === domain.id ? '3px solid var(--green)' : '3px solid transparent',
      }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: domain.paused ? 'var(--gray-300)' : !domain.verified ? 'var(--amber)' : getScoreColor(score) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontSize: 12, fontWeight: 500 }}>{domain.domain_name}</div>
        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>
          {!domain.verified ? 'Pending verify' : domain.paused ? 'Paused' : `${domain.monitor_interval} · ${issues > 0 ? `${issues} issues` : 'Clean'}`}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {score !== undefined && score !== null && (
          <span style={{ fontSize: 12, fontWeight: 600, color: getScoreColor(score) }}>{score}</span>
        )}
        {/* Delete button — shows on hover */}
        {hover && (
          <button onClick={e => { e.stopPropagation(); onDelete(domain) }}
            style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', borderRadius: 4, display: 'flex' }}
            title="Delete domain">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────
export default function Dashboard({ user, setPage, setScanDomain, setScanType }) {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [scanning, setScanning] = useState({})
  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { if (user) fetchDomains() }, [user])

  async function fetchDomains() {
    setLoading(true)
    const { data } = await supabase
      .from('domains')
      .select(`*, scan_results(health_score, score_dns, score_email, score_ssl, score_security, issues, scanned_at)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDomains(data || [])
    setLoading(false)
  }

  async function triggerScan(domain) {
    setScanning(s => ({ ...s, [domain.id]: true }))
    try {
      await supabase.functions.invoke('dns-scan', {
        body: { domain: domain.domain_name, scan_type: 'website', save_to_db: true, domain_id: domain.id }
      })
      await fetchDomains()
    } finally {
      setScanning(s => ({ ...s, [domain.id]: false }))
    }
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

  function viewScan(domain) {
    setScanDomain(domain.domain_name)
    setScanType('website')
    setPage('scan')
  }

  const unverified = domains.filter(d => !d.verified)
  const verified = domains.filter(d => d.verified)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

      {/* Sidebar */}
      <div style={{ width: 256, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--gray-200)' }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add domain
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 6 }}>
          {loading ? (
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
            </div>
          ) : domains.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Globe size={28} color="var(--gray-300)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>No domains yet</div>
            </div>
          ) : (
            <>
              {unverified.length > 0 && (
                <>
                  <div style={{ padding: '4px 12px 2px', fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending</div>
                  {unverified.map(d => <SidebarDomainRow key={d.id} domain={d} selected={selected} onClick={setSelected} onDelete={setDeleteTarget} />)}
                </>
              )}
              {verified.length > 0 && (
                <>
                  <div style={{ padding: '8px 12px 2px', fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monitored</div>
                  {verified.map(d => <SidebarDomainRow key={d.id} domain={d} selected={selected} onClick={setSelected} onDelete={setDeleteTarget} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--gray-50)' }}>
        {!selected ? (
          <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Domain overview</h2>
                <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{verified.length} monitored · {unverified.length} pending</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add domain</button>
            </div>

            {/* Metric cards */}
            {domains.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Total domains', val: domains.length, color: 'var(--gray-900)' },
                  { label: 'Avg health score', val: verified.length ? Math.round(verified.reduce((a, d) => a + (d.scan_results?.[0]?.health_score || 0), 0) / verified.length) || '–' : '–', color: 'var(--green)' },
                  { label: 'Active monitoring', val: verified.filter(d => !d.paused).length, color: 'var(--blue)' },
                  { label: 'Need attention', val: verified.filter(d => (d.scan_results?.[0]?.health_score ?? 100) < 70).length, color: 'var(--red)' },
                ].map(m => (
                  <div key={m.label} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Domain grid */}
            {verified.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
                {verified.map(d => (
                  <DomainCard key={d.id} domain={d} onClick={setSelected} onDelete={setDeleteTarget} onScan={triggerScan} scanning={scanning[d.id]} />
                ))}
              </div>
            )}

            {/* Pending verification */}
            {unverified.length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--gray-700)' }}>Pending verification</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {unverified.map(d => (
                    <div key={d.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <AlertTriangle size={18} color="var(--amber)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{d.domain_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                          Add TXT: <span className="mono">domainradar-verify={d.verify_token}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setSelected(d)}>Verify</button>
                        <button className="btn btn-sm" onClick={() => setDeleteTarget(d)}
                          style={{ background: 'var(--red-light)', color: 'var(--red-text)', border: 'none' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {domains.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <Shield size={48} color="var(--gray-200)" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Start monitoring your domains</div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 24 }}>Add your first domain and get a full DNS health report in seconds.</div>
                <button className="btn btn-primary btn-lg" onClick={() => setShowAdd(true)}><Plus size={15} /> Add your first domain</button>
              </div>
            )}
          </div>
        ) : (
          <DomainDetail
            domain={selected}
            onBack={() => setSelected(null)}
            onScan={triggerScan}
            scanning={scanning[selected.id]}
            onPause={togglePause}
            onDelete={d => setDeleteTarget(d)}
            onIntervalChange={updateInterval}
            onViewFull={viewScan}
          />
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddDomainModal user={user} onClose={() => setShowAdd(false)} onSuccess={fetchDomains} />}
      {deleteTarget && (
        <DeleteModal
          domain={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}

// ─── Domain Detail Panel ─────────────────────────────────────────────
function DomainDetail({ domain, onBack, onScan, scanning, onPause, onDelete, onIntervalChange, onViewFull }) {
  const latest = domain.scan_results?.[0]
  const issues = latest?.issues || []
  const critical = issues.filter(i => i.severity === 'critical')
  const warns = issues.filter(i => i.severity === 'warn')

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>{domain.domain_name}</h2>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
            {domain.verified ? `Verified · ${domain.monitor_interval} · ${domain.paused ? 'Paused' : 'Active'}` : 'Pending verification'}
            {latest ? ` · Scanned ${timeAgo(latest.scanned_at)}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {domain.verified && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onScan(domain)} disabled={scanning}>
                {scanning ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <RefreshCw size={12} />} Scan
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onPause(domain)}>
                {domain.paused ? <Play size={12} /> : <Pause size={12} />} {domain.paused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onViewFull(domain)}>
                <ExternalLink size={12} /> Full report
              </button>
            </>
          )}
          <button className="btn btn-sm" onClick={() => onDelete(domain)}
            style={{ background: 'var(--red-light)', color: 'var(--red-text)', border: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      {!domain.verified ? (
        <div style={{ background: '#fff', border: '1px solid var(--amber)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--amber)" /> Verify domain ownership
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 14 }}>Add this TXT record to your DNS to start monitoring.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div><div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>Type</div><div className="mono" style={{ padding: '6px 10px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12 }}>TXT</div></div>
            <div><div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>Host</div><div className="mono" style={{ padding: '6px 10px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12 }}>@ (root)</div></div>
          </div>
          <div><div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>Value</div>
            <div className="mono" style={{ padding: '8px 12px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 11, wordBreak: 'break-all' }}>
              domainradar-verify={domain.verify_token}
            </div>
          </div>
        </div>
      ) : latest ? (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <ScoreRing score={latest.health_score} size={72} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, alignContent: 'start' }}>
              {[
                { l: 'DNS', v: latest.score_dns }, { l: 'Email', v: latest.score_email },
                { l: 'SSL', v: latest.score_ssl }, { l: 'Security', v: latest.score_security },
              ].map(s => (
                <div key={s.l} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 2 }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: getScoreColor(s.v) }}>{s.v ?? '–'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monitor interval */}
          <div className="card" style={{ marginBottom: 10 }}>
            <div className="card-header"><span className="card-title"><Clock size={13} /> Monitor interval</span></div>
            <div style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
              {['1h', '6h', '24h', 'off'].map(iv => (
                <button key={iv} className={`btn btn-sm ${domain.monitor_interval === iv ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => onIntervalChange(domain.id, iv)}>
                  {iv === 'off' ? 'Off' : `Every ${iv}`}
                </button>
              ))}
            </div>
          </div>

          {/* Issues */}
          {issues.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title"><AlertTriangle size={13} /> Issues</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{critical.length} critical · {warns.length} warn</span>
              </div>
              {issues.map((iss, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--gray-50)' }}>
                  <span className={`pill ${iss.severity === 'critical' ? 'pill-fail' : iss.severity === 'warn' ? 'pill-warn' : 'pill-info'}`} style={{ flexShrink: 0, marginTop: 1 }}>
                    {iss.severity}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{iss.type}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-600)' }}>{iss.message}</div>
                    {iss.fix && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 3 }}>Fix: {iss.fix}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 14 }}>No scan data yet.</div>
          <button className="btn btn-primary" onClick={() => onScan(domain)}>Run first scan</button>
        </div>
      )}
    </div>
  )
}
