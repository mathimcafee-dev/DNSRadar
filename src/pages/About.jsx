import { Radar, Shield, Globe, Zap, Mail, Lock, Heart, Target, Code, BarChart2, Bell, ArrowRight } from 'lucide-react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"

const VALUES = [
  { icon: Shield,    color:'#16a34a', bg:'#f0fdf4', bd:'#bbf7d0', title:'Security first',         body:'Every feature exists to make real security improvements, not surface metrics. We explain every finding in plain English with exact remediation steps — because a warning without an action resolves nothing.' },
  { icon: Target,    color:'#2563eb', bg:'#eff6ff', bd:'#bfdbfe', title:'Radical simplicity',      body:'DNS and email authentication are genuinely complex. DomainRadar is designed for domain owners who have never opened a DNS panel, without sacrificing depth for those who have.' },
  { icon: Zap,       color:'#d97706', bg:'#fffbeb', bd:'#fde68a', title:'Fix, don\'t just flag',   body:'A score without a path to improvement is noise. Auto-fix via Cloudflare API, DMARC journey wizard, SPF flattener, and DKIM rotation guide mean issues get resolved — not just listed.' },
  { icon: Heart,     color:'#dc2626', bg:'#fef2f2', bd:'#fecaca', title:'Accessible to everyone',  body:'Professional domain security tooling has historically required significant budget and dedicated technical staff. DomainRadar makes the same quality of visibility available to indie developers, small businesses, and nonprofits for free.' },
  { icon: Globe,     color:'#7c3aed', bg:'#f5f3ff', bd:'#ddd6fe', title:'Transparent by default',  body:'Pricing is public. Scan logic is documented. Scores are explained. No black-box ratings, no fabricated urgency, no hidden upsells.' },
  { icon: Code,      color:'#0891b2', bg:'#ecfeff', bd:'#a5f3fc', title:'Built for integration',   body:'Public scan API, documented response types, and working code examples. DomainRadar fits into CI pipelines, client onboarding checklists, and automated reporting workflows.' },
]

const MILESTONES = [
  {
    date: 'The problem',
    title: 'A gap in the market',
    body: 'Domain security has always had a tooling disparity. Large organisations have dedicated monitoring, automated alerting, and security teams reviewing configuration drift. Smaller organisations — independent developers, growing businesses, nonprofits — have the same attack surface but none of the same visibility. The consequences are concrete: spoofed email domains, missed blacklist entries, expired certificates causing unexpected outages. None of these are sophisticated attacks. All of them are preventable with the right information.',
  },
  {
    date: 'The approach',
    title: 'One scan, full picture',
    body: 'The core design principle of DomainRadar is consolidation. DNS health information exists — in certificate transparency logs, DNS resolvers, DNSBL databases, and public DNS records — but it is scattered across dozens of manual checks. DomainRadar runs all of them in parallel and surfaces the results in a single, coherent view with a weighted health score. SPF, DKIM, DMARC, SSL certificate validity, global propagation consistency, and blacklist status — in under 90 seconds, with no prior configuration.',
  },
  {
    date: 'The insight',
    title: 'Explanation matters as much as detection',
    body: 'Early testing showed a consistent pattern: users could see that something was wrong but did not know what to do about it. Technical output without context — a missing DMARC record, a failing SPF lookup count — had limited value for the intended audience. Every finding in DomainRadar includes a plain-English explanation of what the issue means, why it matters, and the specific steps required to resolve it. For the most common problems, those steps are automated.',
  },
  {
    date: 'The platform',
    title: 'From audit to active remediation',
    body: 'The second phase of development moved DomainRadar from a read-only auditor to an active remediation platform. Cloudflare API integration enabled one-click DNS record creation and updates — correct SPF, DMARC, and CAA records pushed programmatically, with a confirmation step and full audit log of every change made. Continuous monitoring, configurable email alerts, SSL expiry warnings, a DMARC policy progression wizard, and a suite of DNS and email security generators followed. The benchmark: a domain owner with no prior DNS experience should be able to reach a passing configuration in under ten minutes.',
  },
  {
    date: 'Today',
    title: 'Public beta',
    body: 'DomainRadar is live with nine check categories, instant domain audits requiring no account, one-click DNS auto-fix, compliance report exports covering PCI DSS v4 and the Google/Yahoo bulk sender mandate, Slack and Teams integrations, embeddable health badges, a complete tools suite, and continuous monitoring with alerting. Development is ongoing. DMARC aggregate report parsing, geographic threat mapping, and a full API are in active development. The mission has not changed: professional-grade domain security visibility, accessible to everyone.',
  },
]

const CHECKS = [
  { icon: Mail,      label:'Email authentication', desc:'SPF depth analysis, DKIM key validation, DMARC policy grading, BIMI detection, MTA-STS and TLS-RPT. Full alignment with Google/Yahoo bulk sender requirements and PCI DSS v4.' },
  { icon: Lock,      label:'SSL certificates',      desc:'Expiry countdown, issuer identification, chain validity, HSTS status, CT log verification. Automated alerts at 30, 7, and 1 day before expiry.' },
  { icon: Globe,     label:'DNS propagation',       desc:'Real-time consistency check across four global resolvers — Americas, Europe, Asia-Pacific, and Oceania. Flags records that have not propagated universally.' },
  { icon: Shield,    label:'Blacklist monitoring',  desc:'52 DNSBL checks in a single scan. Direct delisting links for every flagged entry. Critical alerts the moment a listing is detected.' },
  { icon: Zap,       label:'Auto-remediation',      desc:'Cloudflare API integration for one-click DNS record creation and updates. Confirmation required before any change. Every modification logged with a full audit trail.' },
  { icon: BarChart2, label:'Health scoring',        desc:'Weighted 0–100 score across six categories. Delta tracking versus the previous scan. Score history to measure configuration improvement over time.' },
]

export default function About({ setPage }) {
  const scroll = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ fontFamily: F, background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`
        .sl { font-size:11px; font-weight:700; color:#16a34a; text-transform:uppercase; letter-spacing:0.12em; display:block; margin-bottom:12px; }
        .h1 { font-size:clamp(34px,5.5vw,56px); font-weight:900; letter-spacing:-0.04em; line-height:1.05; }
        .h2 { font-size:clamp(26px,3.5vw,36px); font-weight:900; letter-spacing:-0.03em; line-height:1.15; }
        .body { font-size:15px; color:#555; line-height:1.85; }
        .nb { font-size:13px; color:#555; cursor:pointer; padding:5px 10px; border-radius:6px; background:none; border:none; font-family:${F}; transition:color 0.15s,background 0.15s; }
        .nb:hover { color:#111; background:#f3f4f6; }
        .hc { transition:box-shadow 0.15s,transform 0.15s; }
        .hc:hover { box-shadow:0 6px 20px rgba(0,0,0,0.08); transform:translateY(-2px); }
      `}</style>

      {/* NAV */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setPage('landing')}>
          <div style={{ width:30, height:30, background:'#16a34a', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radar size={15} color="#fff" strokeWidth={2.5}/>
          </div>
          <span style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.03em' }}>DomainRadar</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <button className="nb" onClick={() => scroll('mission')}>Mission</button>
          <button className="nb" onClick={() => scroll('story')}>Our story</button>
          <button className="nb" onClick={() => scroll('coverage')}>Coverage</button>
          <button className="nb" onClick={() => scroll('team')}>Team</button>
          <div style={{ width:1, height:18, background:'#e5e7eb', margin:'0 6px' }}/>
          <button onClick={() => setPage('landing')} style={{ padding:'6px 12px', background:'transparent', color:'#555', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, cursor:'pointer', fontFamily:F }}>← Home</button>
          <button onClick={() => setPage('auth')} style={{ padding:'6px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Start free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding:'88px 24px 72px', background:'#fafafa', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:780, margin:'0 auto' }}>
          <span className="sl">About DomainRadar</span>
          <h1 className="h1" style={{ marginBottom:28 }}>
            Domain security,<br/>made accessible.
          </h1>
          <p className="body" style={{ marginBottom:18, maxWidth:620 }}>
            DomainRadar was built by a domain security specialist with extensive experience in digital certificate infrastructure and email authentication — working across enterprise and partner networks to identify, diagnose, and remediate the same configuration failures at scale.
          </p>
          <p className="body" style={{ marginBottom:36, maxWidth:620 }}>
            The product was built on a straightforward observation: the information needed to secure a domain is publicly available and technically accessible, but the tooling to surface it clearly has always been built for large organisations. DomainRadar exists to change that — a full security audit in under 90 seconds, with explanations that make sense and fixes that actually work.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button onClick={() => setPage('auth')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'11px 24px', background:'#111', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F }}>
              Start scanning free <ArrowRight size={14}/>
            </button>
            <button onClick={() => setPage('audit')} style={{ padding:'11px 18px', background:'transparent', color:'#374151', border:'1px solid #e5e7eb', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:F }}>
              📄 Try instant audit
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ background:'#111', padding:'36px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:28, textAlign:'center' }}>
          {[['< 90s','Full scan time'],['52','Blacklists checked'],['9','Check categories'],['4','Global resolvers'],['Free','To start, forever'],['1-click','DNS auto-fix']].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1, marginBottom:6 }}>{v}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MISSION */}
      <section id="mission" style={{ padding:'88px 24px', background:'#fff' }}>
        <div style={{ maxWidth:780, margin:'0 auto' }}>
          <span className="sl">Mission</span>
          <h2 className="h2" style={{ marginBottom:32 }}>Why DomainRadar exists</h2>
          <div style={{ background:'#0d1117', borderRadius:16, padding:'40px 44px', marginBottom:40 }}>
            <p style={{ fontSize:'clamp(17px,2.2vw,21px)', fontWeight:600, color:'#f9fafb', lineHeight:1.65, letterSpacing:'-0.01em', margin:0, fontStyle:'italic' }}>
              "Every domain owner — independent developer, small business, nonprofit — deserves to know whether their domain is configured correctly. Not buried in technical documentation. Not after something has already gone wrong. Clearly, proactively, and with a straightforward path to fixing it."
            </p>
            <div style={{ marginTop:22, paddingTop:20, borderTop:'1px solid #1f2937', fontSize:13, color:'rgba(255,255,255,0.35)' }}>
              — Spartan, Founder · DomainRadar
            </div>
          </div>
          <p className="body" style={{ marginBottom:20 }}>
            Domain security failures are rarely the result of negligence. They happen because the relevant information — whether an SPF record is correctly configured, whether a domain appears on a blocklist, whether a certificate is approaching expiry — is scattered, technical, and not surfaced proactively. Organisations with dedicated security teams have tooling to monitor all of this continuously. Most domain owners do not.
          </p>
          <p className="body">
            The consequences are real: spoofed email domains that damage sender reputation, blacklist entries that silently kill email deliverability, expired certificates that take services offline without warning. DomainRadar consolidates all of this into a single, clear audit — and provides the context and tooling to act on what it finds.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section id="story" style={{ padding:'88px 24px', background:'#fafafa', borderTop:'1px solid #e5e7eb', borderBottom:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:780, margin:'0 auto' }}>
          <span className="sl">Our story</span>
          <h2 className="h2" style={{ marginBottom:12 }}>How DomainRadar was built</h2>
          <p className="body" style={{ marginBottom:52, maxWidth:560 }}>A product built from direct experience — the same problems, seen repeatedly, now solved systematically.</p>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:12, top:6, bottom:0, width:1, background:'#e5e7eb' }}/>
            {MILESTONES.map((m, i) => (
              <div key={m.title} style={{ position:'relative', paddingLeft:40, paddingBottom: i < MILESTONES.length-1 ? 52 : 0 }}>
                <div style={{ position:'absolute', left:7, top:4, width:11, height:11, borderRadius:'50%', background:'#16a34a', border:'2px solid #fafafa' }}/>
                <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>{m.date}</div>
                <div style={{ fontSize:18, fontWeight:800, color:'#111', letterSpacing:'-0.02em', marginBottom:10, lineHeight:1.2 }}>{m.title}</div>
                <p style={{ fontSize:14, color:'#555', lineHeight:1.9, margin:0 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section style={{ padding:'88px 24px', background:'#fff' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <span className="sl" style={{ textAlign:'center' }}>Principles</span>
            <h2 className="h2">What we stand for</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:18 }}>
            {VALUES.map(v => (
              <div key={v.title} className="hc" style={{ background:'#fafafa', border:`1px solid ${v.bd}`, borderTop:`3px solid ${v.color}`, borderRadius:14, padding:'24px 22px' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:v.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <v.icon size={19} color={v.color}/>
                </div>
                <div style={{ fontSize:15, fontWeight:700, color:'#111', marginBottom:9 }}>{v.title}</div>
                <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.75 }}>{v.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COVERAGE */}
      <section id="coverage" style={{ padding:'88px 24px', background:'#fafafa', borderTop:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:960, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <span className="sl" style={{ textAlign:'center' }}>What we check</span>
            <h2 className="h2" style={{ marginBottom:12 }}>Complete domain security coverage</h2>
            <p style={{ fontSize:15, color:'#6b7280', maxWidth:460, margin:'0 auto' }}>All checks run in parallel. Full results in under 90 seconds. No prior configuration required.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
            {CHECKS.map(c => (
              <div key={c.label} className="hc" style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'20px 22px', display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ width:38, height:38, borderRadius:9, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <c.icon size={17} color="#16a34a"/>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:5 }}>{c.label}</div>
                  <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.7 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" style={{ padding:'88px 24px', background:'#fff', borderTop:'1px solid #e5e7eb' }}>
        <div style={{ maxWidth:780, margin:'0 auto' }}>
          <span className="sl">The team</span>
          <h2 className="h2" style={{ marginBottom:36 }}>Who built DomainRadar</h2>
          <div style={{ background:'#fafafa', border:'1px solid #e5e7eb', borderRadius:16, padding:'36px', marginBottom:28 }}>
            <div style={{ display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ width:64, height:64, borderRadius:16, background:'#f0fdf4', border:'1.5px solid #86efac', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Shield size={28} color="#16a34a"/>
              </div>
              <div style={{ flex:1, minWidth:220 }}>
                <div style={{ fontSize:20, fontWeight:900, color:'#111', letterSpacing:'-0.03em', marginBottom:4 }}>Spartan</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#16a34a', marginBottom:20 }}>Founder · Domain Security Specialist</div>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.9, marginBottom:14 }}>
                  Extensive background in digital security, public key infrastructure, and email authentication — advising enterprise clients and partner networks on domain security strategy, certificate management, and email deliverability across global markets.
                </p>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.9, marginBottom:22 }}>
                  DomainRadar was built to address a gap observed consistently across that work: the same preventable security failures — misconfigured authentication records, unmonitored blacklist listings, expiring certificates — affecting organisations that lacked the right tooling to detect them early. The goal was a product that applies deep domain security expertise in a form accessible to every domain owner.
                </p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {['Domain Security','Email Authentication','DNS Infrastructure','SSL & PKI','Global Markets'].map(tag => (
                    <span key={tag} style={{ fontSize:11, fontWeight:600, padding:'3px 11px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:20 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <p style={{ fontSize:13, color:'#9ca3af', textAlign:'center', lineHeight:1.7 }}>
            Questions or feedback?{' '}
            <a href="mailto:support@dnsradar.easysecurity.in" style={{ color:'#16a34a', textDecoration:'none', fontWeight:600 }}>support@dnsradar.easysecurity.in</a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'72px 24px', background:'#f0fdf4', borderTop:'1px solid #bbf7d0' }}>
        <div style={{ maxWidth:560, margin:'0 auto', textAlign:'center' }}>
          <Lock size={32} color="#16a34a" style={{ marginBottom:18 }}/>
          <h2 style={{ fontSize:'clamp(22px,3.5vw,32px)', fontWeight:900, letterSpacing:'-0.03em', marginBottom:14 }}>See your domain's security posture</h2>
          <p style={{ fontSize:15, color:'#4b7a57', lineHeight:1.8, marginBottom:32, maxWidth:420, margin:'0 auto 32px' }}>
            Free scan, no account required. Full health score, every issue identified, and exact fix instructions in under 90 seconds.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => setPage('auth')} style={{ padding:'12px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F }}>Start free →</button>
            <button onClick={() => setPage('audit')} style={{ padding:'12px 20px', background:'#fff', color:'#374151', border:'1px solid #bbf7d0', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:F }}>📄 Instant audit</button>
            <button onClick={() => setPage('pricing')} style={{ padding:'12px 20px', background:'transparent', color:'#15803d', border:'1px solid #86efac', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:F }}>View pricing</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#111', borderTop:'1px solid #1f2937', padding:'28px 32px' }}>
        <div style={{ maxWidth:1020, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:24, height:24, background:'#16a34a', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Radar size={13} color="#fff" strokeWidth={2.5}/>
            </div>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>DomainRadar</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>· Made with ♥ in NL</span>
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
            {[['Home','landing'],['Pricing','pricing'],['Developer','developer'],['Free Audit','audit'],['Sign in','auth']].map(([l,id]) => (
              <button key={l} onClick={() => setPage(id)}
                style={{ fontSize:12, color:'rgba(255,255,255,0.35)', background:'none', border:'none', cursor:'pointer', padding:'4px 9px', borderRadius:5, fontFamily:F, transition:'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.35)'}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>© 2026 DomainRadar</div>
        </div>
      </footer>
    </div>
  )
}
