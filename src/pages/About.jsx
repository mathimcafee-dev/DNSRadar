import { useState } from 'react'
import { Radar, Shield, Globe, Zap, Mail, Lock, Heart, Target, Users, CheckCircle, ArrowRight, Star, Code, BarChart2, Bell } from 'lucide-react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"

const VALUES = [
  { icon: Shield, color:'#16a34a', bg:'#f0fdf4', bd:'#bbf7d0', title:'Security first',     body:'Every feature exists to make real security improvements, not just surface metrics. We explain every finding in plain English and provide exact fix instructions — because a warning with no action is useless.' },
  { icon: Target, color:'#2563eb', bg:'#eff6ff', bd:'#bfdbfe', title:'Radical simplicity',  body:'DNS and email auth are intimidating. We designed DomainRadar to be approachable for domain owners who have never opened a DNS panel — while staying rigorous enough for security engineers.' },
  { icon: Zap,    color:'#d97706', bg:'#fffbeb', bd:'#fde68a', title:'Fix, don\'t just flag', body:'A score is worthless without a path to improvement. Auto-fix via Cloudflare API, DMARC journey wizard, SPF flattener, and DKIM rotation assistant mean problems get resolved — not just identified.' },
  { icon: Heart,  color:'#dc2626', bg:'#fef2f2', bd:'#fecaca', title:'Indie & SMB focus',   body:'Enterprise CLM tools cost thousands per year and require a dedicated security team. DomainRadar gives indie developers, small businesses, agencies, and nonprofits the same visibility for free.' },
  { icon: Globe,  color:'#7c3aed', bg:'#f5f3ff', bd:'#ddd6fe', title:'Transparent by default', body:'All pricing is public. The tech stack is documented. The scan logic is explainable. No black-box scores, no fake urgency, no upsell traps.' },
  { icon: Code,   color:'#0891b2', bg:'#ecfeff', bd:'#a5f3fc', title:'Developer-friendly',  body:'Public scan API, documented response shapes, code examples that actually work. DomainRadar is designed to be integrated — into CI pipelines, onboarding checklists, and client reports.' },
]

const MILESTONES = [
  { date:'Jan 2026',  dot:'#16a34a', title:'The frustration',  body:'After years managing PKI at enterprise scale — DigiCert, TheSSLStore, GoGetSSL — I kept seeing the same pattern: small businesses and indie developers were getting blacklisted, spoofed, and having certs expire without knowing it. Enterprise CLM tools cost €5,000+/year. There was nothing for the rest of the market.' },
  { date:'Feb 2026',  dot:'#16a34a', title:'First scan',        body:'Built the first DNS scanner over a weekend. SPF, DKIM, DMARC, SSL, propagation in a single parallel scan. Showed it to 10 friends with domains. All 10 found critical issues they had no idea existed. One had been on 3 blacklists for 6 months.' },
  { date:'Mar 2026',  dot:'#16a34a', title:'Auto-fix',          body:'Added Cloudflare API integration so users could push correct DNS records without opening cPanel. Tested on freecerts.site — fixed a missing DMARC record in 4 seconds. The reaction from early users was clear: this changes how accessible DNS security is.' },
  { date:'Apr 2026',  dot:'#16a34a', title:'Full feature set',  body:'Monitoring, email alerts, SSL certificate tracking, DMARC journey wizard, deliverability testing, SPF flattener, DKIM rotation guide, compliance PDF export. Built every feature because I hit the problem personally or heard about it from a user.' },
  { date:'May 2026',  dot:'#16a34a', title:'Public beta',       body:'Launched with 9 live feature categories, instant audit (no account required), Slack/Teams webhook alerts, embeddable health badge, and full PDF export. The mission remains: give everyone enterprise-grade DNS visibility, free.' },
]

const BUILT_WITH = [
  { name:'React + Vite',       desc:'Fast SPA, no framework overhead' },
  { name:'Supabase',           desc:'Postgres, Edge Functions, Auth, Realtime' },
  { name:'Deno (Edge Fns)',    desc:'Parallel DNS checks in <2s globally' },
  { name:'Vercel',             desc:'Auto-deploy, global CDN' },
  { name:'Cloudflare DoH',     desc:'DNS over HTTPS, no resolver dependency' },
  { name:'Resend',             desc:'Transactional email for alerts' },
  { name:'crt.sh / Certspotter', desc:'CT logs for SSL cert data' },
  { name:'Claude (Anthropic)', desc:'AI co-developer — pair programming every feature' },
]

const WHAT_WE_CHECK = [
  { icon: Mail,    label:'SPF / DKIM / DMARC',      desc:'Full email authentication audit. Depth analysis, key size validation, policy grading, fix suggestions.' },
  { icon: Lock,    label:'SSL Certificates',         desc:'Expiry countdown, issuer, chain validity, HSTS, CT log status. Alerts at 30, 7, and 1 day.' },
  { icon: Globe,   label:'DNS Propagation',          desc:'Consistency check across 4 global resolvers. Flags records that haven\'t propagated everywhere.' },
  { icon: Shield,  label:'Blacklist monitoring',     desc:'52 DNSBL checks in real time. Direct delist links for every listed item.' },
  { icon: Zap,     label:'DNS Auto-Fix',             desc:'Cloudflare API integration. Push correct SPF, DMARC, CAA with one click. Change logged.' },
  { icon: BarChart2,label:'Score & history',         desc:'Weighted 0–100 health score. Delta vs last scan. Score history chart over time.' },
]

export default function About({ setPage }) {
  const [openSection, setOpenSection] = useState(null)

  const NavLink = ({ label, id }) => (
    <span style={{ fontSize:13, color:'#555', cursor:'pointer', padding:'4px 8px', borderRadius:6 }}
      onClick={() => document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}
      onMouseEnter={e=>e.currentTarget.style.color='#111'}
      onMouseLeave={e=>e.currentTarget.style.color='#555'}>{label}</span>
  )

  return (
    <div style={{ fontFamily:F, background:'#fff', color:'#111', minHeight:'100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation: fadeUp 0.5s ease both; }
        .section-label { font-size:11px; font-weight:700; color:#16a34a; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:12px; }
        .h2 { font-size:clamp(26px,4vw,38px); font-weight:900; letter-spacing:-0.03em; line-height:1.15; }
        .body-text { font-size:15px; color:#555; line-height:1.8; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setPage('landing')}>
          <div style={{ width:30, height:30, background:'#16a34a', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Radar size={16} color="#fff" strokeWidth={2.5}/>
          </div>
          <span style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.03em' }}>DomainRadar</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <NavLink label="Our story" id="story"/>
          <NavLink label="Mission" id="mission"/>
          <NavLink label="What we check" id="checks"/>
          <NavLink label="Team" id="team"/>
          <div style={{ width:1, height:18, background:'#e5e7eb', margin:'0 4px' }}/>
          <button onClick={() => setPage('landing')} style={{ padding:'6px 12px', background:'transparent', color:'#555', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, cursor:'pointer', fontFamily:F }}>← Back</button>
          <button onClick={() => setPage('auth')} style={{ padding:'6px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Start free</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding:'80px 24px 72px', background:'#fafafa', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div className="fade section-label">About DomainRadar</div>
          <h1 className="fade" style={{ fontSize:'clamp(36px,6vw,60px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.05, marginBottom:24, animationDelay:'0.05s' }}>
            We believe every domain owner deserves enterprise-grade security visibility.
          </h1>
          <p className="fade body-text" style={{ marginBottom:28, animationDelay:'0.1s', maxWidth:620 }}>
            DomainRadar was built by a Certified PKI Specialist who spent years working with the world's largest certificate authorities — DigiCert, TheSSLStore, GoGetSSL — and watched small businesses get blacklisted, spoofed, and exposed because they had no tooling. Enterprise CLM tools cost thousands. We changed that.
          </p>
          <div className="fade" style={{ display:'flex', gap:12, flexWrap:'wrap', animationDelay:'0.15s' }}>
            <button onClick={() => setPage('auth')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'11px 22px', background:'#111', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F }}>
              Start scanning free <ArrowRight size={14}/>
            </button>
            <button onClick={() => setPage('audit')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'11px 18px', background:'transparent', color:'#374151', border:'1px solid #e5e7eb', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:F }}>
              📄 Try instant audit
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <div style={{ background:'#111', padding:'32px 24px' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:24, textAlign:'center' }}>
          {[
            ['< 90s',   'Full scan time'],
            ['52',      'Blacklists checked'],
            ['9',       'Check categories'],
            ['4',       'Global resolvers'],
            ['Free',    'To start forever'],
            ['1-click', 'DNS auto-fix'],
          ].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-0.04em', marginBottom:4 }}>{v}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MISSION ── */}
      <section id="mission" style={{ padding:'80px 24px', background:'#fff' }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div className="section-label">Mission</div>
          <h2 className="h2" style={{ marginBottom:28 }}>Why DomainRadar exists</h2>
          <div style={{ background:'#0d1117', borderRadius:16, padding:'36px 40px', marginBottom:36 }}>
            <div style={{ fontSize:'clamp(17px,2.5vw,22px)', fontWeight:700, color:'#fff', lineHeight:1.6, letterSpacing:'-0.01em' }}>
              "Give every domain owner — indie developer, small business, nonprofit — the same security visibility that enterprise teams pay thousands for. Explained in plain English. Fixed with one click."
            </div>
            <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, background:'rgba(22,163,74,0.15)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Shield size={17} color="#4ade80"/>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#f9fafb' }}>Spartan (Mathi)</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>Founder · Certified PKI Specialist · DigiCert Partner APAC</div>
              </div>
            </div>
          </div>
          <p className="body-text" style={{ marginBottom:20 }}>
            DNS security has always had a tooling problem. Enterprises get Discovery tools, CLM platforms, and dedicated PKI teams. Everyone else gets a confusing cPanel and a broken email that says "your cert expired."
          </p>
          <p className="body-text">
            DomainRadar closes that gap. One scan, 90 seconds, full picture — then actionable fixes, not just a list of problems. The auto-fix layer means a domain owner who has never heard of DMARC can secure their email setup in under five minutes.
          </p>
        </div>
      </section>

      {/* ── STORY / TIMELINE ── */}
      <section id="story" style={{ padding:'80px 24px', background:'#fafafa', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div className="section-label">Our story</div>
          <h2 className="h2" style={{ marginBottom:48 }}>How we got here</h2>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:11, top:0, bottom:24, width:2, background:'#e5e7eb', borderRadius:2 }}/>
            {MILESTONES.map((m, i) => (
              <div key={m.title} style={{ position:'relative', paddingLeft:36, paddingBottom:40 }}>
                <div style={{ position:'absolute', left:5, top:3, width:16, height:16, borderRadius:'50%', background:m.dot, border:'3px solid #fafafa', boxSizing:'border-box' }}/>
                <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:5 }}>{m.date}</div>
                <div style={{ fontSize:17, fontWeight:800, color:'#111', letterSpacing:'-0.02em', marginBottom:8 }}>{m.title}</div>
                <p style={{ fontSize:14, color:'#555', lineHeight:1.8, margin:0 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding:'80px 24px', background:'#fff' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div className="section-label">What we believe</div>
            <h2 className="h2">Our values</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:18 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ background:'#fafafa', border:`1px solid ${v.bd}`, borderTop:`3px solid ${v.color}`, borderRadius:14, padding:'24px 22px' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:v.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <v.icon size={20} color={v.color}/>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:'#111', marginBottom:8 }}>{v.title}</div>
                <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.7 }}>{v.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE CHECK ── */}
      <section id="checks" style={{ padding:'80px 24px', background:'#fafafa', borderTop:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <div className="section-label">Coverage</div>
            <h2 className="h2">What every scan checks</h2>
            <p style={{ fontSize:15, color:'#6b7280', marginTop:12, maxWidth:480, margin:'12px auto 0' }}>All checks run in parallel. Full results in under 90 seconds.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
            {WHAT_WE_CHECK.map(c => (
              <div key={c.label} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, borderRadius:9, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <c.icon size={17} color="#16a34a"/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#111', marginBottom:4 }}>{c.label}</div>
                  <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.6 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" style={{ padding:'80px 24px', background:'#fff', borderTop:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:760, margin:'0 auto' }}>
          <div className="section-label">The team</div>
          <h2 className="h2" style={{ marginBottom:36 }}>Who built this</h2>

          {/* Founder card */}
          <div style={{ background:'#fafafa', border:'1px solid #e5e7eb', borderRadius:16, padding:'32px', marginBottom:24 }}>
            <div style={{ display:'flex', gap:22, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ width:72, height:72, borderRadius:16, background:'#f0fdf4', border:'2px solid #86efac', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Shield size={32} color="#16a34a"/>
              </div>
              <div style={{ flex:1, minWidth:220 }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#111', letterSpacing:'-0.03em', marginBottom:3 }}>Spartan (Mathi)</div>
                <div style={{ fontSize:13, color:'#16a34a', fontWeight:700, marginBottom:14 }}>Founder · Certified PKI Specialist · Partner Account Manager APAC @ DigiCert Inc.</div>
                <p style={{ fontSize:14, color:'#555', lineHeight:1.8, marginBottom:14 }}>
                  10+ years in digital security and PKI. Works with channel partners including TheSSLStore.com and GoGetSSL.com across the Asia-Pacific region. MSc from Kongu Engineering College. Based in the Netherlands.
                </p>
                <p style={{ fontSize:14, color:'#555', lineHeight:1.8, marginBottom:16 }}>
                  Has personally overseen certificate issuance, revocation, and lifecycle management at enterprise scale. DomainRadar is the product he wished existed when he started seeing small businesses fall through the cracks of the PKI ecosystem.
                </p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['Certified PKI Specialist','DigiCert Partner','APAC Region','Based in NL'].map(tag => (
                    <span key={tag} style={{ fontSize:11, fontWeight:600, padding:'3px 10px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:20 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI co-developer note */}
          <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:'20px 24px', marginBottom:24, display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Code size={17} color="#2563eb"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#111', marginBottom:4 }}>AI co-developer: Claude (Anthropic)</div>
              <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.7 }}>
                Every feature in DomainRadar was pair-programmed with Claude Sonnet. Full-stack: React components, Supabase edge functions, DB migrations, deployment pipelines. The product ships faster, but the domain expertise and product decisions come from a human who has spent a decade in PKI.
              </div>
            </div>
          </div>

          <p style={{ fontSize:13, color:'#9ca3af', lineHeight:1.7, textAlign:'center' }}>
            DomainRadar is a one-person product with real PKI expertise behind every decision.<br/>
            Questions? <a href="mailto:support@dnsradar.easysecurity.in" style={{ color:'#16a34a' }}>support@dnsradar.easysecurity.in</a>
          </p>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ padding:'72px 24px', background:'#0d1117', borderTop:'1px solid #1f2937' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{ marginBottom:40 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#4ade80', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Under the hood</div>
            <h2 style={{ fontSize:28, fontWeight:900, color:'#f9fafb', letterSpacing:'-0.03em' }}>Built with</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {BUILT_WITH.map(s => (
              <div key={s.name} style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a' }}/>
                  <span style={{ fontSize:13, fontWeight:700, color:'#f9fafb' }}>{s.name}</span>
                </div>
                <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'72px 24px', background:'#f0fdf4', borderTop:'1px solid #bbf7d0' }}>
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
          <Lock size={36} color="#16a34a" style={{ marginBottom:16 }}/>
          <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:14 }}>Ready to check your domain?</h2>
          <p style={{ fontSize:15, color:'#4b7a57', lineHeight:1.8, marginBottom:32, maxWidth:460, margin:'0 auto 32px' }}>
            Free scan, no account required. See your health score, every issue, and exactly how to fix it in under 90 seconds.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => setPage('auth')} style={{ padding:'12px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:F }}>Start free →</button>
            <button onClick={() => setPage('audit')} style={{ padding:'12px 22px', background:'#fff', color:'#374151', border:'1px solid #bbf7d0', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:F }}>📄 Instant audit</button>
            <button onClick={() => setPage('pricing')} style={{ padding:'12px 22px', background:'transparent', color:'#15803d', border:'1px solid #86efac', borderRadius:10, fontSize:14, cursor:'pointer', fontFamily:F }}>See pricing</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
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
            {[['Landing','landing'],['Pricing','pricing'],['Developer','developer'],['Free Audit','audit'],['Sign in','auth']].map(([l,id]) => (
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
