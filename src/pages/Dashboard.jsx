import { useState, useEffect } from 'react'
import { Plus, Globe, AlertTriangle, CheckCircle, Clock, Pause, Play, Trash2, RefreshCw, ExternalLink, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddDomainModal from '../components/AddDomainModal'
import ScoreRing from '../components/ScoreRing'
import { timeAgo, getScoreColor, getScoreBg } from '../lib/scoreEngine'

export default function Dashboard({ user, setPage, setScanDomain, setScanType }) {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [scanning, setScanning] = useState({})
  const [selected, setSelected] = useState(null)

  useEffect(() => { if (user) fetchDomains() }, [user])

  async function fetchDomains() {
    setLoading(true)
    const { data } = await supabase
      .from('domains')
      .select(`*, scan_results(health_score, score_dns, score_email, score_ssl, score_security, issues, scanned_at, id)`)
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

  async function togglePause(domain) {
    await supabase.from('domains').update({ paused: !domain.paused }).eq('id', domain.id)
    fetchDomains()
  }

  async function deleteDomain(domain) {
    if (!confirm(`Delete ${domain.domain_name}? This cannot be undone.`)) return
    await supabase.from('domains').delete().eq('id', domain.id)
    fetchDomains()
    if (selected?.id === domain.id) setSelected(null)
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
      <div style={{ width: 280, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--gray-200)' }}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add domain
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
            </div>
          ) : domains.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Globe size={32} color="var(--gray-300)" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>No domains yet</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Add your first domain to start monitoring</div>
            </div>
          ) : (
            <>
              {unverified.length > 0 && (
                <div>
                  <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 500, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Pending verification
                  </div>
                  {unverified.map(d => (
                    <div key={d.id}
                      onClick={() => setSelected(d)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                        cursor: 'pointer', borderRadius: 0,
                        background: selected?.id === d.id ? 'var(--gray-50)' : 'transparent',
                      }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{d.domain_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>Verify TXT record</div>
                      </div>
                      <AlertTriangle size={12} color="var(--amber)" />
                    </div>
                  ))}
                </div>
              )}
              {verified.length > 0 && (
                <div>
                  <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 500, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Monitored domains
                  </div>
                  {verified.map(d => {
                    const latest = d.scan_results?.[0]
                    const score = latest?.health_score
                    const issues = latest?.issues?.length || 0
                    return (
                      <div key={d.id}
                        onClick={() => setSelected(d)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
                          cursor: 'pointer',
                          background: selected?.id === d.id ? '#EAF3DE' : 'transparent',
                          borderLeft: selected?.id === d.id ? '3px solid var(--green)' : '3px solid transparent',
                        }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.paused ? 'var(--gray-300)' : getScoreColor(score), flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{d.domain_name}</div>
                          <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                            {d.paused ? 'Paused' : d.monitor_interval + ' monitoring'} {issues > 0 ? `· ${issues} issues` : ''}
                          </div>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: getScoreColor(score), flexShrink: 0 }}>{score ?? '–'}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--gray-50)' }}>
        {!selected ? (
          /* Overview */
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Domain overview</h2>
              <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{verified.length} monitored · {unverified.length} pending verification</p>
            </div>
            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Total domains', val: domains.length, color: 'var(--gray-900)' },
                { label: 'Avg health score', val: verified.length ? Math.round(verified.reduce((a, d) => a + (d.scan_results?.[0]?.health_score || 0), 0) / verified.length) : '–', color: 'var(--green)' },
                { label: 'Active monitoring', val: verified.filter(d => !d.paused).length, color: 'var(--blue)' },
                { label: 'Need attention', val: verified.filter(d => (d.scan_results?.[0]?.health_score || 100) < 70).length, color: 'var(--red)' },
              ].map(m => (
                <div key={m.label} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>

            {/* Domain cards grid */}
            {verified.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {verified.map(d => {
                  const latest = d.scan_results?.[0]
                  const issues = latest?.issues || []
                  return (
                    <div key={d.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelected(d)}>
                      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <ScoreRing score={latest?.health_score} size={64} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="truncate" style={{ fontSize: 14, fontWeight: 600 }}>{d.domain_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                            {latest ? `Scanned ${timeAgo(latest.scanned_at)}` : 'Not scanned yet'}
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                            {issues.filter(i => i.severity === 'critical').length > 0 && (
                              <span className="pill pill-fail">{issues.filter(i => i.severity === 'critical').length} critical</span>
                            )}
                            {issues.filter(i => i.severity === 'warn').length > 0 && (
                              <span className="pill pill-warn">{issues.filter(i => i.severity === 'warn').length} warnings</span>
                            )}
                            {issues.length === 0 && latest && <span className="pill pill-pass">All passing</span>}
                            <span className="pill pill-gray">{d.monitor_interval}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {unverified.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Pending verification</h3>
                {unverified.map(d => (
                  <div key={d.id} className="card" style={{ marginBottom: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <AlertTriangle size={20} color="var(--amber)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{d.domain_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                        Add TXT record: <span className="mono">domainradar-verify={d.verify_token}</span>
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelected(d)}>Verify now</button>
                  </div>
                ))}
              </div>
            )}

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
          /* Domain detail */
          <DomainDetail domain={selected} onBack={() => setSelected(null)} onScan={triggerScan} scanning={scanning[selected.id]} onPause={togglePause} onDelete={deleteDomain} onIntervalChange={updateInterval} onViewFull={viewScan} />
        )}
      </div>

      {showAdd && <AddDomainModal user={user} onClose={() => setShowAdd(false)} onSuccess={fetchDomains} />}
    </div>
  )
}

function DomainDetail({ domain, onBack, onScan, scanning, onPause, onDelete, onIntervalChange, onViewFull }) {
  const latest = domain.scan_results?.[0]
  const issues = latest?.issues || []
  const critical = issues.filter(i => i.severity === 'critical')
  const warns = issues.filter(i => i.severity === 'warn')

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>{domain.domain_name}</h2>
          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            {domain.verified ? `Verified · ${domain.monitor_interval} monitoring · ${domain.paused ? 'Paused' : 'Active'}` : 'Pending verification'}
            {latest ? ` · Last scanned ${timeAgo(latest.scanned_at)}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {domain.verified && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => onScan(domain)} disabled={scanning}>
                {scanning ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <RefreshCw size={12} />} Scan now
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onPause(domain)}>
                {domain.paused ? <Play size={12} /> : <Pause size={12} />}
                {domain.paused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onViewFull(domain)}>
                <ExternalLink size={12} /> Full report
              </button>
            </>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(domain)}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>

      {!domain.verified ? (
        <div style={{ background: '#fff', border: '1px solid var(--amber)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--amber)" /> Verify domain ownership
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.6 }}>
            Add this TXT record to your DNS provider to verify ownership and start monitoring.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
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
          <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
            <ScoreRing score={latest.health_score} size={80} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, alignContent: 'start' }}>
              {[
                { l: 'DNS', v: latest.score_dns }, { l: 'Email auth', v: latest.score_email },
                { l: 'SSL / TLS', v: latest.score_ssl }, { l: 'Security', v: latest.score_security },
              ].map(s => (
                <div key={s.l} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 2 }}>{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: getScoreColor(s.v) }}>{s.v ?? '–'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monitor interval */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-header"><span className="card-title"><Clock size={13} /> Monitor interval</span></div>
            <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
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
                <span className="card-title"><AlertTriangle size={13} /> Issues found</span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{critical.length} critical · {warns.length} warnings</span>
              </div>
              {issues.map((iss, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 16px', borderBottom: '1px solid var(--gray-50)' }}>
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
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>No scan results yet.</div>
          <button className="btn btn-primary" onClick={() => onScan(domain)}>Run first scan</button>
        </div>
      )}
    </div>
  )
}
