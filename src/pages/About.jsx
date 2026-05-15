import { useState } from 'react'
import { Radar, Shield, Globe, Zap, Mail, Lock, Heart, Target, Code, BarChart2, Bell, CheckCircle, ArrowRight, Users } from 'lucide-react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"

const VALUES = [
  { icon: Shield,     color:'#16a34a', bg:'#f0fdf4', bd:'#bbf7d0', title:'Security first',        body:'Every feature exists to make real security improvements, not surface metrics. We explain every finding in plain English and provide exact fix steps — because a warning without an action is useless.' },
  { icon: Target,     color:'#2563eb', bg:'#eff6ff', bd:'#bfdbfe', title:'Radical simplicity',     body:'DNS and email authentication are genuinely complex. We designed DomainRadar to be approachable for domain owners who have never touched a DNS panel, without sacrificing rigour for security engineers.' },
  { icon: Zap,        color:'#d97706', bg:'#fffbeb', bd:'#fde68a', title:'Fix, don\'t just flag',  body:'A score is worthless without a path to improvement. Auto-fix via Cloudflare API, DMARC journey wizard, SPF flattener, and DKIM rotation assistant mean problems get resolved — not just identified.' },
  { icon: Heart,      color:'#dc2626', bg:'#fef2f2', bd:'#fecaca', title:'Accessible to everyone', body:'Enterprise certificate lifecycle tools cost thousands per year. DomainRadar gives indie developers, small businesses, agencies, and nonprofits the same visibility — for free.' },
  { icon: Globe,      color:'#7c3aed', bg:'#f5f3ff', bd:'#ddd6fe', title:'Transparent by default', body:'All pricing is public. The tech stack is documented. Scan logic is explainable. No black-box scores, no fabricated urgency, no upsell pressure.' },
  { icon: Code,       color:'#0891b2', bg:'#ecfeff', bd:'#a5f3fc', title:'Developer-first',        body:'Public scan API, documented response shapes, and code examples that actually work. DomainRadar is designed to integrate into CI pipelines, onboarding checklists, and client workflows.' },
]

const MILESTONES = [
  {
    date: '2024',
    title: 'The gap becomes obvious',
    body: 'After years working across the PKI and digital certificate ecosystem — advising enterprises, channel partners, and resellers across APAC — the same pattern kept surfacing. Large organisations had full certificate lifecycle tooling, dedicated security teams, and automated monitoring. Small businesses, indie developers, and nonprofits had nothing. They were getting blacklisted, spoofed, and experiencing certificate expiry outages without any visibility into why.',
  },
  {
    date: 'Early 2025',
    title: 'Validating the problem',
    body: 'Informal research confirmed the gap. Domain owners were relying on ad-hoc tools, manual checks, and occasional panicked Google searches when something broke. The concept of a unified DNS health score — covering email authentication, SSL, propagation, and blacklists in one place — did not exist outside of enterprise platforms costing thousands per year. The market for an accessible, professional-grade alternative was clear.',
  },
  {
    date: 'Late 2025',
    title: 'Building the foundation',
    body: 'Development began with the core scan engine: parallel DNS over HTTPS queries, SPF depth analysis, DKIM key validation, DMARC policy grading, SSL certificate chain checks, and blacklist monitoring across 52 lists — all running in under 90 seconds. The technical foundation drew directly from years of hands-on PKI experience. Every check reflects real-world issues seen in production environments.',
  },
  {
    date: 'Early 2026',
    title: 'Auto-fix and monitoring',
    body: 'The product evolved from a read-only auditor to an active remediation tool. Cloudflare API integration enabled one-click DNS record creation and updates — correct SPF, DMARC, and CAA records pushed via API with a confirmation step and full audit trail. Continuous monitoring, email alerts, certificate expiry warnings, and a DMARC journey wizard followed. The goal: zero DNS knowledge required to reach a passing configuration.',
  },
  {
    date: 'May 2026',
    title: 'Public beta',
    body: 'DomainRadar launched publicly with nine feature categories, instant domain audits requiring no account, compliance PDF exports covering PCI DSS v4, CISA BOD 18-01, and the Google/Yahoo bulk sender mandate, embeddable health badges, Slack and Teams webhook integrations, and a complete tools suite for SPF generation, DKIM checking, deliverability testing, and SPF flattening. The mission remains unchanged: enterprise-grade DNS visibility, accessible to everyone.',
  },
]

const WHAT_WE_CHECK = [
  { icon: Mail,      label: 'Email authentication', desc: 'SPF depth analysis, DKIM key validation, DMARC policy grading, BIMI detection, MTA-STS and TLS-RPT. Full compliance with Google/Yahoo bulk sender requirements.' },
  { icon: Lock,      label: 'SSL certificates',      desc: 'Expiry countdown, issuer identification, chain validity, HSTS status, CT log verification. Automated alerts at 30, 7, and 1 day before expiry.' },
  { icon: Globe,     label: 'DNS propagation',       desc: 'Real-time consistency check across four global resolvers — US, EU, Asia-Pacific, and Australia. Flags records that have not propagated universally.' },
  { icon: Shield,    label: 'Blacklist monitoring',  desc: '52 DNSBL checks in a single scan. Direct delisting links for every flagged entry. Critical alerts the moment a listing is detected.' },
  { icon: Zap,       label: 'Auto-remediation',      desc: 'Cloudflare API integration for one-click DNS record creation and updates. Every change logged with a full audit trail. Confirmation required before any record is modified.' },
  { icon: BarChart2, label: 'Health scoring',        desc: 'Weighted 0–100 score across six categories. Delta tracking versus the previous scan. Historical score chart to measure improvement over time.' },
]

const STACK = [
  { name: 'React + Vite',         desc: 'Fast single-page application with minimal overhead.' },
  { name: 'Supabase',             desc: 'PostgreSQL database, Row Level Security, Edge Functions, Auth.' },
  { name: 'Deno (Edge Functions)',desc: 'Parallel scan execution — full results in under two seconds server-side.' },
  { name: 'Vercel',               desc: 'Continuous deployment, global CDN, preview URLs for every branch.' },
  { name: 'Cloudflare DoH',       desc: 'DNS over HTTPS for all lookups — no system resolver dependency.' },
  { name: 'crt.sh / Certspotter', desc: 'Certificate Transparency log queries for SSL cert data.' },
  { name: 'Resend',               desc: 'Transactional email — alerts, digest reports, authentication.' },
  { name: 'Claude (Anthropic)',   desc: 'AI pair-programming for every feature — React, Deno, SQL, deployment.' },
]

export default function About({ setPage }) {
  const scroll = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ fontFamily: F, background: '#fff', color: '#111', minHeight: '100vh' }}>
      <style>{`
        .section-label { font-size:11px; font-weight:700; color:#16a34a; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:12px; display:block; }
        .h1 { font-size:clamp(34px,5.5vw,58px); font-weight:900; letter-spacing:-0.04em; line-height:1.05; }
        .h2 { font-size:clamp(26px,3.5vw,38px); font-weight:900; letter-spacing:-0.03em; line-height:1.15; }
        .body { font-size:15px; color:#555; line-height:1.85; }
        .nav-btn { font-size:13px; color:#555; cursor:pointer; padding:5px 10px; border-radius:6px; background:none; border:none; font-family:${F}; transition:color 0.15s, background 0.15s; }
        .nav-btn:hover { color:#111; background:#f3f4f6; }
        .hover-card { transition:box-shadow 0.15s, transform 0.15s; }
        .hover-card:hover { box-shadow:0 6px 20px rgba(0,0,0,0.08); transform:translateY(-2px); }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setPage('landing')}>
          <div style={{ width: 30, height: 30, background: '#16a34a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Radar size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em' }}>DomainRadar</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="nav-btn" onClick={() => scroll('mission')}>Mission</button>
          <button className="nav-btn" onClick={() => scroll('story')}>Our story</button>
          <button className="nav-btn" onClick={() => scroll('coverage')}>Coverage</button>
          <button className="nav-btn" onClick={() => scroll('team')}>Team</button>
          <div style={{ width: 1, height: 18, background: '#e5e7eb', margin: '0 6px' }} />
          <button onClick={() => setPage('landing')} style={{ padding: '6px 12px', background: 'transparent', color: '#555', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: F }}>← Home</button>
          <button onClick={() => setPage('auth')} style={{ padding: '6px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Start free</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '88px 24px 72px', background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <span className="section-label">About DomainRadar</span>
          <h1 className="h1" style={{ marginBottom: 28 }}>
            Built by a PKI specialist.<br />Designed for everyone.
          </h1>
          <p className="body" style={{ marginBottom: 16, maxWidth: 640 }}>
            DomainRadar was created by a Certified PKI Specialist with over a decade of experience in digital certificate infrastructure, advising enterprises and channel partners across the Asia-Pacific region. The product addresses a problem observed repeatedly across that work: small businesses, independent developers, and nonprofits lack visibility into their own domain security — not because the information is unavailable, but because the tools to surface it have always been built for enterprise budgets.
          </p>
          <p className="body" style={{ marginBottom: 36, maxWidth: 640 }}>
            DomainRadar changes that. A full DNS security audit in under 90 seconds, with plain-English explanations and one-click remediation for the most common issues. No security background required.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => setPage('auth')} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px', background: '#111', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
              Start scanning free <ArrowRight size={14} />
            </button>
            <button onClick={() => setPage('audit')} style={{ padding: '11px 18px', background: 'transparent', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: F }}>
              📄 Try instant audit
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <div style={{ background: '#111', padding: '36px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 28, textAlign: 'center' }}>
          {[['< 90s','Full scan time'],['52','Blacklists checked'],['9','Check categories'],['4','Global resolvers'],['Free','To start, forever'],['1-click','DNS auto-fix']].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>{v}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MISSION ── */}
      <section id="mission" style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <span className="section-label">Mission</span>
          <h2 className="h2" style={{ marginBottom: 32 }}>Why this exists</h2>
          <div style={{ background: '#0d1117', borderRadius: 16, padding: '40px 44px', marginBottom: 40 }}>
            <p style={{ fontSize: 'clamp(17px,2.2vw,22px)', fontWeight: 600, color: '#f9fafb', lineHeight: 1.65, letterSpacing: '-0.01em', margin: 0, fontStyle: 'italic' }}>
              "Give every domain owner — independent developer, small business, nonprofit — the same security visibility that enterprise teams pay thousands for. Explained clearly. Fixed quickly."
            </p>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={17} color="#4ade80" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>Spartan · Founder, DomainRadar</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Certified PKI Specialist · Netherlands</div>
              </div>
            </div>
          </div>
          <p className="body" style={{ marginBottom: 20 }}>
            Domain security has a tooling gap. Enterprises have certificate lifecycle management platforms, dedicated PKI teams, automated expiry monitoring, and DMARC reporting dashboards. Everyone else has a DNS panel, some documentation they may never have read, and no proactive alerting when something goes wrong.
          </p>
          <p className="body">
            The consequences are not theoretical. Misconfigured SPF records cause legitimate emails to be rejected. Missing DMARC policies enable domain spoofing attacks. Expired certificates take sites offline without warning. These are preventable, common, and disproportionately affect organisations without dedicated technical teams. DomainRadar exists to close that gap.
          </p>
        </div>
      </section>

      {/* ── STORY ── */}
      <section id="story" style={{ padding: '88px 24px', background: '#fafafa', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <span className="section-label">Our story</span>
          <h2 className="h2" style={{ marginBottom: 12 }}>How DomainRadar was built</h2>
          <p className="body" style={{ marginBottom: 52, maxWidth: 580 }}>From an observed market gap to a production platform — a straightforward path driven by one clear problem.</p>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: 6, bottom: 0, width: 1, background: '#e5e7eb' }} />
            {MILESTONES.map((m, i) => (
              <div key={m.title} style={{ position: 'relative', paddingLeft: 40, paddingBottom: i < MILESTONES.length - 1 ? 48 : 0 }}>
                <div style={{ position: 'absolute', left: 7, top: 4, width: 12, height: 12, borderRadius: '50%', background: '#16a34a', border: '2px solid #fafafa' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{m.date}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.2 }}>{m.title}</div>
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85, margin: 0 }}>{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section style={{ padding: '88px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="section-label" style={{ display: 'block', textAlign: 'center' }}>Principles</span>
            <h2 className="h2">What we stand for</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 18 }}>
            {VALUES.map(v => (
              <div key={v.title} className="hover-card" style={{ background: '#fafafa', border: `1px solid ${v.bd}`, borderTop: `3px solid ${v.color}`, borderRadius: 14, padding: '24px 22px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <v.icon size={19} color={v.color} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 9 }}>{v.title}</div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.75 }}>{v.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COVERAGE ── */}
      <section id="coverage" style={{ padding: '88px 24px', background: '#fafafa', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="section-label" style={{ display: 'block', textAlign: 'center' }}>What we check</span>
            <h2 className="h2" style={{ marginBottom: 12 }}>Complete domain security coverage</h2>
            <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>All checks run in parallel. Full results in under 90 seconds. No configuration required.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {WHAT_WE_CHECK.map(c => (
              <div key={c.label} className="hover-card" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <c.icon size={17} color="#16a34a" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 5 }}>{c.label}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section id="team" style={{ padding: '88px 24px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <span className="section-label">The team</span>
          <h2 className="h2" style={{ marginBottom: 36 }}>Who built DomainRadar</h2>

          {/* Founder */}
          <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 16, padding: '36px', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ width: 68, height: 68, borderRadius: 16, background: '#f0fdf4', border: '1.5px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={30} color="#16a34a" />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 21, fontWeight: 900, color: '#111', letterSpacing: '-0.03em', marginBottom: 4 }}>Spartan</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', marginBottom: 18, lineHeight: 1.4 }}>Founder · Certified PKI Specialist · Netherlands</div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, marginBottom: 14 }}>
                  Over a decade of experience in digital security, public key infrastructure, and certificate lifecycle management. Works with enterprise and channel partner networks across the Asia-Pacific region, advising on PKI strategy, certificate issuance, and domain security posture.
                </p>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, marginBottom: 20 }}>
                  DomainRadar was built from direct observation: the same preventable security failures — misconfigured email authentication, expired certificates, unmonitored blacklist listings — affecting organisations that simply lacked the tooling to see them. The goal was a product that applies real PKI expertise at a price point accessible to everyone.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Certified PKI Specialist', 'Certificate Lifecycle Management', 'Email Authentication', 'DNS Security', 'Based in Netherlands'].map(tag => (
                    <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: '3px 11px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20 }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI co-developer */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 26px', marginBottom: 28, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Code size={17} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 5 }}>AI co-development: Claude (Anthropic)</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.75 }}>
                Every feature in DomainRadar was pair-programmed with Claude Sonnet. Front-end components, Supabase edge functions, database migrations, deployment pipelines. The velocity of AI-assisted development allows a single specialist to ship a full-featured platform. Domain expertise, product decisions, and security judgement remain human.
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 1.7 }}>
            Questions or feedback?{' '}
            <a href="mailto:support@dnsradar.easysecurity.in" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>support@dnsradar.easysecurity.in</a>
          </p>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ padding: '72px 24px', background: '#0d1117', borderTop: '1px solid #1f2937' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 12 }}>Under the hood</span>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', margin: 0 }}>Built with</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12 }}>
            {STACK.map(s => (
              <div key={s.name} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>{s.name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '72px 24px', background: '#f0fdf4', borderTop: '1px solid #bbf7d0' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <Lock size={34} color="#16a34a" style={{ marginBottom: 18 }} />
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 14 }}>See your domain's security posture</h2>
          <p style={{ fontSize: 15, color: '#4b7a57', lineHeight: 1.8, marginBottom: 32, maxWidth: 440, margin: '0 auto 32px' }}>
            Free scan, no account required. Full health score, every issue identified, and exact fix instructions — in under 90 seconds.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setPage('auth')} style={{ padding: '12px 28px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>Start free →</button>
            <button onClick={() => setPage('audit')} style={{ padding: '12px 20px', background: '#fff', color: '#374151', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: F }}>📄 Instant audit</button>
            <button onClick={() => setPage('pricing')} style={{ padding: '12px 20px', background: 'transparent', color: '#15803d', border: '1px solid #86efac', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: F }}>View pricing</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#111', borderTop: '1px solid #1f2937', padding: '28px 32px' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 24, height: 24, background: '#16a34a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radar size={13} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>DomainRadar</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>· Made with ♥ in NL</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {[['Home','landing'],['Pricing','pricing'],['Developer','developer'],['Free Audit','audit'],['Sign in','auth']].map(([l,id]) => (
              <button key={l} onClick={() => setPage(id)}
                style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 9px', borderRadius: 5, fontFamily: F, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>{l}</button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 DomainRadar</div>
        </div>
      </footer>
    </div>
  )
}
