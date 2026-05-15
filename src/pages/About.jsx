import { Radar, Shield, Globe, Zap, Mail, Lock, Heart, Target, Users, ArrowRight } from 'lucide-react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"

const TEAM = [
  {
    name: 'Spartan (Mathi)',
    role: 'Founder & PKI Specialist',
    bio: 'Certified PKI Specialist with 10+ years in digital security. Partner Account Manager at DigiCert Inc., working with channel partners across APAC from the Netherlands. MSc from Kongu Engineering College.',
    fact: 'Has personally overseen the issuance of thousands of SSL certificates across enterprise clients.',
  },
]

const VALUES = [
  { icon: Shield, color:'#16a34a', bg:'#f0fdf4', title:'Security first',   body:'Every feature is built around making real security improvements, not just surfacing numbers. We explain every finding and tell you exactly how to fix it.' },
  { icon: Target, color:'#2563eb', bg:'#eff6ff', title:'Radical simplicity', body:'DNS and email auth are intimidating. We make them approachable for domain owners who have never opened a DNS panel — without dumbing it down for experts.' },
  { icon: Zap,    color:'#d97706', bg:'#fffbeb', title:'Actually fix things', body:'A score is worthless without a path to improvement. Auto-fix, wizards, and step-by-step guides mean problems get resolved, not just flagged.' },
  { icon: Heart,  color:'#dc2626', bg:'#fef2f2', title:'Indie & SMB focus',  body:'Enterprise CLM tools cost thousands per year. DomainRadar gives indie developers, small businesses, and nonprofits the same visibility at a fraction of the cost.' },
]

const MILESTONES = [
  { date:'Jan 2026',  label:'Idea',          body:'After years working with enterprise PKI clients, saw how indie businesses had zero visibility into their own domain security.' },
  { date:'Feb 2026',  label:'First scan',    body:'Built the first DNS scanner over a weekend. Showed it to 10 friends. All 10 found critical issues on their own domains.' },
  { date:'Mar 2026',  label:'Auto-fix',      body:'Added Cloudflare API integration. Users could now fix SPF and DMARC with one click instead of editing DNS panels by hand.' },
  { date:'May 2026',  label:'Beta launch',   body:'Launched public beta with full feature set — monitoring, alerts, SSL tracking, DMARC journey, deliverability test, and PDF export.' },
]

export default function About({ setPage }) {
  return (
    <div style={{ fontFamily:F, background:'#fff', color:'#111', minHeight:'100vh' }}>
      {/* Nav */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setPage('landing')}>
          <div style={{ width:28, height:28, background:'#16a34a', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radar size={14} color="#fff" strokeWidth={2.5}/>
          </div>
          <span style={{ fontSize:14, fontWeight:800, letterSpacing:'-0.02em' }}>DomainRadar</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setPage('landing')} style={{ padding:'6px 14px', background:'transparent', color:'#555', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, cursor:'pointer', fontFamily:F }}>← Home</button>
          <button onClick={() => setPage('auth')} style={{ padding:'6px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Start free</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:'80px 24px 64px', background:'linear-gradient(180deg,#f0fdf4 0%,#fff 100%)', textAlign:'center' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>Our story</div>
          <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:20 }}>
            Built by a PKI specialist,<br/>for everyone else.
          </h1>
          <p style={{ fontSize:16, color:'#555', lineHeight:1.8, marginBottom:0 }}>
            DomainRadar was born from a frustration: enterprise-grade DNS and certificate monitoring tools cost thousands per year and require a security team to operate. Meanwhile, indie developers and small businesses — the people who need this visibility most — have nothing.
          </p>
        </div>
      </section>

      {/* Mission statement */}
      <section style={{ padding:'64px 24px', background:'#111' }}>
        <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#4ade80', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:20 }}>Mission</div>
          <blockquote style={{ fontSize:'clamp(20px,3vw,28px)', fontWeight:700, color:'#fff', lineHeight:1.5, margin:0, letterSpacing:'-0.02em' }}>
            "Give every domain owner — indie developer, small business, nonprofit — the same security visibility that enterprise teams pay thousands for. Explained in plain English. Fixed with one click."
          </blockquote>
          <div style={{ marginTop:24, fontSize:13, color:'rgba(255,255,255,0.4)' }}>— Spartan, Founder</div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding:'72px 24px', background:'#fff' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>What we believe</div>
            <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:900, letterSpacing:'-0.03em' }}>Our values</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:20 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ padding:'24px', background:'#fafafa', borderRadius:14, border:'1px solid #e5e7eb' }}>
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

      {/* Timeline */}
      <section style={{ padding:'72px 24px', background:'#fafafa' }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Timeline</div>
            <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:900, letterSpacing:'-0.03em' }}>How we got here</h2>
          </div>
          <div style={{ position:'relative', paddingLeft:24 }}>
            <div style={{ position:'absolute', left:7, top:0, bottom:0, width:2, background:'#e5e7eb', borderRadius:2 }}/>
            {MILESTONES.map((m, i) => (
              <div key={m.label} style={{ position:'relative', paddingLeft:28, paddingBottom:32 }}>
                <div style={{ position:'absolute', left:-1, top:4, width:14, height:14, borderRadius:'50%', background:'#16a34a', border:'3px solid #fff', boxShadow:'0 0 0 2px #16a34a' }}/>
                <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:4 }}>{m.date}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#111', marginBottom:6 }}>{m.label}</div>
                <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.7 }}>{m.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding:'72px 24px', background:'#fff' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>Team</div>
            <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:900, letterSpacing:'-0.03em' }}>Who we are</h2>
          </div>
          {TEAM.map(p => (
            <div key={p.name} style={{ background:'#fafafa', border:'1px solid #e5e7eb', borderRadius:16, padding:'28px 30px', display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ width:64, height:64, borderRadius:14, background:'#f0fdf4', border:'2px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Shield size={28} color="#16a34a"/>
              </div>
              <div style={{ flex:1, minWidth:200 }}>
                <div style={{ fontSize:18, fontWeight:800, color:'#111', letterSpacing:'-0.02em', marginBottom:3 }}>{p.name}</div>
                <div style={{ fontSize:13, color:'#16a34a', fontWeight:600, marginBottom:12 }}>{p.role}</div>
                <p style={{ fontSize:14, color:'#555', lineHeight:1.7, marginBottom:10 }}>{p.bio}</p>
                <div style={{ fontSize:12, color:'#9ca3af', fontStyle:'italic', borderLeft:'3px solid #bbf7d0', paddingLeft:12 }}>{p.fact}</div>
              </div>
            </div>
          ))}
          <p style={{ fontSize:13, color:'#9ca3af', textAlign:'center', marginTop:24, lineHeight:1.7 }}>
            DomainRadar is a one-person project built with Claude (Anthropic) as AI co-developer.<br/>
            The product is live, the mission is real.
          </p>
        </div>
      </section>

      {/* PKI expertise note */}
      <section style={{ padding:'56px 24px', background:'#f0fdf4', borderTop:'1px solid #bbf7d0' }}>
        <div style={{ maxWidth:680, margin:'0 auto', textAlign:'center' }}>
          <Lock size={32} color="#16a34a" style={{ marginBottom:14 }}/>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.03em', marginBottom:12 }}>Built on real PKI expertise</h2>
          <p style={{ fontSize:14, color:'#4b7a57', lineHeight:1.8, marginBottom:28, maxWidth:520, margin:'0 auto 28px' }}>
            DomainRadar is built by a Certified PKI Specialist who has worked with DigiCert, TheSSLStore, and GoGetSSL — the largest certificate authorities and resellers in the world. Every check, every recommendation, and every auto-fix is grounded in real industry practice.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => setPage('auth')} style={{ padding:'10px 24px', background:'#16a34a', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F }}>Start scanning →</button>
            <button onClick={() => setPage('developer')} style={{ padding:'10px 20px', background:'transparent', color:'#15803d', border:'1px solid #86efac', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:F }}>Developer page</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#111', padding:'24px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>DomainRadar · Made with ♥ in NL</span>
        <div style={{ display:'flex', gap:16 }}>
          {[['Landing','landing'],['Pricing','pricing'],['Developer','developer']].map(([l,id])=>(
            <span key={l} style={{ fontSize:12, color:'rgba(255,255,255,0.3)', cursor:'pointer' }} onClick={() => setPage(id)}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}
