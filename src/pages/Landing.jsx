import { useState, useEffect, useRef } from 'react'
import { Shield, Zap, Bell, BarChart2, Globe, Mail, Network, CheckCircle, ArrowRight, ChevronRight, Lock, Search, RefreshCw, Star } from 'lucide-react'

// ─── Animated scan demo ───────────────────────────────────────────────
function ScanDemo() {
  const checks = [
    { label: 'SPF record', status: 'pass', val: 'v=spf1 include:_spf.google.com ~all' },
    { label: 'DKIM (google)', status: 'pass', val: '2048-bit RSA key · valid signature' },
    { label: 'DMARC policy', status: 'warn', val: 'p=quarantine — upgrade to p=reject' },
    { label: 'SSL certificate', status: 'pass', val: 'TLS 1.3 · expires in 182 days' },
    { label: 'DNSSEC', status: 'fail', val: 'Not signed — enable at registrar' },
    { label: 'Blacklists (50+)', status: 'pass', val: 'Clean on all lists' },
    { label: 'Propagation', status: 'pass', val: '4 global resolvers · consistent' },
    { label: 'CAA record', status: 'fail', val: 'Missing — any CA can issue certs' },
  ]
  const [visible, setVisible] = useState(0)
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    if (!scanning) return
    const t = setInterval(() => {
      setVisible(v => {
        if (v >= checks.length) { setScanning(false); return v }
        return v + 1
      })
    }, 420)
    return () => clearInterval(t)
  }, [scanning])

  const score = 71

  const statusColors = { pass: '#00e5a0', warn: '#ffb224', fail: '#ff4d6a' }
  const statusBg = { pass: 'rgba(16,185,129,0.1)', warn: 'rgba(245,158,11,0.1)', fail: 'rgba(239,68,68,0.1)' }
  const statusLabel = { pass: 'PASS', warn: 'WARN', fail: 'FAIL' }

  return (
    <div style={{
      background: '#0a0d12', border: '1px solid #1e2535',
      borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 480,
      boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      {/* Window chrome */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2535', display: 'flex', alignItems: 'center', gap: 10, background: '#161b23' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontFamily: 'monospace', color: '#8993ac' }}>
          <Globe size={11} color="rgba(255,255,255,0.3)" />
          digicert.com — DomainRadar scan
        </div>
      </div>

      {/* Score header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2535', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
          <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="28" cy="28" r="22" fill="rgba(16,185,129,0.1)" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <circle cx="28" cy="28" r="22" fill="none" stroke="#10b981" strokeWidth="4"
              strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - score/100)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#00e5a0', fontFamily: 'monospace' }}>{score}</div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>digicert.com</div>
          <div style={{ fontSize: 11, color: '#8993ac' }}>Health score · {checks.filter((_,i) => i < visible && checks[i].status === 'fail').length} critical issues</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {[{c:'#00e5a0',l:'Pass'},{c:'#ffb224',l:'Warn'},{c:'#ff4d6a',l:'Fail'}].map(s => (
              <span key={s.l} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: `${s.c}18`, color: s.c, fontWeight: 500 }}>{s.l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Check rows */}
      <div style={{ padding: '8px 0' }}>
        {checks.map((c, i) => (
          <div key={c.label} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 20px',
            opacity: i < visible ? 1 : 0,
            transform: i < visible ? 'translateX(0)' : 'translateX(-6px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: statusBg[c.status], color: statusColors[c.status], fontFamily: 'monospace', flexShrink: 0, letterSpacing: '0.04em' }}>
              {statusLabel[c.status]}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, width: 120, flexShrink: 0 }}>{c.label}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.val}</span>
          </div>
        ))}
        {scanning && visible < checks.length && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px' }}>
            <div style={{ width: 30, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1s ease infinite' }} />
            <div style={{ width: 80, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1s ease infinite' }} />
            <div style={{ width: 120, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1s ease infinite' }} />
          </div>
        )}
      </div>

      {!scanning && (
        <div style={{ padding: '10px 20px 16px' }}>
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '9px 12px', fontSize: 11, color: '#8993ac', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={12} color="#10b981" />
            Scan complete · 8 checks · 2 issues found · 6 passing
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Stat counter ─────────────────────────────────────────────────────
function StatNumber({ end, suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      observer.disconnect()
      const start = Date.now()
      const tick = () => {
        const elapsed = Date.now() - start
        const progress = Math.min(elapsed / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(ease * end))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Main Landing ─────────────────────────────────────────────────────
export default function Landing({ setPage, setScanDomain, setScanType }) {
  const [domain, setDomain] = useState('')
  const [scanLoading, setScanLoading] = useState(false)

  function startScan(type = 'website') {
    const d = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase().trim()
    if (!d || !d.includes('.')) return
    setScanLoading(true)
    setScanDomain(d)
    setScanType(type)
    setTimeout(() => { setPage('scan'); setScanLoading(false) }, 150)
  }

  const features = [
    { icon: Mail, color: '#6366f1', title: 'Email authentication', items: ['SPF with lookup depth analysis', 'DKIM key validation (2048-bit check)', 'DMARC policy enforcement audit', 'BIMI + VMC detection', 'MTA-STS & TLS-RPT'] },
    { icon: Shield, color: '#00e5a0', title: 'Security & trust', items: ['DNSSEC chain validation', 'CAA record audit', 'Zone transfer exposure (AXFR)', 'Open resolver detection', 'SSL/TLS chain & expiry'] },
    { icon: Globe, color: '#ffb224', title: 'DNS intelligence', items: ['All 10 record types (A to SRV)', 'Global propagation — 4 regions', 'TTL analysis & consistency', '50+ DNSBL blacklist checks', 'SOA & NS health validation'] },
    { icon: Bell, color: '#ff4d6a', title: 'Continuous monitoring', items: ['1h / 6h / 24h scan intervals', 'Instant change alerts via email', 'Slack & Teams webhook support', 'DMARC policy downgrade alerts', 'SSL expiry countdown alerts'] },
  ]

  const checklist = [
    'SPF · DKIM · DMARC · BIMI · MTA-STS',
    'SSL/TLS chain, protocol, expiry',
    'DNSSEC validation',
    'Global propagation (4 resolvers)',
    'Blacklists — 50+ DNSBL lists',
    'CAA record & zone transfer',
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif", background: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .fade-up { animation: fadeUp 0.7s ease both }
        .fade-up-1 { animation-delay: 0.1s }
        .fade-up-2 { animation-delay: 0.2s }
        .fade-up-3 { animation-delay: 0.3s }
        .fade-up-4 { animation-delay: 0.4s }
        .scan-input { transition: border-color 0.2s, box-shadow 0.2s }
        .scan-input:focus { border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; outline: none }
        .hover-card { transition: transform 0.2s, box-shadow 0.2s }
        .hover-card:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.08) }
        .cta-btn { transition: all 0.2s }
        .cta-btn:hover { background: #059669 !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.3) }
        .ghost-btn { transition: all 0.15s }
        .ghost-btn:hover { background: rgba(255,255,255,0.08) !important }
        .check-item { display:flex; align-items:center; gap:8px; font-size:13px; color:rgba(255,255,255,0.75); margin-bottom:8px }
      `}</style>

      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 60,
        background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e2535',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo(0,0)}>
          <div style={{ width: 28, height: 28, background: '#00e5a0', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>DomainRadar</span>
          <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#00e5a0', padding: '1px 7px', borderRadius: 10, fontWeight: 600, border: '1px solid rgba(16,185,129,0.25)' }}>BETA</span>
        </div>
        {/* Nav buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setPage('auth')}
            style={{ padding: '7px 18px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Sign in
          </button>
          <button onClick={() => setPage('auth')}
            style={{ padding: '7px 18px', background: '#00e5a0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Start free
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1a14 50%, #0a1628 100%)',
        padding: '140px 24px 100px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: -100, left: '20%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
          {/* Badge */}
          <div className="fade-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 24,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
              fontSize: 12, fontWeight: 500, color: '#00e5a0',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5a0', animation: 'pulse 2s ease infinite' }} />
              Built by a Certified PKI Specialist · Free during beta
            </div>
          </div>

          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 className="fade-up fade-up-1" style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontWeight: 400, lineHeight: 1.12, color: '#fff', marginBottom: 0,
              letterSpacing: '-0.02em',
            }}>
              Complete DNS intelligence<br />
              <span style={{ color: '#00e5a0' }}>for your entire domain fleet</span>
            </h1>
          </div>

          <p className="fade-up fade-up-2" style={{
            textAlign: 'center', fontSize: 17, color: 'rgba(255,255,255,0.55)',
            maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.7,
          }}>
            SPF · DKIM · DMARC · BIMI · SSL · DNSSEC · Propagation · Blacklists —
            one scan, full picture, instant alerts the moment anything changes.
          </p>

          {/* Scan input */}
          <div className="fade-up fade-up-3" style={{ maxWidth: 560, margin: '0 auto 56px' }}>
            <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5470' }} />
                <input
                  className="scan-input"
                  type="text" placeholder="Enter your domain — e.g. company.com"
                  value={domain} onChange={e => setDomain(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && startScan()}
                  style={{
                    width: '100%', padding: '11px 12px 11px 36px',
                    background: 'transparent', border: '1px solid #1e2535',
                    borderRadius: 8, fontSize: 14, color: '#fff', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }} />
              </div>
              <button className="cta-btn" onClick={() => startScan()} disabled={scanLoading || !domain}
                style={{
                  padding: '11px 22px', background: '#00e5a0', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                  whiteSpace: 'nowrap', opacity: !domain ? 0.5 : 1,
                }}>
                {scanLoading ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'pulse 0.7s linear infinite' }} /> Scanning…</> : <><Zap size={14} /> Scan now</>}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 14 }}>
              {['No account needed', 'Results in under 10s', '100% free during beta'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                  <CheckCircle size={11} color="rgba(16,185,129,0.6)" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero 2-col: scan types + demo */}
          <div className="fade-up fade-up-4" style={{ display: 'grid', gridTemplateColumns: '1fr 480px', gap: 32, alignItems: 'center', maxWidth: 1000, margin: '0 auto' }}>
            {/* Left: scan type cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: Globe, color: '#00e5a0', label: 'Website scan', desc: 'DNS records, SSL chain, DNSSEC, CAA, propagation across 4 global resolvers' },
                { icon: Mail, color: '#6366f1', label: 'Email auth scan', desc: 'SPF depth analysis, DKIM key validation, DMARC policy, BIMI, MTA-STS, TLS-RPT' },
                { icon: Network, color: '#ffb224', label: 'Connection scan', desc: 'IPv6 readiness, zone transfer exposure, open resolver check, blacklist reputation' },
              ].map(s => (
                <div key={s.label} className="hover-card"
                  onClick={() => { if (domain) { startScan(s.label.split(' ')[0].toLowerCase()) } }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2535',
                    borderRadius: 12, cursor: domain ? 'pointer' : 'default',
                  }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <s.icon size={17} color={s.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: '#8993ac', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto', marginTop: 10, flexShrink: 0 }} />
                </div>
              ))}
            </div>
            {/* Right: live scan demo */}
            <div style={{ animation: 'float 6s ease-in-out infinite' }}>
              <ScanDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────── */}
      <section style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { num: 50, suffix: '+', label: 'Blacklists checked', sub: 'per scan' },
            { num: 12, suffix: '', label: 'Check categories', sub: 'in one scan' },
            { num: 4, suffix: '', label: 'Global resolver regions', sub: 'propagation check' },
            { num: 10, suffix: 's', label: 'Average scan time', sub: 'full analysis' },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '28px 20px', textAlign: 'center', borderRight: i < 3 ? '1px solid #e2e8f0' : 'none' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#0d1a14', fontFamily: "'DM Serif Display', serif", lineHeight: 1 }}>
                <StatNumber end={s.num} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#00e5a0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, padding: '4px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 20 }}>
              What we check
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontFamily: "'DM Serif Display', serif", fontWeight: 400, color: '#0a0d12', marginBottom: 14, lineHeight: 1.2 }}>
              Every layer of your domain's health
            </h2>
            <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              Most tools check one thing. DomainRadar checks everything — in one scan, in under 10 seconds.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {features.map(f => (
              <div key={f.title} className="hover-card" style={{ padding: '26px 24px', border: '1px solid #e5e7eb', borderRadius: 14, background: '#fff' }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${f.color}12`, border: `1px solid ${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <f.icon size={20} color={f.color} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 14 }}>{f.title}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {f.items.map(item => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#4b5563', padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, padding: '4px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 20 }}>
              How it works
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontFamily: "'DM Serif Display', serif", fontWeight: 400, color: '#0a0d12', lineHeight: 1.2 }}>
              From zero to fully monitored in 3 steps
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 28, left: '16.6%', right: '16.6%', height: 1, background: 'linear-gradient(90deg, #10b981, #6366f1, #f59e0b)', opacity: 0.3, zIndex: 0 }} />
            {[
              { n: '01', color: '#00e5a0', icon: Search, title: 'Run a free scan', desc: 'Enter any domain and get a full DNS health report in seconds. No account required for your first scan.' },
              { n: '02', color: '#6366f1', icon: Shield, title: 'Verify ownership', desc: 'Add a single TXT record to your DNS. Takes 30 seconds. Proves you own the domain for continuous monitoring.' },
              { n: '03', color: '#ffb224', icon: Bell, title: 'Get instant alerts', desc: 'We scan on your schedule — every hour, 6 hours, or daily. Email or webhook alert the moment anything changes.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: `2px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 0 0 6px ${s.color}08` }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '0.1em', marginBottom: 8 }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK CTA BAND ────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a14 100%)',
        padding: '80px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: '5%', width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontFamily: "'DM Serif Display', serif", fontWeight: 400, color: '#fff', lineHeight: 1.2, marginBottom: 18 }}>
              Your domain's security<br />deserves expert-level tooling
            </h2>
            <p style={{ fontSize: 14, color: '#8993ac', lineHeight: 1.8, marginBottom: 28 }}>
              Built by a Certified PKI Specialist and Partner Account Manager at DigiCert. The same depth of analysis used by enterprise security teams — free for indie founders, SMBs, and non-profits.
            </p>
            <button className="cta-btn" onClick={() => setPage('auth')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: '#00e5a0', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Start monitoring free <ArrowRight size={15} />
            </button>
          </div>
          <div>
            <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Every scan checks
            </div>
            <div style={{ columns: 2, columnGap: 16 }}>
              {checklist.map(item => (
                <div key={item} className="check-item">
                  <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0 }} /> {item}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2535', borderRadius: 10 }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "Finally a DNS tool that checks everything in one place. The DMARC analysis alone saved us from a spoofing attack."
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>— Beta user, SaaS founder</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section style={{ padding: '88px 24px', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(16,185,129,0.25)' }}>
            <Shield size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontFamily: "'DM Serif Display', serif", fontWeight: 400, color: '#0a0d12', marginBottom: 14, lineHeight: 1.2 }}>
            Start monitoring your domains today
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 32, lineHeight: 1.7 }}>
            Add a TXT record once. We handle everything else — scans, alerts, daily reports. 100% free during beta.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="cta-btn" onClick={() => setPage('auth')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: '#00e5a0', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Create free account <ArrowRight size={15} />
            </button>
            <button className="ghost-btn" onClick={() => { setScanDomain('google.com'); setScanType('website'); setPage('scan') }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', background: 'transparent', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              <Search size={14} /> Try a demo scan
            </button>
          </div>
          <div style={{ marginTop: 24, fontSize: 12, color: '#9ca3af' }}>
            No credit card · No setup · Built by a PKI specialist
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer style={{ background: '#0a0d12', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={15} color="#10b981" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>DomainRadar</span>
            <span style={{ fontSize: 11, color: '#4a5470', padding: '1px 7px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>beta</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <span key={l} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#4a5470' }}>
            Built by a Certified PKI Specialist · DigiCert Partner
          </div>
        </div>
      </footer>
    </div>
  )
}
