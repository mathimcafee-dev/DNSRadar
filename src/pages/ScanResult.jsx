import { useState, useEffect } from 'react'
import { ArrowLeft, RefreshCw, Bell, Download, Globe, Mail, Lock, Network, Shield, Ban, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ScoreRing from '../components/ScoreRing'
import CheckRow from '../components/CheckRow'
import { getPillClass, getScoreColor, formatTTL, expiryPill, getDaysUntilExpiry } from '../lib/scoreEngine'

function SectionCard({ icon: Icon, title, status, statusClass, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <span className="card-title">
          <Icon size={14} color="var(--gray-600)" />
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status && <span className={`pill ${statusClass}`}>{status}</span>}
          {open ? <ChevronUp size={14} color="var(--gray-400)" /> : <ChevronDown size={14} color="var(--gray-400)" />}
        </div>
      </div>
      {open && <div>{children}</div>}
    </div>
  )
}

function SpfMeter({ count }) {
  const pct = Math.min((count / 10) * 100, 100)
  const color = pct >= 80 ? '#854F0B' : pct >= 60 ? '#3B6D11' : 'var(--green)'
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gray-500)', marginBottom: 3 }}>
        <span>DNS lookup count</span>
        <span style={{ fontWeight: 500, color }}>{count} / 10</span>
      </div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function ScanResult({ domain, scanType, setPage, user }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('dns')

  useEffect(() => {
    if (domain) runScan()
  }, [domain])

  async function runScan() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data, error: err } = await supabase.functions.invoke('dns-scan', {
        body: { domain, scan_type: scanType || 'website', save_to_db: false }
      })
      if (err) throw new Error(err.message)
      if (data?.error) throw new Error(data.error)
      setResult(data)
    } catch (e) {
      setError(e.message || 'Scan failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '3px solid var(--gray-200)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 14, color: 'var(--gray-600)' }}>Scanning {domain}…</div>
      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>Checking DNS, email auth, SSL, propagation and blacklists</div>
    </div>
  )

  if (error) return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Scan failed</div>
      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24 }}>{error}</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn btn-outline" onClick={() => setPage('landing')}><ArrowLeft size={13} /> Back</button>
        <button className="btn btn-primary" onClick={runScan}><RefreshCw size={13} /> Try again</button>
      </div>
    </div>
  )

  if (!result) return null
  const r = result
  const cats = [
    { id: 'dns', label: 'DNS', icon: Globe, score: r.score_dns },
    { id: 'email', label: 'Email auth', icon: Mail, score: r.score_email },
    { id: 'ssl', label: 'SSL / TLS', icon: Lock, score: r.score_ssl },
    { id: 'propagation', label: 'Propagation', icon: Network, score: r.score_propagation },
    { id: 'security', label: 'Security', icon: Shield, score: r.score_security },
    { id: 'blacklist', label: 'Blacklists', icon: Ban, score: r.score_blacklist },
  ]

  return (
    <div>
      {/* Results header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage('landing')}><ArrowLeft size={13} /> Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 20 }}>
            <Globe size={12} color="var(--green)" />
            <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{domain}</span>
          </div>
          <span style={{ fontSize:12, color: 'var(--gray-400)' }}>Scanned just now</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={runScan}><RefreshCw size={12} /> Re-scan</button>
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={() => setPage('dashboard')}>
              <Bell size={12} /> Monitor this domain
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setPage('auth')}>
              <Bell size={12} /> Monitor — sign up free
            </button>
          )}
        </div>
      </div>

      {/* Score hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <ScoreRing score={r.health_score} size={96} />
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 12 }}>Score breakdown</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {cats.map(c => (
                <div key={c.id} style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }} onClick={() => setActiveSection(c.id)}>
                  <div style={{ fontSize: 10, color: 'var(--gray-500)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <c.icon size={10} /> {c.label}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: getScoreColor(c.score) }}>{c.score ?? '–'}</div>
                  <div style={{ height: 3, background: 'var(--gray-200)', borderRadius: 2, marginTop: 4 }}>
                    <div style={{ height: 3, borderRadius: 2, width: `${c.score ?? 0}%`, background: getScoreColor(c.score), transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Issues summary */}
        {r.issues?.length > 0 && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 10, border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8, color: 'var(--gray-700)' }}>Issues found ({r.issues.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {r.issues.slice(0, 5).map((iss, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                  <span className={`pill ${iss.severity === 'critical' ? 'pill-fail' : iss.severity === 'warn' ? 'pill-warn' : 'pill-info'}`} style={{ flexShrink: 0 }}>
                    {iss.severity}
                  </span>
                  <span style={{ color: 'var(--gray-600)' }}>{iss.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail panels */}
      <div style={{ padding: '20px 24px', maxWidth: 900, margin: '0 auto' }}>
        {/* DNS Records */}
        <SectionCard icon={Globe} title="DNS records" status={`${r.dns_records?.length || 0} records`} statusClass="pill-pass">
          {r.dns_records?.map((rec, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 60px 1fr 80px', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--gray-50)', alignItems: 'start', fontSize: 12 }}>
              <span className="mono" style={{ fontWeight: 500, color: 'var(--gray-800)' }}>{rec.type}</span>
              <span style={{ color: 'var(--gray-400)' }}>{formatTTL(rec.ttl)}</span>
              <span className="mono" style={{ fontSize:12, color: 'var(--gray-600)', wordBreak: 'break-all' }}>{rec.value}</span>
              <span className={`pill ${getPillClass(rec.status)}`} style={{ justifySelf: 'end' }}>{rec.status || 'Present'}</span>
            </div>
          ))}
        </SectionCard>

        {/* Email Auth */}
        <SectionCard icon={Mail} title="Email authentication"
          status={r.email_auth?.issues > 0 ? `${r.email_auth?.issues} issues` : 'All passing'}
          statusClass={r.email_auth?.issues > 0 ? 'pill-warn' : 'pill-pass'}>
          <CheckRow name="SPF" status={r.email_auth?.spf_status}
            value={r.email_auth?.spf_raw}
            note={r.email_auth?.spf_lookups !== undefined ? `DNS lookup count: ${r.email_auth.spf_lookups}/10` : null}
            extra={r.email_auth?.spf_lookups !== undefined ? <SpfMeter count={r.email_auth.spf_lookups} /> : null}
            fix={r.email_auth?.spf_lookups >= 8 ? 'SPF lookup count approaching RFC 7208 limit of 10. Consider SPF flattening.' : null} />
          <CheckRow name="DKIM" status={r.email_auth?.dkim_status}
            value={r.email_auth?.dkim_selector ? `selector: ${r.email_auth.dkim_selector} · ${r.email_auth.dkim_key_size || '?'}-bit` : null}
            note={r.email_auth?.dkim_note} />
          <CheckRow name="DMARC" status={r.email_auth?.dmarc_status}
            value={r.email_auth?.dmarc_raw}
            fix={r.email_auth?.dmarc_fix}
            suggestion={r.email_auth?.dmarc_suggestion} />
          <CheckRow name="BIMI" status={r.email_auth?.bimi_status || 'Missing'}
            value={r.email_auth?.bimi_raw}
            note={r.email_auth?.bimi_note} />
          <CheckRow name="MTA-STS" status={r.email_auth?.mta_sts_status || 'Not configured'}
            value={r.email_auth?.mta_sts_raw}
            note="TLS required for all inbound mail when enforced." />
          <CheckRow name="TLS-RPT" status={r.email_auth?.tls_rpt_status || 'Not configured'}
            value={r.email_auth?.tls_rpt_raw} />
        </SectionCard>

        {/* SSL / TLS */}
        <SectionCard icon={Lock} title="SSL / TLS certificates"
          status={r.ssl_info?.overall_status} statusClass={getPillClass(r.ssl_info?.overall_status)}>
          {r.ssl_info?.certs?.map((cert, i) => {
            const days = getDaysUntilExpiry(cert.expires_at)
            const ep = expiryPill(days)
            return (
              <CheckRow key={i} name={cert.domain}
                status={ep.label} /* override */
                value={`${cert.issuer} · ${cert.protocol || 'TLS'} · ${cert.key_size || '?'}-bit`}
                note={`Chain: ${cert.chain_valid ? 'Valid' : 'Invalid'} · CT log: ${cert.ct_log ? 'Verified' : 'Not found'}`}
                extra={<span className={`pill ${ep.cls}`}>{ep.label}</span>}
              />
            )
          })}
        </SectionCard>

        {/* Propagation */}
        <SectionCard icon={Network} title="DNS propagation — global resolvers"
          status={r.propagation?.consistent ? 'Consistent' : 'Inconsistencies found'}
          statusClass={r.propagation?.consistent ? 'pill-pass' : 'pill-warn'}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>US (Cloudflare)</th>
                  <th>EU (Google)</th>
                  <th>APAC (OpenDNS)</th>
                  <th>AU (Quad9)</th>
                </tr>
              </thead>
              <tbody>
                {r.propagation?.records?.map((rec, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontWeight: 500 }}>{rec.type}</td>
                    {['us', 'eu', 'apac', 'au'].map(region => (
                      <td key={region}>
                        <span className={`pill ${rec[region] === 'pass' ? 'pill-pass' : rec[region] === 'warn' ? 'pill-warn' : 'pill-gray'}`}>
                          {rec[region] === 'pass' ? '✓' : rec[region] === 'warn' ? '!' : '–'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard icon={Shield} title="Security checks"
          status={r.security?.overall} statusClass={getPillClass(r.security?.overall)}>
          <CheckRow name="DNSSEC" status={r.security?.dnssec_status}
            value={r.security?.dnssec_algorithm} note="Validates DNS response integrity." />
          <CheckRow name="Zone transfer (AXFR)" status={r.security?.axfr_status}
            note="Nameservers should refuse unauthorized zone transfers." />
          <CheckRow name="CAA record" status={r.security?.caa_status}
            value={r.security?.caa_value} note="Restricts which CAs can issue SSL certificates for your domain." />
          <CheckRow name="Open resolver" status={r.security?.open_resolver_status}
            note="Your nameserver should not act as a public open resolver." />
        </SectionCard>

        {/* Blacklists */}
        <SectionCard icon={Ban} title="Blacklist reputation check"
          status={r.blacklists?.listed_count > 0 ? `Listed on ${r.blacklists.listed_count}` : `Clean — 0 listings`}
          statusClass={r.blacklists?.listed_count > 0 ? 'pill-fail' : 'pill-pass'}>
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
            {r.blacklists?.results?.map((bl, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'var(--gray-50)', borderRadius: 6, fontSize: 11 }}>
                <span className="mono" style={{ color: 'var(--gray-700)' }}>{bl.name}</span>
                <span className={`pill ${bl.listed ? 'pill-fail' : 'pill-pass'}`}>{bl.listed ? 'Listed' : 'Clean'}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* CTA if not logged in */}
        {!user && (
          <div style={{ textAlign: 'center', padding: '32px 24px', background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 16, marginTop: 8 }}>
            <Bell size={28} color="var(--green)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Monitor {domain} continuously</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
              Get instant alerts when DNS records change, DMARC policy weakens, or SSL certificates near expiry. Free during beta.
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setPage('auth')}>
              <Bell size={15} /> Start monitoring — free
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
