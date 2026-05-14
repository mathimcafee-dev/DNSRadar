import { useState, useEffect } from 'react'
import { Bell, Check, Trash2, Globe, Mail, Lock, AlertTriangle, Info, Calendar, Download, Clock, RefreshCw, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { timeAgo, formatDate, formatDateTime, getSeverityClass } from '../lib/scoreEngine'

/* ──────────────── ALERTS PAGE ──────────────── */
export function Alerts({ user }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchAlerts() }, [user])

  async function fetchAlerts() {
    setLoading(true)
    const { data } = await supabase.from('alerts')
      .select('*, domains(domain_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setAlerts(data || [])
    setLoading(false)
  }

  async function markAllRead() {
    await supabase.from('alerts').update({ read: true }).eq('user_id', user.id).eq('read', false)
    fetchAlerts()
  }

  async function markRead(id) {
    await supabase.from('alerts').update({ read: true }).eq('id', id)
    setAlerts(a => a.map(x => x.id === id ? { ...x, read: true } : x))
  }

  const filtered = filter === 'all' ? alerts : filter === 'unread' ? alerts.filter(a => !a.read) : alerts.filter(a => a.severity === filter)
  const unread = alerts.filter(a => !a.read).length

  const SevIcon = ({ sev }) => {
    if (sev === 'critical') return <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--red-light)', color: 'var(--red-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={14} /></div>
    if (sev === 'warn') return <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--amber-light)', color: 'var(--amber-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={14} /></div>
    return <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--blue-light)', color: 'var(--blue-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Info size={14} /></div>
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Alerts</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{unread} unread · {alerts.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '6px 10px' }}>
            <option value="all">All alerts</option>
            <option value="unread">Unread only</option>
            <option value="critical">Critical</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
          </select>
          {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}><Check size={12} /> Mark all read</button>}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <Bell size={40} color="var(--gray-200)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-400)' }}>No alerts</div>
          <div style={{ fontSize: 12, color: 'var(--gray-300)', marginTop: 4 }}>You'll be notified here when anything changes.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(a => (
            <div key={a.id} className="card"
              style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, opacity: a.read ? 0.65 : 1, cursor: a.read ? 'default' : 'pointer' }}
              onClick={() => !a.read && markRead(a.id)}>
              {!a.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: 6 }} />}
              {a.read && <div style={{ width: 7, flexShrink: 0 }} />}
              <SevIcon sev={a.severity} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{a.message || a.alert_type}</span>
                  <span className={`pill ${getSeverityClass(a.severity)}`}>{a.severity}</span>
                  {a.category && <span className="pill pill-gray">{a.category}</span>}
                </div>
                {(a.before_val || a.after_val) && (
                  <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>
                    {a.before_val && <span className="mono" style={{ background: 'var(--red-light)', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>– {a.before_val}</span>}
                    {a.after_val && <span className="mono" style={{ background: '#EAF3DE', padding: '1px 6px', borderRadius: 4 }}>+ {a.after_val}</span>}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--gray-400)', display: 'flex', gap: 10 }}>
                  <span className="mono">{a.domains?.domain_name}</span>
                  <span>{timeAgo(a.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────────────── REPORTS PAGE ──────────────── */
export function Reports({ user }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReports() }, [user])

  async function fetchReports() {
    setLoading(true)
    const { data } = await supabase.from('report_snapshots')
      .select('*').eq('user_id', user.id)
      .order('report_date', { ascending: false }).limit(30)
    setReports(data || [])
    setLoading(false)
  }

  function downloadReport(report) {
    const blob = new Blob([report.report_html || '<p>No content</p>'], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `DomainRadar-Report-${report.report_date}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Daily reports</h2>
        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>24-hour domain health reports sent every morning. Full history below.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 10 }} />)}
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <Calendar size={40} color="var(--gray-200)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-400)' }}>No reports yet</div>
          <div style={{ fontSize: 12, color: 'var(--gray-300)', marginTop: 4 }}>Your first report will arrive tomorrow morning at 07:00 UTC.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(r => (
            <div key={r.id} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: r.avg_score >= 70 ? 'var(--green)' : r.avg_score >= 50 ? 'var(--amber)' : 'var(--red)' }}>{r.avg_score}</div>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>avg score</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{formatDate(r.report_date)}</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--gray-500)' }}>
                      <span>{r.domain_count} domains</span>
                      {r.critical_count > 0 && <span style={{ color: 'var(--red-text)', fontWeight: 500 }}>· {r.critical_count} critical</span>}
                      <span>· {r.total_issues} issues</span>
                      {r.avg_score_delta !== 0 && r.avg_score_delta !== null && (
                        <span style={{ color: r.avg_score_delta > 0 ? 'var(--green)' : 'var(--red-text)' }}>
                          · {r.avg_score_delta > 0 ? '+' : ''}{r.avg_score_delta} vs prev
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 2 }}>Sent {r.sent_at ? formatDateTime(r.sent_at) : 'Not sent'}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => downloadReport(r)}>
                  <Download size={12} /> Download HTML
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ──────────────── SETTINGS PAGE ──────────────── */
export function Settings({ user }) {
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reportTime, setReportTime] = useState('07:00')
  const [alertEmail, setAlertEmail] = useState(true)
  const [webhookUrl, setWebhookUrl] = useState('')

  useEffect(() => { fetchProfile() }, [user])

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setReportTime(data.report_time || '07:00')
      setAlertEmail(data.alert_email ?? true)
      setWebhookUrl(data.alert_webhook || '')
    }
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: user.id, email: user.email,
      report_time: reportTime,
      alert_email: alertEmail,
      alert_webhook: webhookUrl || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Settings</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title">Account</span></div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{user.email}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title"><Clock size={13} /> Report schedule</span></div>
        <div style={{ padding: '14px 16px' }}>
          <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 6 }}>Daily report time (UTC)</label>
          <input type="time" value={reportTime} onChange={e => setReportTime(e.target.value)} style={{ width: 'auto', marginBottom: 8 }} />
          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>A 24-hour health report will be sent to {user.email} at this time daily.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><span className="card-title"><Bell size={13} /> Alert preferences</span></div>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Email alerts</div>
              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Instant email when DNS changes, DMARC weakens, or SSL nears expiry</div>
            </div>
            <div style={{
              width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative',
              background: alertEmail ? 'var(--green)' : 'var(--gray-300)', transition: 'background 0.2s',
            }} onClick={() => setAlertEmail(!alertEmail)}>
              <div style={{
                position: 'absolute', top: 3, left: alertEmail ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--gray-600)', display: 'block', marginBottom: 6 }}>Webhook URL (optional — Slack / Teams)</label>
            <input type="url" placeholder="https://hooks.slack.com/services/..." value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 5 }}>We'll POST a JSON payload to this URL when alerts fire.</div>
          </div>
        </div>
      </div>

      <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
        {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Saving…</> : saved ? <><Check size={13} /> Saved!</> : 'Save settings'}
      </button>
    </div>
  )
}
