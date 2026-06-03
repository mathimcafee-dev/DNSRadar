import { useState, useEffect } from 'react'
import { Radar, Shield, Globe, Lock, Mail, Zap, Activity, Search, Bell, Wrench, ChevronDown, ChevronUp, Star } from 'lucide-react'

const F = "'Plus Jakarta Sans',system-ui,sans-serif"
const MONO = "'JetBrains Mono',monospace"

const FEATURES = [
  { icon:Mail,     c:'var(--or)', bg:'var(--or-bg)', bd:'var(--or-bdr)',  label:'Email Authentication', desc:'SPF, DKIM, DMARC, BIMI, MTA-STS — full audit with fix suggestions and DMARC wizard.' },
  { icon:Lock,     c:'var(--cy)', bg:'var(--cy-bg)', bd:'var(--cy-bdr)',  label:'SSL Certificates',     desc:'Expiry countdown, issuer, chain validity, HSTS, CT logs.' },
  { icon:Globe,    c:'var(--pk)', bg:'var(--pk-bg)', bd:'var(--pk-bdr)',  label:'DNS Propagation',      desc:'Global propagation across 4 resolvers — US, EU, APAC, AU. Inconsistency alerts.' },
  { icon:Shield,   c:'var(--pu)', bg:'var(--pu-bg)', bd:'var(--pu-bdr)',  label:'Blacklist Monitoring', desc:'Checks 52 DNSBL lists in real time. One-click delist links.' },
  { icon:Zap,      c:'var(--or)', bg:'var(--or-bg)', bd:'var(--or-bdr)',  label:'DNS Auto-Fix',         desc:'Cloudflare API integration. Push correct SPF, DMARC, CAA records with one click.' },
  { icon:Activity, c:'var(--cy)', bg:'var(--cy-bg)', bd:'var(--cy-bdr)',  label:'Health Score',         desc:'Weighted 0–100 score across 6 categories. Delta vs last scan.' },
  { icon:Search,   c:'var(--pk)', bg:'var(--pk-bg)', bd:'var(--pk-bdr)',  label:'Instant Audit',        desc:'Scan any domain without an account. Export full compliance PDF.' },
  { icon:Bell,     c:'var(--pu)', bg:'var(--pu-bg)', bd:'var(--pu-bdr)',  label:'Alerts & Reports',     desc:'Email alerts on any DNS change. Webhook to Slack. Daily digest.' },
  { icon:Wrench,   c:'var(--or)', bg:'var(--or-bg)', bd:'var(--or-bdr)',  label:'Tools & Generators',   desc:'SPF generator, DMARC wizard, DKIM checker, deliverability test.' },
]

const STEPS = [
  { n:'01', c:'var(--or)', title:'Paste your domain',  body:'No account needed. Results in under 90 seconds — DNS, email auth, SSL, propagation, blacklists all at once.' },
  { n:'02', c:'var(--cy)', title:'Read the audit',     body:'Every finding explained in plain English. Health score, critical issues highlighted, fix instructions inline.' },
  { n:'03', c:'var(--pk)', title:'Fix with one click', body:'Connect Cloudflare once. DomainRadar pushes the correct record. You approve, it applies.' },
  { n:'04', c:'var(--pu)', title:'Monitor forever',    body:'6h or 24h rescans. Email alerts when anything changes. Cert expiry warnings at 30, 7 and 1 day.' },
]

const FAQS = [
  { q:'Does it work on any domain?',      a:"Yes — scan any publicly reachable domain. Monitoring and auto-fix require adding to your account." },
  { q:'What does the health score mean?', a:'A weighted 0–100 across DNS (25), email auth (30), SSL (20), propagation (10), security (10), blacklists (5). Below 60 means real risk.' },
  { q:'How does auto-fix work?',          a:'Add Cloudflare API credentials once in Settings. DomainRadar builds the correct record and pushes it via their API. You confirm first.' },
  { q:'Is this only for developers?',     a:'No. Every finding has a plain-English explanation. Auto-fix means most issues resolve in one click with zero DNS knowledge.' },
  { q:'What is on the free plan?',        a:'Unlimited manual scans, one monitored domain, full results, PDF export, and all tools. Paid plans add more domains and team seats.' },
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
    const d = domain.trim().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0].toLowerCase()
    setScanDomain(d); setScanType('website'); setPage('scan')
  }

  const navBtn = { padding:'7px 14px', background:'transparent', color:'#4a5568', border:'1px solid #c8d6e5', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }

  return (
    <div style={{ fontFamily:F, background:'#f4f6f8', color:'#1a2332', lineHeight:1.6, overflowX:'hidden' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp 0.55s ease both}
        .hc{transition:transform 0.18s,border-color 0.18s}
        .hc:hover{transform:translateY(-4px)}
        .nl{font-size:13px;color:#4a5568;cursor:pointer;padding:5px 12px;border-radius:7px;font-family:${F};background:none;border:none;transition:all 0.15s;font-weight:500}
        .nl:hover{color:#1a2332;background:#f0f7ff}
        .si:focus{border-color:#0073d1!important;box-shadow:0 0 0 3px rgba(0,115,209,0.1)!important;outline:none}
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed',top:0,left:0,right:0,zIndex:200,height:60,display:'flex',alignItems:'center',padding:'0 40px',justifyContent:'space-between', background:'#ffffff', borderBottom:'1px solid #e2e8f0', boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition:'box-shadow 0.2s' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer' }} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
          <div style={{ width:32,height:32,background:'var(--or)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Radar size={17} color="#0c0907" strokeWidth={2.5}/>
          </div>
          <span style={{ fontSize:16,fontWeight:900,letterSpacing:'-.03em',color:'#1a2332' }}>Domain<span style={{ color:'var(--or)' }}>Radar</span></span>
          <span style={{ fontSize:9,background:'var(--or-bg)',color:'var(--or)',padding:'2px 8px',borderRadius:20,fontWeight:700,border:'1px solid var(--or-bdr)' }}>beta</span>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:4 }}>
          {[['Features','features'],['How it works','how'],['Pricing','pricing'],['About','about']].map(([l,id])=>(
            <button key={l} className="nl" onClick={()=>id==='features'||id==='how'?document.getElementById(id)?.scrollIntoView({behavior:'smooth'}):setPage(id)}>{l}</button>
          ))}
          <div style={{ width:1,height:20,background:'var(--border-md)',margin:'0 8px' }}/>
          <button onClick={()=>setPage('auth')} style={navBtn}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--t1)';e.currentTarget.style.borderColor='var(--or-bdr)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,241,236,0.45)';e.currentTarget.style.borderColor='rgba(255,107,43,0.12)'}}>
            Sign in
          </button>
          <button onClick={()=>setPage('auth')} style={{ padding:'8px 18px',background:'#0073d1',color:'#ffffff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:F,transition:'all 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
            onMouseLeave={e=>e.currentTarget.style.filter='none'}>
            Start free →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr',alignItems:'center',padding:'120px 60px 80px',gap:48,maxWidth:1200,margin:'0 auto' }}>
        <div>
          <div className="fu" style={{ animationDelay:'0.05s',marginBottom:20 }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:8,background:'#e8f3fc',color:'#0073d1',border:'1px solid #a8d0f0',borderRadius:24,padding:'6px 16px',fontSize:12,fontWeight:700 }}>
              <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--or)',display:'inline-block' }}/>
              Free DNS audit — no account needed
            </span>
          </div>
          <h1 className="fu" style={{ animationDelay:'0.1s',fontSize:'clamp(36px,4.5vw,60px)',fontWeight:900,letterSpacing:'-.04em',lineHeight:1.04,marginBottom:20,color:'var(--t1)' }}>
            Your domain's<br/><span style={{ color:'var(--or)' }}>security,</span><br/>audited and<br/><span style={{ color:'#0073d1' }}>fixed.</span>
          </h1>
          <p className="fu" style={{ animationDelay:'0.15s',fontSize:16,color:'#4a5568',maxWidth:460,marginBottom:36,lineHeight:1.75 }}>
            Full DNS audit — SPF, DKIM, DMARC, SSL, 52 blacklists, propagation — in 90 seconds. One-click auto-fix via Cloudflare.
          </p>
          <div className="fu" style={{ animationDelay:'0.2s',width:'100%',maxWidth:480 }}>
            <form onSubmit={scan} style={{ display:'flex',gap:10,marginBottom:10 }}>
              <div style={{ flex:1,position:'relative' }}>
                <Search size={15} color="var(--t3)" style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none' }}/>
                <input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="yourdomain.com" className="si"
                  style={{ paddingLeft:38,fontSize:14,fontFamily:MONO,background:'#ffffff',border:'1.5px solid #c8d6e5',borderRadius:10 }}/>
              </div>
              <button type="submit" style={{ padding:'0 24px',background:'#0073d1',color:'#ffffff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:F,whiteSpace:'nowrap',transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
                onMouseLeave={e=>e.currentTarget.style.filter='none'}>
                Scan →
              </button>
            </form>
            <p style={{ fontSize:12,color:'var(--t3)',letterSpacing:'0.02em' }}>No credit card · No signup · Results in 90 seconds</p>
          </div>
        </div>

        {/* Bold stat blocks */}
        <div className="fu" style={{ animationDelay:'0.25s',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          {[
            {v:'52',l:'Blacklists checked',bg:'var(--or)',dark:true},
            {v:'4', l:'Global resolvers',  bg:'var(--cy)',dark:true},
            {v:'6', l:'Auth checks',       bg:'var(--pk)',dark:false},
            {v:'<90s',l:'Full scan time',  bg:'var(--pu)',dark:false},
          ].map(s=>(
            <div key={s.l} style={{ background:s.bg,borderRadius:16,padding:'24px 22px' }}>
              <div style={{ fontSize:42,fontWeight:900,letterSpacing:'-.04em',color:'#ffffff',lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.09em',marginTop:8,color:'rgba(255,255,255,0.8)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:'100px 60px',background:'#ffffff',borderTop:'1px solid #e2e8f0',maxWidth:'100%' }}>
        <div style={{ maxWidth:1100,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:60 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'#0073d1',textTransform:'uppercase',letterSpacing:'.14em',marginBottom:12 }}>What we check</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)',fontWeight:900,letterSpacing:'-.03em',color:'#1a2332',marginBottom:14 }}>Everything your domain needs</h2>
            <p style={{ fontSize:15,color:'#4a5568',maxWidth:500,margin:'0 auto' }}>Nine categories. All live, all in parallel, all explained in plain English.</p>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14 }}>
            {FEATURES.map(f=>(
              <div key={f.label} className="hc" style={{ background:'#ffffff',border:'1px solid #e2e8f0',borderRadius:12,padding:'20px 22px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ width:42,height:42,borderRadius:12,background:f.bg,border:`1px solid ${f.bd}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16 }}>
                  <f.icon size={20} color={f.c}/>
                </div>
                <div style={{ fontSize:14,fontWeight:700,color:'var(--t1)',marginBottom:8 }}>{f.label}</div>
                <div style={{ fontSize:13,color:'var(--t2)',lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding:'100px 60px',borderTop:'1px solid #e2e8f0',maxWidth:'100%' }}>
        <div style={{ maxWidth:1000,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:60 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'#0073d1',textTransform:'uppercase',letterSpacing:'.14em',marginBottom:12 }}>Process</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,44px)',fontWeight:900,letterSpacing:'-.03em',color:'var(--t1)' }}>From scan to fixed in minutes</h2>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:36 }}>
            {STEPS.map(s=>(
              <div key={s.n}>
                <div style={{ fontSize:11,fontWeight:800,color:'#0073d1',fontFamily:MONO,marginBottom:12,letterSpacing:'.08em' }}>{s.n}</div>
                <div style={{ width:44,height:4,background:'#0073d1',borderRadius:2,marginBottom:16,opacity:0.5 }}/>
                <div style={{ fontSize:16,fontWeight:700,color:'#1a2332',marginBottom:10 }}>{s.title}</div>
                <div style={{ fontSize:13,color:'#4a5568',lineHeight:1.7 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:'80px 60px',background:'#ffffff',borderTop:'1px solid #e2e8f0',maxWidth:'100%' }}>
        <div style={{ maxWidth:700,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:48 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'var(--pk)',textTransform:'uppercase',letterSpacing:'.14em',marginBottom:12 }}>FAQ</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,38px)',fontWeight:900,letterSpacing:'-.03em',color:'var(--t1)' }}>Common questions</h2>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {FAQS.map((f,i)=>(
              <div key={i} style={{ background:'#ffffff',border:`1px solid ${openFaq===i?'#0073d1':'#e2e8f0'}`,borderRadius:12,overflow:'hidden',transition:'border-color 0.2s' }}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)}
                  style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',background:'none',border:'none',cursor:'pointer',fontFamily:F,textAlign:'left',gap:12 }}>
                  <span style={{ fontSize:14,fontWeight:700,color:'var(--t1)' }}>{f.q}</span>
                  {openFaq===i?<ChevronUp size={16} color="var(--or)"/>:<ChevronDown size={16} color="var(--t3)"/>}
                </button>
                {openFaq===i&&<div style={{ padding:'0 20px 16px',fontSize:13,color:'#4a5568',lineHeight:1.75 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'80px 60px',textAlign:'center',borderTop:'1px solid #e2e8f0',background:'#ffffff' }}>
        <div style={{ maxWidth:560,margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(32px,5vw,54px)',fontWeight:900,color:'#1a2332',letterSpacing:'-.04em',lineHeight:1.08,marginBottom:18 }}>
            Scan your domain.<br/><span style={{ color:'#0073d1' }}>Free, right now.</span>
          </h2>
          <p style={{ fontSize:15,color:'var(--t2)',marginBottom:40,lineHeight:1.75 }}>No account needed. Full DNS security audit in under 90 seconds.</p>
          <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
            <button onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>document.querySelector('.si')?.focus(),400)}}
              style={{ padding:'14px 36px',background:'#0073d1',color:'#ffffff',border:'none',borderRadius:10,fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:F,transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.filter='brightness(1.1)'}
              onMouseLeave={e=>e.currentTarget.style.filter='none'}>
              Audit your domain →
            </button>
            <button onClick={()=>setPage('auth')}
              style={{ padding:'14px 28px',background:'transparent',color:'var(--t2)',border:'1px solid var(--border-md)',borderRadius:10,fontSize:14,cursor:'pointer',fontFamily:F,transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-hi)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-md)'}>
              Create account
            </button>
          </div>
          <p style={{ fontSize:12,color:'var(--t3)',marginTop:16 }}>No credit card · No signup required · PDF report included</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#f4f6f8',borderTop:'1px solid #e2e8f0',padding:'28px 60px' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{ width:26,height:26,background:'var(--or)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Radar size={14} color="#0c0907" strokeWidth={2.5}/>
            </div>
            <span style={{ fontSize:13,color:'#4a5568',fontWeight:700 }}>DomainRadar</span>
            <span style={{ fontSize:12,color:'var(--t3)' }}>· Made with ♥</span>
          </div>
          <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
            {[['Home','landing'],['Pricing','pricing'],['About','about'],['Developer','developer'],['Sign in','auth']].map(([l,id])=>(
              <button key={l} onClick={()=>setPage(id)}
                style={{ fontSize:12,color:'var(--t3)',background:'none',border:'none',cursor:'pointer',padding:'4px 10px',borderRadius:6,fontFamily:F,transition:'color 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.color='var(--t1)'}
                onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize:12,color:'var(--t3)' }}>© 2026 DomainRadar</div>
        </div>
      </footer>
    </div>
  )
}
