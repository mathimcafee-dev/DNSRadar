import { useState, useEffect } from 'react'
import { Radar, Shield, Globe, Lock, Mail, Zap, CheckCircle, ArrowRight, AlertTriangle, Activity, Search, FileText, Bell, Wrench, BarChart2, ChevronDown, ChevronUp, Star } from 'lucide-react'

const F = "'Plus Jakarta Sans',system-ui,sans-serif"
const MONO = "'JetBrains Mono','Fira Code',monospace"

const FEATURES_LIVE = [
  { icon: Mail,     color:'#f472b6', bg:'rgba(244,114,182,0.12)', label:'Email Authentication',   desc:'SPF, DKIM, DMARC, BIMI, MTA-STS — full audit with fix suggestions and DMARC journey wizard.' },
  { icon: Lock,     color:'#60a5fa', bg:'rgba(96,165,250,0.12)',  label:'SSL Certificates',       desc:'Expiry countdown, issuer, chain validity, HSTS, CT logs — from crt.sh and Certspotter.' },
  { icon: Globe,    color:'#E8897A', bg:'rgba(232,137,122,0.12)', label:'DNS Propagation',        desc:'Global propagation status across 4 resolvers — US, EU, APAC, AU. Inconsistency alerts.' },
  { icon: Shield,   color:'#fbbf24', bg:'rgba(251,191,36,0.12)',  label:'Blacklist Monitoring',   desc:'Checks 52 DNSBL lists in real time. One-click delist links for each flagged list.' },
  { icon: Zap,      color:'#ef4444', bg:'rgba(239,68,68,0.12)',   label:'DNS Auto-Fix',          desc:'Cloudflare API integration. Push correct SPF, DMARC, CAA records with one click. Logged.' },
  { icon: Activity, color:'#a78bfa', bg:'rgba(167,139,250,0.12)', label:'Health Score',          desc:'Weighted 0–100 score across 6 categories. Delta vs last scan. Score history chart.' },
  { icon: Search,   color:'#34d399', bg:'rgba(52,211,153,0.12)',  label:'Instant Audit',         desc:'Scan any domain without an account. Export a full compliance PDF — PCI DSS, CISA, Google/Yahoo.' },
  { icon: Bell,     color:'#fb923c', bg:'rgba(251,146,60,0.12)',  label:'Alerts & Reports',      desc:'Email alerts on any DNS change. Webhook to Slack or Teams. Daily digest reports.' },
  { icon: Wrench,   color:'#E8897A', bg:'rgba(232,137,122,0.12)', label:'Tools & Generators',    desc:'SPF generator, DMARC wizard, DKIM checker, deliverability test, SPF flattener, bulk importer.' },
]

const STEPS = [
  { n:'01', title:'Paste your domain',   body:'No account needed. Results in under 90 seconds — DNS, email auth, SSL, propagation, blacklists all at once.', color:'#E8897A' },
  { n:'02', title:'Read the audit',      body:'Every finding explained in plain English. Health score, critical issues highlighted, fix instructions included inline.', color:'#60a5fa' },
  { n:'03', title:'Fix with one click',  body:'Connect Cloudflare or GoDaddy once. DomainRadar pushes the correct record via API. You approve, it applies.', color:'#a78bfa' },
  { n:'04', title:'Monitor forever',     body:'6h or 24h rescans. Email alerts when anything changes. Certificate expiry warnings at 30, 7 and 1 day.', color:'#34d399' },
]

const FAQS = [
  { q:'Does it work on any domain?',       a:"Yes — scan any publicly reachable domain, yours or anyone else's. No ownership proof for a basic scan. Monitoring and auto-fix require adding to your account." },
  { q:'What does the health score mean?',  a:'A weighted 0–100 across DNS (25pts), email auth (30pts), SSL (20pts), propagation (10pts), security (10pts), blacklists (5pts). Below 60 means real deliverability or security risk.' },
  { q:'How does auto-fix work?',           a:'You add Cloudflare or GoDaddy API credentials once in Settings. DomainRadar reads the issue, builds the correct record, and pushes it via their API. You see a confirm dialog before anything changes.' },
  { q:'Is this only for developers?',      a:'No. Every finding has a plain-English explanation and step-by-step fix. Auto-fix means most issues resolve in one click with zero DNS knowledge.' },
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

  return (
    <div style={{ fontFamily: F, background: '#080000', color: '#f0e8e8', lineHeight: 1.6, overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes glow-pulse { 0%,100% { opacity:0.5 } 50% { opacity:0.8 } }
        .fade-up { animation: fadeUp 0.6s ease both; }
        .hover-card { transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(232,137,122,0.12) !important; border-color: rgba(232,137,122,0.3) !important; }
        .nav-link { font-size:13px; color:rgba(240,232,232,0.55); cursor:pointer; padding:5px 12px; border-radius:7px; font-family:${F}; background:none; border:none; transition:color 0.15s,background 0.15s; font-weight:500; }
        .nav-link:hover { color:#f0e8e8; background:rgba(232,137,122,0.08); }
        .scan-input:focus { border-color: #E8897A !important; box-shadow: 0 0 0 3px rgba(232,137,122,0.15) !important; outline:none; }
      `}</style>

      {/* ── BACKGROUND GLOW ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'70%', height:'80%', borderRadius:'50%', background:'radial-gradient(ellipse, rgba(160,20,20,0.35) 0%, transparent 65%)', animation:'glow-pulse 4s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', bottom:'10%', left:'-10%', width:'50%', height:'60%', borderRadius:'50%', background:'radial-gradient(ellipse, rgba(100,10,10,0.2) 0%, transparent 60%)' }}/>
      </div>

      {/* ── NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, height:60, display:'flex', alignItems:'center', padding:'0 40px', justifyContent:'space-between', background: scrolled ? 'rgba(8,0,0,0.9)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? '1px solid rgba(232,137,122,0.12)' : '1px solid transparent', transition:'all 0.2s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <div style={{ width:32, height:32, background:'#E8897A', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(232,137,122,0.4)' }}>
            <Radar size={17} color="#1a0000" strokeWidth={2.5}/>
          </div>
          <span style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.03em', color:'#f0e8e8' }}>DomainRadar</span>
          <span style={{ fontSize:9, background:'rgba(232,137,122,0.15)', color:'#E8897A', padding:'2px 8px', borderRadius:8, fontWeight:700, border:'1px solid rgba(232,137,122,0.3)' }}>beta</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>Features</button>
          <button className="nav-link" onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>How it works</button>
          <button className="nav-link" onClick={() => setPage('pricing')}>Pricing</button>
          <button className="nav-link" onClick={() => setPage('about')}>About</button>
          <div style={{ width:1, height:20, background:'rgba(232,137,122,0.2)', margin:'0 8px' }}/>
          <button onClick={() => setPage('auth')} style={{ padding:'7px 14px', background:'transparent', color:'rgba(240,232,232,0.6)', border:'1px solid rgba(232,137,122,0.2)', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.color='#f0e8e8';e.currentTarget.style.borderColor='rgba(232,137,122,0.5)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='rgba(240,232,232,0.6)';e.currentTarget.style.borderColor='rgba(232,137,122,0.2)'}}>
            Sign in
          </button>
          <button onClick={() => setPage('auth')} style={{ padding:'8px 18px', background:'#E8897A', color:'#1a0000', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F, boxShadow:'0 0 16px rgba(232,137,122,0.3)', transition:'all 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
            onMouseLeave={e=>e.currentTarget.style.filter='brightness(1)'}>
            Start free →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position:'relative', zIndex:1, minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 24px 80px', textAlign:'center' }}>

        <div className="fade-up" style={{ animationDelay:'0.05s', marginBottom:24 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(232,137,122,0.1)', color:'#E8897A', border:'1px solid rgba(232,137,122,0.3)', borderRadius:24, padding:'6px 16px', fontSize:12, fontWeight:600, letterSpacing:'0.02em' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#E8897A', display:'inline-block', boxShadow:'0 0 8px #E8897A' }}/>
            Free DNS audit — no account needed
          </span>
        </div>

        <h1 className="fade-up" style={{ animationDelay:'0.1s', fontSize:'clamp(40px,6.5vw,76px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.02, marginBottom:24, maxWidth:860, color:'#ffffff' }}>
          Your domain's security,<br/>
          <span style={{ color:'#E8897A', textShadow:'0 0 40px rgba(232,137,122,0.4)' }}>explained and fixed.</span>
        </h1>

        <p className="fade-up" style={{ animationDelay:'0.15s', fontSize:'clamp(15px,2vw,19px)', color:'rgba(240,232,232,0.6)', maxWidth:560, marginBottom:44, lineHeight:1.75 }}>
          Full DNS audit — SPF, DKIM, DMARC, SSL, blacklists, propagation — in 90 seconds. One-click auto-fix via Cloudflare. Continuous monitoring with email alerts.
        </p>

        {/* Scan box */}
        <div className="fade-up" style={{ animationDelay:'0.2s', width:'100%', maxWidth:560, marginBottom:16 }}>
          <form onSubmit={scan} style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1, position:'relative' }}>
              <Search size={15} color="rgba(240,232,232,0.3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="yourdomain.com"
                className="scan-input"
                style={{ width:'100%', padding:'14px 16px 14px 40px', background:'rgba(255,255,255,0.06)', border:'1.5px solid rgba(232,137,122,0.2)', borderRadius:12, fontSize:15, fontFamily:MONO, color:'#f0e8e8', outline:'none', boxSizing:'border-box', backdropFilter:'blur(8px)' }}/>
            </div>
            <button type="submit" style={{ padding:'14px 28px', background:'#E8897A', color:'#1a0000', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:F, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(232,137,122,0.4)', transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
              onMouseLeave={e=>e.currentTarget.style.filter='brightness(1)'}>
              Scan domain →
            </button>
          </form>
          <p style={{ fontSize:12, color:'rgba(240,232,232,0.3)', marginTop:10, letterSpacing:'0.02em' }}>No credit card · No signup required · Results in 90 seconds</p>
        </div>

        {/* Stats */}
        <div className="fade-up" style={{ animationDelay:'0.3s', display:'flex', gap:40, marginTop:64, flexWrap:'wrap', justifyContent:'center' }}>
          {[['52','blacklists checked'],['4','global resolvers'],['6','auth checks'],['< 90s','full scan']].map(([v,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:30, fontWeight:900, letterSpacing:'-0.04em', color:'#E8897A', textShadow:'0 0 20px rgba(232,137,122,0.3)' }}>{v}</div>
              <div style={{ fontSize:12, color:'rgba(240,232,232,0.4)', marginTop:4, letterSpacing:'0.04em' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ position:'relative', zIndex:1, padding:'100px 24px', background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(232,137,122,0.08)' }}>
        <div style={{ maxWidth:1020, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#E8897A', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>What we check</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:14, color:'#fff' }}>Everything your domain needs</h2>
            <p style={{ fontSize:15, color:'rgba(240,232,232,0.5)', maxWidth:520, margin:'0 auto' }}>Nine categories. All live, all in parallel, all explained in plain English.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
            {FEATURES_LIVE.map(f => (
              <div key={f.label} className="hover-card" style={{ background:'rgba(255,255,255,0.035)', border:'1px solid rgba(232,137,122,0.1)', borderRadius:16, padding:'22px 24px', cursor:'default', backdropFilter:'blur(8px)' }}>
                <div style={{ width:42, height:42, borderRadius:12, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <f.icon size={20} color={f.color}/>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:8 }}>{f.label}</div>
                <div style={{ fontSize:13, color:'rgba(240,232,232,0.5)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ position:'relative', zIndex:1, padding:'100px 24px', borderTop:'1px solid rgba(232,137,122,0.08)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#E8897A', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>Process</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-0.03em', color:'#fff' }}>From scan to fixed in minutes</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:32 }}>
            {STEPS.map(s => (
              <div key={s.n}>
                <div style={{ fontSize:11, fontWeight:800, color:s.color, fontFamily:MONO, marginBottom:14, letterSpacing:'0.08em', opacity:0.9 }}>{s.n}</div>
                <div style={{ width:40, height:3, background:s.color, borderRadius:2, marginBottom:14, opacity:0.6 }}/>
                <div style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:10 }}>{s.title}</div>
                <div style={{ fontSize:13, color:'rgba(240,232,232,0.5)', lineHeight:1.7 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 24px', background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(232,137,122,0.08)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#E8897A', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>Feedback</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,38px)', fontWeight:900, letterSpacing:'-0.03em', color:'#fff' }}>What people say</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="hover-card" style={{ background:'rgba(255,255,255,0.035)', border:'1px solid rgba(232,137,122,0.1)', borderRadius:16, padding:'22px 24px' }}>
                <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                  {[1,2,3,4,5].map(i => <Star key={i} size={13} color="#E8897A" fill="#E8897A"/>)}
                </div>
                <p style={{ fontSize:13, color:'rgba(240,232,232,0.65)', lineHeight:1.75, marginBottom:18, fontStyle:'italic' }}>"{t.text}"</p>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{t.name}</div>
                <div style={{ fontSize:11, color:'rgba(240,232,232,0.35)' }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ position:'relative', zIndex:1, padding:'80px 24px', borderTop:'1px solid rgba(232,137,122,0.08)' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#E8897A', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>FAQ</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,38px)', fontWeight:900, letterSpacing:'-0.03em', color:'#fff' }}>Common questions</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.035)', border:`1px solid ${openFaq===i?'rgba(232,137,122,0.35)':'rgba(232,137,122,0.08)'}`, borderRadius:12, overflow:'hidden', transition:'border-color 0.2s' }}>
                <button onClick={() => setOpenFaq(openFaq===i?null:i)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'none', border:'none', cursor:'pointer', fontFamily:F, textAlign:'left', gap:12 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>{f.q}</span>
                  {openFaq===i ? <ChevronUp size={16} color="#E8897A"/> : <ChevronDown size={16} color="rgba(240,232,232,0.3)"/>}
                </button>
                {openFaq===i && (
                  <div style={{ padding:'0 20px 16px', fontSize:13, color:'rgba(240,232,232,0.55)', lineHeight:1.75 }}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position:'relative', zIndex:1, padding:'100px 24px', textAlign:'center', borderTop:'1px solid rgba(232,137,122,0.08)', background:'rgba(232,137,122,0.03)' }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(32px,5vw,54px)', fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1.08, marginBottom:18 }}>
            Scan your domain.<br/><span style={{ color:'#E8897A', textShadow:'0 0 40px rgba(232,137,122,0.4)' }}>Free, right now.</span>
          </h2>
          <p style={{ fontSize:15, color:'rgba(240,232,232,0.5)', marginBottom:40, lineHeight:1.75 }}>No account needed. Full DNS security audit — SPF, DKIM, DMARC, SSL, blacklists, propagation — in under 90 seconds.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => { window.scrollTo({top:0,behavior:'smooth'}); setTimeout(()=>document.querySelector('.scan-input')?.focus(),400) }}
              style={{ padding:'14px 36px', background:'#E8897A', color:'#1a0000', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:F, boxShadow:'0 4px 24px rgba(232,137,122,0.4)', transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
              onMouseLeave={e=>e.currentTarget.style.filter='brightness(1)'}>
              Audit your domain →
            </button>
            <button onClick={() => setPage('auth')}
              style={{ padding:'14px 28px', background:'rgba(255,255,255,0.06)', color:'rgba(240,232,232,0.7)', border:'1px solid rgba(232,137,122,0.2)', borderRadius:12, fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(232,137,122,0.5)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(232,137,122,0.2)'}>
              Create account
            </button>
          </div>
          <p style={{ fontSize:12, color:'rgba(240,232,232,0.2)', marginTop:16, letterSpacing:'0.02em' }}>No credit card · No signup required · PDF report included</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position:'relative', zIndex:1, background:'rgba(0,0,0,0.4)', borderTop:'1px solid rgba(232,137,122,0.1)', padding:'28px 40px' }}>
        <div style={{ maxWidth:1020, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:26, height:26, background:'#E8897A', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Radar size={14} color="#1a0000" strokeWidth={2.5}/>
            </div>
            <span style={{ fontSize:13, color:'rgba(240,232,232,0.5)', fontWeight:600 }}>DomainRadar</span>
            <span style={{ fontSize:12, color:'rgba(240,232,232,0.2)' }}>· Made with ♥</span>
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
            {[['Home','landing'],['Pricing','pricing'],['About','about'],['Developer','developer'],['Sign in','auth']].map(([l,id]) => (
              <button key={l} onClick={() => setPage(id)}
                style={{ fontSize:12, color:'rgba(240,232,232,0.3)', background:'none', border:'none', cursor:'pointer', padding:'4px 10px', borderRadius:6, fontFamily:F, transition:'color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.color='rgba(240,232,232,0.7)'}
                onMouseLeave={e=>e.currentTarget.style.color='rgba(240,232,232,0.3)'}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize:12, color:'rgba(240,232,232,0.2)' }}>© 2026 DomainRadar</div>
        </div>
      </footer>
    </div>
  )
}
