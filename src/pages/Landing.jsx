import { useState, useEffect } from 'react'
import { Radar, Shield, Globe, Lock, Mail, Zap, CheckCircle, ArrowRight, ChevronRight, AlertTriangle, Activity } from 'lucide-react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"
const MONO = "'JetBrains Mono','Fira Code',monospace"

const NAV_ITEMS = ['Features','How it works','Pricing']

const STATS = [
  { val: '< 2 min', label: 'First scan' },
  { val: '6 checks', label: 'Per domain' },
  { val: '10/10', label: 'Blacklists' },
  { val: 'Free', label: 'To start' },
]

const CHECKS = [
  { icon: Mail,   color: '#6366f1', label: 'SPF · DKIM · DMARC', sub: 'Full email auth audit with policy enforcement grading' },
  { icon: Lock,   color: '#0ea5e9', label: 'SSL / TLS',           sub: 'Certificate validity, expiry, chain and cipher check' },
  { icon: Globe,  color: '#10b981', label: 'DNS Propagation',     sub: 'Global propagation status across 20+ resolvers' },
  { icon: Shield, color: '#f59e0b', label: 'Blacklist monitoring', sub: 'Real-time checks across 10 major blocklists' },
  { icon: Activity,color:'#8b5cf6', label: 'Security headers',    sub: 'HSTS, CSP, X-Frame-Options and 6 more' },
  { icon: Zap,    color: '#ef4444', label: 'Auto-fix',            sub: 'One-click DNS fixes via Cloudflare and GoDaddy APIs' },
]

const STEPS = [
  { n:'01', title:'Add your domain',     body:'Paste any domain name. No ownership verification needed to run your first scan. Results in under 90 seconds.' },
  { n:'02', title:'Read the full report', body:'SPF depth analysis, DKIM key validation, DMARC policy grading, SSL chain, propagation, blacklists — all in one page.' },
  { n:'03', title:'Fix what is broken',  body:'For Cloudflare and GoDaddy users, DomainRadar pushes the correct DNS records with a single click. No cPanel required.' },
  { n:'04', title:'Monitor it forever',  body:'Set a 6 or 24 hour scan interval and get email alerts the moment anything changes or a certificate nears expiry.' },
]

const FEATURES = [
  { label:'Scanning', items:['SPF include depth analysis','DKIM 2048-bit key validation','DMARC policy enforcement grading','BIMI + VMC detection','MTA-STS and TLS-RPT','SSL certificate chain check'] },
  { label:'Monitoring', items:['6h / 24h automatic rescans','Email alerts on any change','Certificate expiry warnings','Blacklist entry detection','Score history over time','Fleet dashboard for all domains'] },
  { label:'Auto-fix', items:['Cloudflare DNS record push','GoDaddy DNS record push','One-click SPF correction','DMARC policy upgrade wizard','DKIM rotation assistant','Bulk domain import via CSV'] },
]

const FAQS = [
  { q:'Does it work on any domain?',            a:'Yes. You can scan any publicly reachable domain — yours, a competitor\'s, a client\'s. No ownership proof required for a basic scan. Monitoring and auto-fix require you to add the domain to your account.' },
  { q:'What does the health score mean?',        a:'It is a weighted 0–100 score across DNS records (25 pts), email authentication (30 pts), SSL/TLS (20 pts), propagation (10 pts), security headers (10 pts), and blacklists (5 pts). A score below 60 means real deliverability or security risk.' },
  { q:'How does auto-fix actually work?',        a:'You paste your Cloudflare or GoDaddy API credentials once. DomainRadar reads the issue, builds the correct DNS record, and creates or updates it via their API. You approve before anything changes.' },
  { q:'Is this only for developers?',            a:'No. The report is designed for domain owners who have never opened a DNS panel. Every finding has a plain-English explanation and a numbered fix list. The auto-fix feature means many issues resolve with a single click.' },
  { q:'What is the free plan?',                  a:'Free gives you unlimited manual scans and one monitored domain. Paid plans add more monitored domains, faster scan intervals, team seats, and API access.' },
]

export default function Landing({ setPage, setScanDomain, setScanType }) {
  const [domain, setDomain] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Load and save recent scans from localStorage
  const [recentScans, setRecentScans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dr_recent_scans') || '[]') } catch { return [] }
  })

  function saveToHistory(d) {
    try {
      const prev = JSON.parse(localStorage.getItem('dr_recent_scans') || '[]')
      const updated = [d, ...prev.filter(x => x !== d)].slice(0, 8)
      localStorage.setItem('dr_recent_scans', JSON.stringify(updated))
      setRecentScans(updated)
    } catch {}
  }

  function scan(e) {
    e.preventDefault()
    if (!domain.trim()) return
    const d = domain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
    saveToHistory(d)
    setScanDomain(d)
    setScanType('website')
    setPage('scan')
  }

  // ── styles ──────────────────────────────────────────
  const page  = { fontFamily:F, background:'#fafafa', color:'#111', lineHeight:1.6 }
  const nav   = { position:'fixed', top:0, left:0, right:0, zIndex:100, height:56, display:'flex', alignItems:'center', padding:'0 32px', justifyContent:'space-between', background: scrolled ? 'rgba(250,250,250,0.92)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid #e5e7eb' : '1px solid transparent', transition:'all 0.2s' }
  const btn1  = { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 20px', background:'#111', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }
  const btn2  = { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', background:'transparent', color:'#555', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:F }
  const input = { flex:1, padding:'12px 16px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:9, fontSize:14, fontFamily:MONO, color:'#111', outline:'none', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.04)' }

  return (
    <div style={page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #9ca3af; font-family: ${MONO}; }
        a { text-decoration: none; color: inherit; }
        .faq-q:hover { color: #111 !important; }
        .nav-link { font-size:13px; color:#555; font-weight:500; cursor:pointer; padding:4px 0; border-bottom:1px solid transparent; transition:color 0.15s; }
        .nav-link:hover { color:#111; }
        .check-card:hover { border-color:#d1d5db !important; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.06) !important; }
        .step-num { font-size:11px; font-weight:700; color:#9ca3af; letter-spacing:0.1em; font-family:${MONO}; margin-bottom:10px; }
        @media(max-width:640px){ .hero-form { flex-direction:column !important; } .stat-grid { grid-template-columns:1fr 1fr !important; } .check-grid { grid-template-columns:1fr !important; } }
      `}</style>

      {/* ── NAV ── */}
      <nav style={nav}>
        <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <div style={{ width:28, height:28, background:'#111', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radar size={14} color="#fff"/>
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:'#111', letterSpacing:'-0.02em' }}>DomainRadar</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:28 }}>
          {NAV_ITEMS.map(n => <span key={n} className="nav-link">{n}</span>)}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={btn2} onClick={() => setPage('auth')}>Sign in</button>
          <button style={btn1} onClick={() => setPage('auth')}>Start free <ArrowRight size={13}/></button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop:130, paddingBottom:90, paddingLeft:32, paddingRight:32, maxWidth:780, margin:'0 auto', textAlign:'center' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #e5e7eb', borderRadius:20, padding:'4px 12px 4px 6px', fontSize:12, fontWeight:500, color:'#555', marginBottom:32, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <span style={{ background:'#dcfce7', color:'#15803d', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10, letterSpacing:'0.05em' }}>NEW</span>
          Auto-fix now supports GoDaddy DNS
        </div>

        <h1 style={{ fontSize:52, fontWeight:800, color:'#111', letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:20 }}>
          Your domain is probably<br/>
          <span style={{ color:'#dc2626' }}>broken in ways you can't see.</span>
        </h1>

        <p style={{ fontSize:17, color:'#6b7280', lineHeight:1.7, marginBottom:40, maxWidth:560, margin:'0 auto 40px' }}>
          DomainRadar runs a full DNS and email security audit in 90 seconds.
          SPF, DKIM, DMARC, SSL, blacklists, propagation — every check that matters for deliverability and uptime.
        </p>

        {/* Scan form */}
        <form onSubmit={scan} style={{ display:'flex', gap:8, maxWidth:520, margin:'0 auto 16px', flexWrap:'nowrap' }} className="hero-form">
          <input
            style={input}
            placeholder="yourdomain.com"
            value={domain}
            onChange={e => setDomain(e.target.value)}
          />
          <button type="submit" style={{ ...btn1, padding:'12px 22px', fontSize:14, borderRadius:9, flexShrink:0 }}>
            Scan free
          </button>
        </form>
        <p style={{ fontSize:12, color:'#9ca3af' }}>No account needed · Results in 90 seconds · Free forever</p>
      </section>

      {/* ── STATS ROW ── */}
      <section style={{ borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', background:'#fff', padding:'28px 32px' }}>
        <div style={{ maxWidth:780, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0 }} className="stat-grid">
          {STATS.map((s, i) => (
            <div key={s.label} style={{ textAlign:'center', borderRight: i < 3 ? '1px solid #f0f0f0' : 'none', padding:'8px 16px' }}>
              <div style={{ fontSize:24, fontWeight:800, color:'#111', letterSpacing:'-0.03em', fontFamily:MONO }}>{s.val}</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:3, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE CHECK ── */}
      <section style={{ padding:'80px 32px', maxWidth:860, margin:'0 auto' }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>What we check</div>
          <h2 style={{ fontSize:34, fontWeight:800, color:'#111', letterSpacing:'-0.03em', lineHeight:1.2, maxWidth:500 }}>
            Every check that affects deliverability, trust, and uptime.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }} className="check-grid">
          {CHECKS.map(c => (
            <div key={c.label} className="check-card" style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'20px 20px', transition:'all 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.04)', cursor:'default' }}>
              <div style={{ width:34, height:34, borderRadius:9, background:c.color+'18', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <c.icon size={16} color={c.color}/>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:'#111', marginBottom:5, letterSpacing:'-0.01em' }}>{c.label}</div>
              <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.6 }}>{c.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background:'#fff', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', padding:'80px 32px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ marginBottom:56 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>How it works</div>
            <h2 style={{ fontSize:34, fontWeight:800, color:'#111', letterSpacing:'-0.03em', lineHeight:1.2, maxWidth:480 }}>
              From first scan to fully monitored in four steps.
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:40 }}>
            {STEPS.map(s => (
              <div key={s.n}>
                <div className="step-num">{s.n}</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#111', letterSpacing:'-0.02em', marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.7 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE LIST ── */}
      <section style={{ padding:'80px 32px', maxWidth:860, margin:'0 auto' }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Everything in the box</div>
          <h2 style={{ fontSize:34, fontWeight:800, color:'#111', letterSpacing:'-0.03em', lineHeight:1.2 }}>
            Not a feature teaser.<br/>The full suite, on day one.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:32 }}>
          {FEATURES.map(f => (
            <div key={f.label}>
              <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16, borderBottom:'1px solid #f0f0f0', paddingBottom:10 }}>{f.label}</div>
              {f.items.map(item => (
                <div key={item} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:10 }}>
                  <CheckCircle size={13} color="#16a34a" style={{ flexShrink:0, marginTop:2 }}/>
                  <span style={{ fontSize:13, color:'#444', lineHeight:1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOUNDER NOTE ── */}
      <section style={{ background:'#fff', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb', padding:'64px 32px' }}>
        <div style={{ maxWidth:580, margin:'0 auto' }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#111', lineHeight:1.6, letterSpacing:'-0.02em', marginBottom:28 }}>
            "DNS and email auth failures are invisible until they cost you — a blacklisting that kills deliverability, an expired cert that takes down trust, an SPFAIL that bounces every email you send. DomainRadar makes that invisible layer visible, and fixable, for anyone who runs a domain."
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'#f0fdf4', border:'1px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#16a34a' }}>M</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#111' }}>Mathi</div>
              <div style={{ fontSize:12, color:'#9ca3af' }}>Founder · DomainRadar · Certified PKI Specialist at DigiCert</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding:'80px 32px', maxWidth:680, margin:'0 auto' }}>
        <div style={{ marginBottom:48 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#9ca3af', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Questions</div>
          <h2 style={{ fontSize:34, fontWeight:800, color:'#111', letterSpacing:'-0.03em' }}>The things every user asks us.</h2>
        </div>
        {FAQS.map((f, i) => (
          <div key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
            <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 0', background:'none', border:'none', cursor:'pointer', fontSize:14, fontWeight:600, color: openFaq === i ? '#111' : '#444', textAlign:'left', fontFamily:F, gap:12, letterSpacing:'-0.01em' }}>
              {f.q}
              <ChevronRight size={16} color="#9ca3af" style={{ flexShrink:0, transform: openFaq === i ? 'rotate(90deg)' : 'none', transition:'transform 0.15s' }}/>
            </button>
            {openFaq === i && (
              <div style={{ paddingBottom:18, fontSize:13, color:'#6b7280', lineHeight:1.8 }}>{f.a}</div>
            )}
          </div>
        ))}
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ background:'#111', padding:'80px 32px', textAlign:'center' }}>
        <div style={{ maxWidth:540, margin:'0 auto' }}>
          <h2 style={{ fontSize:36, fontWeight:800, color:'#fff', letterSpacing:'-0.04em', lineHeight:1.2, marginBottom:16 }}>
            Scan your domain.<br/>Free, right now.
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', marginBottom:36, lineHeight:1.7 }}>
            No account needed to run your first scan. See exactly what is broken and how to fix it.
          </p>
          <form onSubmit={scan} style={{ display:'flex', gap:8, maxWidth:440, margin:'0 auto 16px' }}>
            <input style={{ ...input, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', flex:1 }} placeholder="yourdomain.com" value={domain} onChange={e=>setDomain(e.target.value)}/>
            <button type="submit" style={{ padding:'12px 20px', background:'#fff', color:'#111', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F, flexShrink:0 }}>Scan free</button>
          </form>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>No credit card · No signup required · 90 seconds</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#111', borderTop:'1px solid rgba(255,255,255,0.08)', padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:22, height:22, background:'rgba(255,255,255,0.1)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radar size={11} color="#fff"/>
          </div>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', letterSpacing:'-0.01em' }}>DomainRadar</span>
        </div>
        <div style={{ display:'flex', gap:20 }}>
          {['Privacy','Terms','Contact'].map(l => (
            <span key={l} style={{ fontSize:12, color:'rgba(255,255,255,0.3)', cursor:'pointer', transition:'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}
              onClick={() => setPage(l.toLowerCase())}>{l}</span>
          ))}
        </div>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>© 2026 DomainRadar</span>
      </footer>
    </div>
  )
}
