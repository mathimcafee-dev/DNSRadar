import { useState, useEffect } from 'react'
import { Radar, Shield, Globe, Lock, Mail, Zap, CheckCircle, ArrowRight, AlertTriangle, Activity, Search, FileText, Bell, Wrench, BarChart2, ChevronDown, ChevronUp, Star } from 'lucide-react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"
const MONO = "'JetBrains Mono','Fira Code',monospace"

const FEATURES_LIVE = [
  { icon: Mail,     color:'#6366f1', bg:'#eef2ff', label:'Email Authentication',   desc:'SPF, DKIM, DMARC, BIMI, MTA-STS — full audit with fix suggestions and DMARC journey wizard.' },
  { icon: Lock,     color:'#0ea5e9', bg:'#e0f2fe', label:'SSL Certificates',       desc:'Expiry countdown, issuer, chain validity, HSTS, CT logs — from crt.sh and Certspotter.' },
  { icon: Globe,    color:'#10b981', bg:'#ecfdf5', label:'DNS Propagation',        desc:'Global propagation status across 4 resolvers — US, EU, APAC, AU. Inconsistency alerts.' },
  { icon: Shield,   color:'#f59e0b', bg:'#fffbeb', label:'Blacklist Monitoring',   desc:'Checks 52 DNSBL lists in real time. One-click delist links for each flagged list.' },
  { icon: Zap,      color:'#ef4444', bg:'#fef2f2', label:'DNS Auto-Fix',          desc:'Cloudflare API integration. Push correct SPF, DMARC, CAA records with one click. Logged.' },
  { icon: Activity, color:'#8b5cf6', bg:'#f5f3ff', label:'Health Score',          desc:'Weighted 0–100 score across 6 categories. Delta vs last scan. Score history chart.' },
  { icon: Search,   color:'#0891b2', bg:'#ecfeff', label:'Instant Audit',         desc:'Scan any domain without an account. Export a full compliance PDF — PCI DSS, CISA, Google/Yahoo.' },
  { icon: Bell,     color:'#d97706', bg:'#fffbeb', label:'Alerts & Reports',      desc:'Email alerts on any DNS change. Webhook to Slack or Teams. Daily digest reports.' },
  { icon: Wrench,   color:'#059669', bg:'#ecfdf5', label:'Tools & Generators',    desc:'SPF generator, DMARC wizard, DKIM checker, deliverability test, SPF flattener, bulk importer.' },
]

const COMING_SOON = [
  { label:'DMARC aggregate reports',  desc:'Inbound DMARC XML parsing, sender IP identification, daily stats charts.' },
  { label:'Geographic threat map',    desc:'Visualise where unauthorised senders are located on a world map.' },
  { label:'BIMI validator',           desc:'Full VMC and SVG logo validation with inbox preview across Gmail, Apple Mail, Yahoo.' },
  { label:'Compliance PDF',           desc:'One-click downloadable report for auditors — PCI DSS v4, CISA BOD 18-01, ISO 27001.' },
  { label:'White-label reports',      desc:'Agency-branded PDF and HTML reports with your logo and colour scheme.' },
  { label:'API access',               desc:'RESTful API with key auth. Scan any domain programmatically and get full JSON results.' },
]

const STEPS = [
  { n:'01', title:'Paste your domain',   body:'No account needed for your first scan. Results in under 90 seconds — DNS, email auth, SSL, propagation, blacklists all at once.' },
  { n:'02', title:'Read the audit',      body:'Every finding explained in plain English. Health score, critical issues highlighted, fix instructions included inline.' },
  { n:'03', title:'Fix with one click',  body:'Connect Cloudflare or GoDaddy once. DomainRadar pushes the correct record via API. You approve, it applies. Change logged forever.' },
  { n:'04', title:'Monitor forever',     body:'6h or 24h rescans. Email alerts when anything changes. Certificate expiry warnings at 30, 7 and 1 day. Score history chart.' },
]

const FAQS = [
  { q:'Does it work on any domain?',       a:'Yes — scan any publicly reachable domain, yours or anyone else\'s. No ownership proof for a basic scan. Monitoring and auto-fix require adding to your account.' },
  { q:'What does the health score mean?',  a:'A weighted 0–100 across DNS (25pts), email auth (30pts), SSL (20pts), propagation (10pts), security (10pts), blacklists (5pts). Below 60 means real deliverability or security risk.' },
  { q:'How does auto-fix work?',           a:'You add Cloudflare or GoDaddy API credentials once in Settings. DomainRadar reads the issue, builds the correct record, and pushes it via their API. You see a confirm dialog before anything changes.' },
  { q:'Is this only for developers?',      a:'No. Every finding has a plain-English explanation and step-by-step fix. Auto-fix means most issues resolve in one click with zero DNS knowledge.' },
  { q:'How is the PDF export generated?',  a:'Client-side HTML generation — no server involved. The report includes your domain, score, compliance checklist (PCI DSS, CISA, Google/Yahoo), all check results, and issues to fix.' },
  { q:'What is on the free plan?',         a:'Unlimited manual scans, one monitored domain, full scan results, PDF export, and all tools. Paid plans add more monitored domains, faster intervals, team seats, and API access.' },
]

const TESTIMONIALS = [
  { name:'Marcus B.', role:'SaaS founder', text:'Found out our DMARC was on p=none for two years. One click to fix. Took 4 minutes total.' },
  { name:'Priya K.',  role:'Agency owner', text:'We run this on every client domain before onboarding. The PDF report goes straight into the proposal.' },
  { name:'Tom H.',    role:'Dev lead',     text:'The blacklist alert saved us from a support nightmare. Got the delist done before customers noticed.' },
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

  function scan(e) {
    e.preventDefault()
    if (!domain.trim()) return
    const d = domain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
    setScanDomain(d); setScanType('website'); setPage('scan')
  }


  const navBg = scrolled ? 'rgba(255,255,255,0.95)' : 'transparent'
  const navBd = scrolled ? '1px solid #e5e7eb' : '1px solid transparent'

  return (
    <div style={{ fontFamily:F, background:'#fff', color:'#111', lineHeight:1.6 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scan-line { 0%,100% { top:0 } 50% { top:calc(100% - 2px) } }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .hover-lift { transition: transform 0.15s, box-shadow 0.15s; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .nav-link { font-size:13px; color:#555; cursor:pointer; padding:5px 10px; border-radius:7px; font-family:${F}; background:none; border:none; transition:color 0.15s,background 0.15s; }
        .nav-link:hover { color:#111; background:#f3f4f6; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, height:56, display:'flex', alignItems:'center', padding:'0 32px', justifyContent:'space-between', background:navBg, backdropFilter:scrolled?'blur(12px)':'none', borderBottom:navBd, transition:'all 0.2s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <div style={{ width:30, height:30, background:'#16a34a', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radar size={16} color="#fff" strokeWidth={2.5}/>
          </div>
          <span style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.03em' }}>DomainRadar</span>
          <span style={{ fontSize:9, background:'#dcfce7', color:'#16a34a', padding:'2px 7px', borderRadius:8, fontWeight:700, border:'1px solid #bbf7d0' }}>beta</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>Features</button>
          <button className="nav-link" onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>How it works</button>
          <button className="nav-link" onClick={() => setPage('pricing')}>Pricing</button>
          <button className="nav-link" onClick={() => setPage('about')}>About</button>
          <div style={{ width:1, height:20, background:'#e5e7eb', margin:'0 6px' }}/>
          <button onClick={() => setPage('auth')} style={{ padding:'6px 13px', background:'transparent', color:'#555', border:'1px solid #e5e7eb', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:F }}>Sign in</button>
          <button onClick={() => setPage('auth')} style={{ padding:'7px 16px', background:'#111', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Start free →</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'100px 24px 80px', background:'#fff', textAlign:'center' }}>
        <div className="fade-up" style={{ animationDelay:'0.05s', marginBottom:20 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#dcfce7', color:'#15803d', border:'1px solid #bbf7d0', borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:600 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', display:'inline-block' }}/>
            Free DNS audit — no account needed
          </span>
        </div>
        <h1 className="fade-up" style={{ animationDelay:'0.1s', fontSize:'clamp(36px,6vw,68px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.05, marginBottom:20, maxWidth:820 }}>
          Your domain's security,<br/><span style={{ borderBottom:'4px solid #16a34a', paddingBottom:2 }}>explained and fixed.</span>
        </h1>
        <p className="fade-up" style={{ animationDelay:'0.15s', fontSize:'clamp(15px,2vw,19px)', color:'#555', maxWidth:560, marginBottom:40, lineHeight:1.7 }}>
          Full DNS audit — SPF, DKIM, DMARC, SSL, blacklists, propagation — in 90 seconds. One-click auto-fix via Cloudflare. Continuous monitoring with email alerts.
        </p>

        {/* Scan box */}
        <div className="fade-up" style={{ animationDelay:'0.2s', width:'100%', maxWidth:540, marginBottom:16 }}>
          <form onSubmit={scan} style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, position:'relative' }}>
              <Search size={14} color="#9ca3af" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="yourdomain.com"
                style={{ width:'100%', padding:'13px 14px 13px 36px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:15, fontFamily:MONO, color:'#111', outline:'none', boxSizing:'border-box', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}
                onFocus={e=>e.target.style.borderColor='#16a34a'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
            <button type="submit" style={{ padding:'13px 24px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:F, whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(22,163,74,0.3)' }}>
              Scan domain →
            </button>
          </form>
          <p style={{ fontSize:12, color:'#9ca3af', marginTop:8 }}>No credit card · No signup required · Results in 90 seconds</p>
        </div>





        {/* Stats */}
        <div className="fade-up" style={{ animationDelay:'0.35s', display:'flex', gap:32, marginTop:56, flexWrap:'wrap', justifyContent:'center' }}>
          {[['52','blacklists checked'],['4','global resolvers'],['6','auth checks'],['< 90s','full scan']].map(([v,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em', color:'#111' }}>{v}</div>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:'80px 24px', background:'#fafafa' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>What we check</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:14 }}>Everything your domain needs</h2>
            <p style={{ fontSize:15, color:'#555', maxWidth:520, margin:'0 auto' }}>Nine categories of checks. All live, all in parallel, all explained.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {FEATURES_LIVE.map(f => (
              <div key={f.label} className="hover-lift" style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'20px 22px', cursor:'default' }}>
                <div style={{ width:38, height:38, borderRadius:10, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <f.icon size={18} color={f.color}/>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:6 }}>{f.label}</div>
                <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Coming soon */}
          <div style={{ marginTop:48, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:16, padding:'28px 32px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#15803d' }}>Coming soon</span>
              <span style={{ fontSize:10, background:'#dcfce7', color:'#16a34a', padding:'2px 8px', borderRadius:8, fontWeight:600, border:'1px solid #86efac' }}>In development</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
              {COMING_SOON.map(f => (
                <div key={f.label} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#86efac', flexShrink:0, marginTop:6 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#166534' }}>{f.label}</div>
                    <div style={{ fontSize:12, color:'#4ade80', opacity:0.8, lineHeight:1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding:'80px 24px', background:'#fff' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Process</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,42px)', fontWeight:900, letterSpacing:'-0.03em' }}>From scan to fixed in minutes</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:24 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ position:'relative' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', fontFamily:MONO, marginBottom:12, letterSpacing:'0.05em' }}>{s.n}</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#111', marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.7 }}>{s.body}</div>
                {i < STEPS.length - 1 && (
                  <ArrowRight size={16} color="#d1d5db" style={{ position:'absolute', right:-20, top:12, display:'none' }}/>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding:'72px 24px', background:'#fafafa' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Feedback</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,36px)', fontWeight:900, letterSpacing:'-0.03em' }}>What people say</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:18 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="hover-lift" style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'20px 22px' }}>
                <div style={{ display:'flex', gap:3, marginBottom:12 }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} color="#f59e0b" fill="#f59e0b"/>)}
                </div>
                <p style={{ fontSize:13, color:'#374151', lineHeight:1.7, marginBottom:16, fontStyle:'italic' }}>"{t.text}"</p>
                <div style={{ fontSize:12, fontWeight:600, color:'#111' }}>{t.name}</div>
                <div style={{ fontSize:11, color:'#9ca3af' }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section style={{ padding:'72px 24px', background:'#fff' }}>
        <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Pricing</div>
          <h2 style={{ fontSize:'clamp(26px,4vw,40px)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:14 }}>Free to start. Pay when you scale.</h2>
          <p style={{ fontSize:15, color:'#555', marginBottom:32, lineHeight:1.7 }}>Unlimited manual scans forever. Monitoring, auto-fix, team seats and API access on paid plans.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => setPage('auth')} style={{ padding:'12px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F }}>Start free →</button>
            <button onClick={() => setPage('pricing')} style={{ padding:'12px 24px', background:'transparent', color:'#374151', border:'1px solid #e5e7eb', borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:F }}>See pricing</button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding:'72px 24px', background:'#fafafa' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>FAQ</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,36px)', fontWeight:900, letterSpacing:'-0.03em' }}>Common questions</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq===i?null:i)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', background:'none', border:'none', cursor:'pointer', fontFamily:F, textAlign:'left', gap:12 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'#111' }}>{f.q}</span>
                  {openFaq===i ? <ChevronUp size={16} color="#9ca3af"/> : <ChevronDown size={16} color="#9ca3af"/>}
                </button>
                {openFaq===i && (
                  <div style={{ padding:'0 18px 16px', fontSize:13, color:'#6b7280', lineHeight:1.7 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding:'80px 24px', background:'#111', textAlign:'center' }}>
        <div style={{ maxWidth:520, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(28px,5vw,48px)', fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:16 }}>
            Scan your domain.<br/><span style={{ color:'#4ade80' }}>Free, right now.</span>
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.5)', marginBottom:36, lineHeight:1.7 }}>No account needed. Full DNS security audit — SPF, DKIM, DMARC, SSL, blacklists, propagation — in under 90 seconds.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => { window.scrollTo({top:0,behavior:'smooth'}); setTimeout(()=>document.querySelector('input[placeholder="yourdomain.com"]')?.focus(),400) }} style={{ padding:'13px 32px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:F }}>Audit your domain →</button>
            <button onClick={() => setPage('auth')} style={{ padding:'13px 24px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:F }}>Create account</button>
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.2)', marginTop:14 }}>No credit card · No signup required · PDF report included</p>
        </div>
      </section>
      <footer style={{ background:'#111', borderTop:'1px solid #1f2937', padding:'28px 32px' }}>
        <div style={{ maxWidth:1020, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:24, height:24, background:'#16a34a', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Radar size={13} color="#fff" strokeWidth={2.5}/>
            </div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>DomainRadar</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>· Made with ♥ in NL</span>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
            {[['Home','landing'],['Pricing','pricing'],['About','about'],['Developer','developer'],['Sign in','auth']].map(([l,id]) => (
              <button key={l} onClick={() => setPage(id)}
                style={{ fontSize:12, color:'rgba(255,255,255,0.35)', background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:5, fontFamily:F, transition:'color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.7)'}
                onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>© 2026 DomainRadar</div>
        </div>
      </footer>
    </div>
  )
}
