import { useState, useEffect } from 'react'
import { Radar, Shield, Globe, Lock, Mail, Zap, Activity, Search, Bell, Wrench, ChevronDown, ChevronUp, Star, ArrowRight } from 'lucide-react'

const F = "'Plus Jakarta Sans',system-ui,sans-serif"
const MONO = "'JetBrains Mono','Fira Code',monospace"

const FEATURES = [
  { icon: Mail,     color:'var(--lime)',   bg:'var(--lime-bg)',   bdr:'var(--lime-bdr)',   label:'Email Authentication', desc:'SPF, DKIM, DMARC, BIMI, MTA-STS — full audit with fix suggestions and DMARC journey wizard.' },
  { icon: Lock,     color:'var(--purple)', bg:'var(--purple-bg)', bdr:'var(--purple-bdr)', label:'SSL Certificates',     desc:'Expiry countdown, issuer, chain validity, HSTS, CT logs — from crt.sh and Certspotter.' },
  { icon: Globe,    color:'var(--teal)',   bg:'var(--teal-bg)',   bdr:'var(--teal-bdr)',   label:'DNS Propagation',      desc:'Global propagation across 4 resolvers — US, EU, APAC, AU. Inconsistency alerts.' },
  { icon: Shield,   color:'var(--steel)',  bg:'var(--steel-bg)',  bdr:'var(--steel-bdr)',  label:'Blacklist Monitoring', desc:'Checks 52 DNSBL lists in real time. One-click delist links for each flagged list.' },
  { icon: Zap,      color:'var(--lime)',   bg:'var(--lime-bg)',   bdr:'var(--lime-bdr)',   label:'DNS Auto-Fix',         desc:'Cloudflare API integration. Push correct SPF, DMARC, CAA records with one click.' },
  { icon: Activity, color:'var(--purple)', bg:'var(--purple-bg)', bdr:'var(--purple-bdr)', label:'Health Score',         desc:'Weighted 0–100 score across 6 categories. Delta vs last scan. Score history chart.' },
  { icon: Search,   color:'var(--teal)',   bg:'var(--teal-bg)',   bdr:'var(--teal-bdr)',   label:'Instant Audit',        desc:'Scan any domain without an account. Export a full compliance PDF — PCI DSS, CISA.' },
  { icon: Bell,     color:'var(--steel)',  bg:'var(--steel-bg)',  bdr:'var(--steel-bdr)',  label:'Alerts & Reports',     desc:'Email alerts on any DNS change. Webhook to Slack or Teams. Daily digest reports.' },
  { icon: Wrench,   color:'var(--lime)',   bg:'var(--lime-bg)',   bdr:'var(--lime-bdr)',   label:'Tools & Generators',   desc:'SPF generator, DMARC wizard, DKIM checker, deliverability test, SPF flattener.' },
]

const STEPS = [
  { n:'01', title:'Paste your domain',   body:'No account needed. Results in under 90 seconds — DNS, email auth, SSL, propagation, blacklists all at once.', color:'var(--teal)' },
  { n:'02', title:'Read the audit',      body:'Every finding explained in plain English. Health score, critical issues highlighted, fix instructions inline.', color:'var(--lime)' },
  { n:'03', title:'Fix with one click',  body:'Connect Cloudflare or GoDaddy once. DomainRadar pushes the correct record. You approve, it applies.', color:'var(--purple)' },
  { n:'04', title:'Monitor forever',     body:'6h or 24h rescans. Email alerts when anything changes. Certificate expiry warnings at 30, 7 and 1 day.', color:'var(--steel)' },
]

const FAQS = [
  { q:'Does it work on any domain?',      a:"Yes — scan any publicly reachable domain, yours or anyone else's. Monitoring and auto-fix require adding to your account." },
  { q:'What does the health score mean?', a:'A weighted 0–100 across DNS (25pts), email auth (30pts), SSL (20pts), propagation (10pts), security (10pts), blacklists (5pts). Below 60 means real risk.' },
  { q:'How does auto-fix work?',          a:'You add Cloudflare or GoDaddy API credentials once in Settings. DomainRadar builds the correct record and pushes it via their API. You confirm before anything changes.' },
  { q:'Is this only for developers?',     a:'No. Every finding has a plain-English explanation and step-by-step fix. Auto-fix means most issues resolve in one click with zero DNS knowledge.' },
  { q:'What is on the free plan?',        a:'Unlimited manual scans, one monitored domain, full results, PDF export, and all tools. Paid plans add more domains, faster intervals, team seats, and API access.' },
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
    <div style={{ fontFamily: F, background: 'var(--page)', color: 'var(--t1)', lineHeight: 1.6, overflowX: 'hidden' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.55s ease both; }
        .hover-card { transition: transform 0.18s ease, border-color 0.18s ease; }
        .hover-card:hover { transform: translateY(-4px); }
        .nav-lnk { font-size:13px; color:rgba(242,244,248,0.45); cursor:pointer; padding:5px 12px; border-radius:7px; font-family:${F}; background:none; border:none; transition:all 0.15s; font-weight:500; }
        .nav-lnk:hover { color:var(--t1); background:rgba(255,255,255,0.06); }
        .scan-inp:focus { border-color:var(--teal-bdr) !important; box-shadow:0 0 0 3px rgba(26,181,200,0.12) !important; outline:none; }
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, height:60, display:'flex', alignItems:'center', padding:'0 40px', justifyContent:'space-between', background: scrolled ? 'rgba(7,9,12,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(16px)' : 'none', borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent', transition:'all 0.2s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <div style={{ width:32, height:32, background:'var(--teal)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radar size={17} color="#07090c" strokeWidth={2.5}/>
          </div>
          <span style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.03em', color:'var(--t1)' }}>DomainRadar</span>
          <span style={{ fontSize:9, background:'var(--teal-bg)', color:'var(--teal)', padding:'2px 8px', borderRadius:8, fontWeight:700, border:'1px solid var(--teal-bdr)' }}>beta</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button className="nav-lnk" onClick={() => document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>Features</button>
          <button className="nav-lnk" onClick={() => document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}>How it works</button>
          <button className="nav-lnk" onClick={() => setPage('pricing')}>Pricing</button>
          <button className="nav-lnk" onClick={() => setPage('about')}>About</button>
          <div style={{ width:1, height:20, background:'var(--border-md)', margin:'0 8px' }}/>
          <button onClick={() => setPage('auth')} style={{ padding:'7px 14px', background:'transparent', color:'var(--t2)', border:'1px solid var(--border-md)', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--t1)';e.currentTarget.style.borderColor='var(--border-hi)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--t2)';e.currentTarget.style.borderColor='var(--border-md)'}}>
            Sign in
          </button>
          <button onClick={() => setPage('auth')} style={{ padding:'8px 18px', background:'var(--lime)', color:'#07090c', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
            onMouseLeave={e=>e.currentTarget.style.filter='none'}>
            Start free →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'120px 24px 80px', textAlign:'center' }}>
        <div className="fade-up" style={{ animationDelay:'0.05s', marginBottom:24 }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--teal-bg)', color:'var(--teal)', border:'1px solid var(--teal-bdr)', borderRadius:24, padding:'6px 16px', fontSize:12, fontWeight:600 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--teal)', display:'inline-block' }}/>
            Free DNS audit — no account needed
          </span>
        </div>

        <h1 className="fade-up" style={{ animationDelay:'0.1s', fontSize:'clamp(38px,6vw,72px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.02, marginBottom:22, maxWidth:860 }}>
          Your domain's security,<br/>
          <span style={{ color:'var(--lime)' }}>explained</span> and <span style={{ color:'var(--teal)' }}>fixed.</span>
        </h1>

        <p className="fade-up" style={{ animationDelay:'0.15s', fontSize:'clamp(15px,2vw,19px)', color:'var(--t2)', maxWidth:540, marginBottom:44, lineHeight:1.75 }}>
          Full DNS audit — SPF, DKIM, DMARC, SSL, blacklists, propagation — in 90 seconds. One-click auto-fix via Cloudflare.
        </p>

        {/* Scan box */}
        <div className="fade-up" style={{ animationDelay:'0.2s', width:'100%', maxWidth:560, marginBottom:14 }}>
          <form onSubmit={scan} style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1, position:'relative' }}>
              <Search size={15} color="var(--t3)" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="yourdomain.com"
                className="scan-inp"
                style={{ paddingLeft:40, fontSize:15, fontFamily:MONO }}/>
            </div>
            <button type="submit" style={{ padding:'0 28px', background:'var(--teal)', color:'#07090c', border:'none', borderRadius:'var(--r)', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:F, whiteSpace:'nowrap', transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
              onMouseLeave={e=>e.currentTarget.style.filter='none'}>
              Scan domain →
            </button>
          </form>
          <p style={{ fontSize:12, color:'var(--t3)', marginTop:10, letterSpacing:'0.02em' }}>No credit card · No signup required · Results in 90 seconds</p>
        </div>

        {/* Stats */}
        <div className="fade-up" style={{ animationDelay:'0.3s', display:'flex', gap:0, border:'1px solid var(--border-md)', borderRadius:14, overflow:'hidden', marginTop:52 }}>
          {[['52','blacklists checked','var(--lime)'],['4','global resolvers','var(--purple)'],['6','auth checks','var(--teal)'],['< 90s','full scan','var(--steel)']].map(([v,l,c],i) => (
            <div key={l} style={{ padding:'16px 28px', textAlign:'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.04em', color:c }}>{v}</div>
              <div style={{ fontSize:11, color:'var(--t3)', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:'100px 24px', background:'rgba(255,255,255,0.015)', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:1020, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>What we check</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:14, color:'var(--t1)' }}>Everything your domain needs</h2>
            <p style={{ fontSize:15, color:'var(--t2)', maxWidth:520, margin:'0 auto' }}>Nine categories. All live, all in parallel, all explained in plain English.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:16 }}>
            {FEATURES.map(f => (
              <div key={f.label} className="hover-card" style={{ background:'var(--card)', border:`1px solid ${f.bdr}`, borderRadius:16, padding:'22px 24px' }}>
                <div style={{ width:42, height:42, borderRadius:12, background:f.bg, border:`1px solid ${f.bdr}`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                  <f.icon size={20} color={f.color}/>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--t1)', marginBottom:8 }}>{f.label}</div>
                <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding:'100px 24px', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--lime)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>Process</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:900, letterSpacing:'-0.03em', color:'var(--t1)' }}>From scan to fixed in minutes</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:32 }}>
            {STEPS.map(s => (
              <div key={s.n}>
                <div style={{ fontSize:11, fontWeight:800, color:s.color, fontFamily:MONO, marginBottom:12, letterSpacing:'0.08em' }}>{s.n}</div>
                <div style={{ width:40, height:3, background:s.color, borderRadius:2, marginBottom:16, opacity:0.7 }}/>
                <div style={{ fontSize:16, fontWeight:700, color:'var(--t1)', marginBottom:10 }}>{s.title}</div>
                <div style={{ fontSize:13, color:'var(--t2)', lineHeight:1.7 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding:'80px 24px', background:'rgba(255,255,255,0.015)', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--purple)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>Feedback</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,38px)', fontWeight:900, letterSpacing:'-0.03em', color:'var(--t1)' }}>What people say</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {TESTIMONIALS.map((t, i) => {
              const colors = ['var(--teal)','var(--lime)','var(--purple)']
              const bgs = ['var(--teal-bg)','var(--lime-bg)','var(--purple-bg)']
              const bdrs = ['var(--teal-bdr)','var(--lime-bdr)','var(--purple-bdr)']
              return (
                <div key={t.name} className="hover-card" style={{ background:'var(--card)', border:`1px solid ${bdrs[i]}`, borderRadius:16, padding:'22px 24px' }}>
                  <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                    {[1,2,3,4,5].map(j => <Star key={j} size={13} color={colors[i]} fill={colors[i]}/>)}
                  </div>
                  <p style={{ fontSize:13, color:'var(--t2)', lineHeight:1.75, marginBottom:18, fontStyle:'italic' }}>"{t.text}"</p>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--t1)' }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'var(--t3)' }}>{t.role}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:'80px 24px', borderTop:'1px solid var(--border)' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--steel)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>FAQ</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,38px)', fontWeight:900, letterSpacing:'-0.03em', color:'var(--t1)' }}>Common questions</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ background:'var(--card)', border:`1px solid ${openFaq===i?'var(--teal-bdr)':'var(--border)'}`, borderRadius:12, overflow:'hidden', transition:'border-color 0.2s' }}>
                <button onClick={() => setOpenFaq(openFaq===i?null:i)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'none', border:'none', cursor:'pointer', fontFamily:F, textAlign:'left', gap:12 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--t1)' }}>{f.q}</span>
                  {openFaq===i ? <ChevronUp size={16} color="var(--teal)"/> : <ChevronDown size={16} color="var(--t3)"/>}
                </button>
                {openFaq===i && <div style={{ padding:'0 20px 16px', fontSize:13, color:'var(--t2)', lineHeight:1.75 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding:'100px 24px', textAlign:'center', borderTop:'1px solid var(--border)', background:'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth:560, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(32px,5vw,54px)', fontWeight:900, color:'var(--t1)', letterSpacing:'-0.04em', lineHeight:1.08, marginBottom:18 }}>
            Scan your domain.<br/><span style={{ color:'var(--lime)' }}>Free, right now.</span>
          </h2>
          <p style={{ fontSize:15, color:'var(--t2)', marginBottom:40, lineHeight:1.75 }}>No account needed. Full DNS security audit in under 90 seconds.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => { window.scrollTo({top:0,behavior:'smooth'}); setTimeout(()=>document.querySelector('.scan-inp')?.focus(),400) }}
              style={{ padding:'14px 36px', background:'var(--teal)', color:'#07090c', border:'none', borderRadius:'var(--r)', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
              onMouseLeave={e=>e.currentTarget.style.filter='none'}>
              Audit your domain →
            </button>
            <button onClick={() => setPage('auth')}
              style={{ padding:'14px 28px', background:'transparent', color:'var(--t2)', border:'1px solid var(--border-md)', borderRadius:'var(--r)', fontSize:14, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-hi)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-md)'}>
              Create account
            </button>
          </div>
          <p style={{ fontSize:12, color:'var(--t3)', marginTop:16 }}>No credit card · No signup required · PDF report included</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'rgba(0,0,0,0.3)', borderTop:'1px solid var(--border)', padding:'28px 40px' }}>
        <div style={{ maxWidth:1020, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:26, height:26, background:'var(--teal)', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Radar size={14} color="#07090c" strokeWidth={2.5}/>
            </div>
            <span style={{ fontSize:13, color:'var(--t2)', fontWeight:600 }}>DomainRadar</span>
            <span style={{ fontSize:12, color:'var(--t3)' }}>· Made with ♥</span>
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
            {[['Home','landing'],['Pricing','pricing'],['About','about'],['Developer','developer'],['Sign in','auth']].map(([l,id]) => (
              <button key={l} onClick={() => setPage(id)}
                style={{ fontSize:12, color:'var(--t3)', background:'none', border:'none', cursor:'pointer', padding:'4px 10px', borderRadius:6, fontFamily:F, transition:'color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--t1)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize:12, color:'var(--t3)' }}>© 2026 DomainRadar</div>
        </div>
      </footer>
    </div>
  )
}
