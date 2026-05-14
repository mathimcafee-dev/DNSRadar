import { useState } from 'react'
import { Globe, Mail, Network, Shield, Bell, ChevronRight, Zap, BarChart2, CheckCircle, ArrowRight } from 'lucide-react'

export default function Landing({ setPage, setScanDomain, setScanType }) {
  const [websiteDomain, setWebsiteDomain] = useState('')
  const [emailDomain, setEmailDomain] = useState('')
  const [connDomain, setConnDomain] = useState('')
  const [loading, setLoading] = useState(null)

  function startScan(domain, type) {
    const d = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase().trim()
    if (!d || !d.includes('.')) return
    setLoading(type)
    setScanDomain(d)
    setScanType(type)
    setTimeout(() => { setPage('scan'); setLoading(null) }, 200)
  }

  const features = [
    { icon: Globe, color: '#0F6E56', bg: '#EAF3DE', title: 'Full DNS scan', desc: 'A, AAAA, MX, NS, TXT, CNAME, SOA, CAA, PTR, SRV — every record type, validated and scored.' },
    { icon: Mail, color: '#185FA5', bg: '#E6F1FB', title: 'Email auth deep scan', desc: 'SPF flattening, DKIM key validation, DMARC policy, BIMI, MTA-STS and TLS-RPT analysis.' },
    { icon: Shield, color: '#534AB7', bg: '#EEEDFE', title: 'Security checks', desc: 'DNSSEC validation, zone transfer exposure, CAA record presence, open resolver detection.' },
    { icon: Network, color: '#854F0B', bg: '#FAEEDA', title: 'Global propagation', desc: 'Check DNS propagation across 4 global resolver regions. Spot inconsistencies instantly.' },
    { icon: Bell, color: '#A32D2D', bg: '#FCEBEB', title: 'Continuous monitoring', desc: 'Add a TXT record once. Get email alerts the moment anything changes — 1h, 6h or 24h intervals.' },
    { icon: BarChart2, color: '#085041', bg: '#E1F5EE', title: 'Daily reports', desc: 'Receive a 24-hour health report every morning. Score trends, issues found, fix suggestions.' },
  ]

  return (
    <div>
      {/* Hero */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '64px 24px 48px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 500, padding: '4px 14px',
          borderRadius: 20, background: '#EAF3DE', color: 'var(--green-text)',
          border: '1px solid var(--green-mid)', marginBottom: 20,
        }}>
          <Shield size={12} /> Built by a certified PKI specialist · Free during beta
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.2, marginBottom: 16, maxWidth: 580, margin: '0 auto 16px' }}>
          The complete DNS scanner<br />
          <span style={{ color: 'var(--green)' }}>your domain deserves</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--gray-600)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
          SPF · DKIM · DMARC · BIMI · MTA-STS · SSL · Propagation · Blacklists — one scan, full picture, instant alerts when anything changes.
        </p>

        {/* 3 Test Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, maxWidth: 760, margin: '0 auto 32px' }}>
          {/* Website card */}
          <div className="card" style={{ textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
            <div style={{ height: 3, background: '#0F6E56', position: 'absolute', top: 0, left: 0, right: 0 }} />
            <div className="card-body" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, background: '#EAF3DE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} color="#0F6E56" />
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Test your website</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4, lineHeight: 1.5 }}>DNS records, SSL chain, propagation, DNSSEC, CAA and blacklists.</div>
              <div style={{ fontSize: 11, color: 'var(--green)', cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 3 }}>
                what we check <ChevronRight size={11} />
              </div>
              {['All DNS record types', 'SSL / TLS expiry', 'Global propagation', '50+ blacklists'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gray-600)', marginBottom: 3 }}>
                  <CheckCircle size={11} color="#0F6E56" /> {t}
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 500, display: 'block', marginBottom: 5 }}>Your domain</label>
                <input type="text" placeholder="yourdomain.com" value={websiteDomain}
                  onChange={e => setWebsiteDomain(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startScan(websiteDomain, 'website')}
                  style={{ marginBottom: 10, fontSize: 12 }} />
                <button className="btn btn-primary" style={{ width: '100%', background: '#0F6E56', justifyContent: 'center' }}
                  onClick={() => startScan(websiteDomain, 'website')}
                  disabled={loading === 'website' || !websiteDomain}>
                  {loading === 'website' ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Scanning…</> : <><Zap size={13} /> Start scan</>}
                </button>
              </div>
            </div>
          </div>

          {/* Email card */}
          <div className="card" style={{ textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
            <div style={{ height: 3, background: '#185FA5', position: 'absolute', top: 0, left: 0, right: 0 }} />
            <div className="card-body" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, background: '#E6F1FB', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={18} color="#185FA5" />
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Test your email</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4, lineHeight: 1.5 }}>SPF, DKIM, DMARC, BIMI, MTA-STS, TLS-RPT — full email auth.</div>
              <div style={{ fontSize: 11, color: '#185FA5', cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 3 }}>
                what we check <ChevronRight size={11} />
              </div>
              {['SPF lookup depth', 'DKIM key validation', 'DMARC policy + alignment', 'BIMI + VMC detection'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gray-600)', marginBottom: 3 }}>
                  <CheckCircle size={11} color="#185FA5" /> {t}
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 500, display: 'block', marginBottom: 5 }}>Your domain</label>
                <input type="text" placeholder="yourdomain.com" value={emailDomain}
                  onChange={e => setEmailDomain(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startScan(emailDomain, 'email')}
                  style={{ marginBottom: 10, fontSize: 12 }} />
                <button className="btn" style={{ width: '100%', background: '#185FA5', color: '#fff', justifyContent: 'center', border: 'none' }}
                  onClick={() => startScan(emailDomain, 'email')}
                  disabled={loading === 'email' || !emailDomain}>
                  {loading === 'email' ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Scanning…</> : <><Zap size={13} /> Start scan</>}
                </button>
              </div>
            </div>
          </div>

          {/* Connection card */}
          <div className="card" style={{ textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
            <div style={{ height: 3, background: '#534AB7', position: 'absolute', top: 0, left: 0, right: 0 }} />
            <div className="card-body" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, background: '#EEEDFE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Network size={18} color="#534AB7" />
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Test your connection</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 4, lineHeight: 1.5 }}>IPv6, DNSSEC, zone transfer exposure and open resolver check.</div>
              <div style={{ fontSize: 11, color: '#534AB7', cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 3 }}>
                what we check <ChevronRight size={11} />
              </div>
              {['IPv4 + IPv6 reachability', 'DNSSEC chain validation', 'Zone transfer (AXFR)', 'Open resolver check'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--gray-600)', marginBottom: 3 }}>
                  <CheckCircle size={11} color="#534AB7" /> {t}
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 500, display: 'block', marginBottom: 5 }}>Your domain</label>
                <input type="text" placeholder="yourdomain.com" value={connDomain}
                  onChange={e => setConnDomain(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startScan(connDomain, 'connection')}
                  style={{ marginBottom: 10, fontSize: 12 }} />
                <button className="btn" style={{ width: '100%', background: '#534AB7', color: '#fff', justifyContent: 'center', border: 'none' }}
                  onClick={() => startScan(connDomain, 'connection')}
                  disabled={loading === 'connection' || !connDomain}>
                  {loading === 'connection' ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Scanning…</> : <><Zap size={13} /> Start scan</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          {['No account for first scan', 'Free during beta', 'Results in under 10 seconds', 'Built by a PKI specialist'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--gray-500)' }}>
              <CheckCircle size={13} color="#0F6E56" /> {t}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#fff', borderBottom: '1px solid var(--gray-200)' }}>
        {[
          { num: '50+', label: 'Blacklists checked' },
          { num: '12', label: 'Check categories' },
          { num: '4', label: 'Global resolver regions' },
          { num: '<10s', label: 'Full scan time' },
        ].map(s => (
          <div key={s.label} style={{ padding: '20px', textAlign: 'center', borderRight: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>{s.num}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Everything your domain needs</h2>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>One tool. Every DNS check. Continuous monitoring.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{ padding: '20px' }}>
              <div style={{ width: 36, height: 36, background: f.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <f.icon size={18} color={f.color} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ background: 'var(--green)', padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          Start monitoring your domains today
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>
          Free during beta. Add a TXT record once. We handle everything else.
        </p>
        <button className="btn btn-lg" onClick={() => setPage('auth')}
          style={{ background: '#fff', color: 'var(--green)', fontWeight: 600, border: 'none' }}>
          Create free account <ArrowRight size={16} />
        </button>
      </div>

      {/* Footer */}
      <div style={{ background: 'var(--gray-900)', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>
          Built by a Certified PKI Specialist · Partner Account Manager at DigiCert
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <span key={l} style={{ fontSize: 12, color: 'var(--gray-400)', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
