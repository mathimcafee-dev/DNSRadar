import { CheckCircle, Zap, Shield, Globe, Mail, Bell, Users, Code, ArrowRight } from 'lucide-react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"

const PLANS = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    desc: 'Everything you need to scan and fix one domain.',
    cta: 'Start free',
    ctaStyle: 'outline',
    features: [
      'Unlimited manual scans',
      '1 monitored domain',
      '24h scan interval',
      'Full scan results (DNS, email auth, SSL, blacklists)',
      'PDF audit report export',
      'SPF, DMARC, CAA auto-fix',
      'All tools (SPF generator, DKIM checker, deliverability test…)',
      'Email alerts on changes',
    ],
  },
  {
    name: 'Pro',
    price: '€12',
    period: 'per month',
    desc: 'For professionals and growing businesses.',
    cta: 'Start Pro trial',
    ctaStyle: 'primary',
    badge: 'Most popular',
    features: [
      'Everything in Free',
      '10 monitored domains',
      '6h scan interval',
      'DMARC aggregate report parsing',
      'Slack & Teams webhook alerts',
      'Score history (90 days)',
      'Compliance PDF (PCI DSS, CISA, Google/Yahoo)',
      'Priority email support',
    ],
  },
  {
    name: 'Agency',
    price: '€39',
    period: 'per month',
    desc: 'For agencies managing multiple client domains.',
    cta: 'Start Agency trial',
    ctaStyle: 'outline',
    features: [
      'Everything in Pro',
      '50 monitored domains',
      '1h scan interval',
      'White-label PDF reports',
      'Team seats (5 users)',
      'API access (REST + JSON)',
      'Bulk domain import via CSV',
      'Custom branding on reports',
    ],
  },
]

const COMPARISON = [
  { feature: 'Manual scans',           free: 'Unlimited', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Monitored domains',      free: '1',         pro: '10',         agency: '50' },
  { feature: 'Scan interval',          free: '24h',       pro: '6h',         agency: '1h' },
  { feature: 'Email alerts',           free: true,        pro: true,         agency: true },
  { feature: 'Webhook (Slack/Teams)',  free: false,       pro: true,         agency: true },
  { feature: 'DNS auto-fix',           free: true,        pro: true,         agency: true },
  { feature: 'PDF audit export',       free: true,        pro: true,         agency: true },
  { feature: 'DMARC reports',          free: false,       pro: true,         agency: true },
  { feature: 'Score history',          free: '7 days',    pro: '90 days',    agency: 'Full' },
  { feature: 'Compliance PDF',         free: false,       pro: true,         agency: true },
  { feature: 'API access',             free: false,       pro: false,        agency: true },
  { feature: 'White-label reports',    free: false,       pro: false,        agency: true },
  { feature: 'Team seats',             free: '1',         pro: '2',          agency: '5' },
]

function Check({ ok, val }) {
  if (typeof ok === 'string') return <span style={{ fontSize:13, color:'#374151', fontWeight:500 }}>{ok}</span>
  if (ok === true) return <CheckCircle size={16} color="#16a34a"/>
  return <span style={{ fontSize:13, color:'#d1d5db' }}>—</span>
}

export default function Pricing({ setPage }) {
  return (
    <div style={{ fontFamily:F, background:'#fafafa', color:'#111', minHeight:'100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Nav */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setPage('landing')}>
          <div style={{ width:28, height:28, background:'#16a34a', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#fff', fontSize:14, fontWeight:900 }}>D</span>
          </div>
          <span style={{ fontSize:14, fontWeight:800, letterSpacing:'-0.02em' }}>DomainRadar</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setPage('landing')} style={{ padding:'6px 14px', background:'transparent', color:'#555', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, cursor:'pointer', fontFamily:F }}>← Back</button>
          <button onClick={() => setPage('auth')} style={{ padding:'6px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Start free</button>
        </div>
      </nav>

      <div style={{ maxWidth:1020, margin:'0 auto', padding:'64px 24px' }}>
        {/* Header */}
        <div className="fade" style={{ textAlign:'center', marginBottom:60 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>Pricing</div>
          <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:900, letterSpacing:'-0.04em', marginBottom:16 }}>Simple, transparent pricing</h1>
          <p style={{ fontSize:16, color:'#6b7280', maxWidth:440, margin:'0 auto', lineHeight:1.7 }}>
            Free forever for one domain. Upgrade when you need more.<br/>
            <span style={{ fontWeight:600, color:'#16a34a' }}>All plans include a 14-day free trial.</span>
          </p>
        </div>

        {/* Plan cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginBottom:64 }}>
          {PLANS.map((plan, i) => (
            <div key={plan.name} className="fade" style={{ animationDelay:`${i*0.08}s`, position:'relative', background:'#fff', border: plan.badge ? '2px solid #16a34a' : '1px solid #e5e7eb', borderRadius:16, padding:'28px 26px', display:'flex', flexDirection:'column' }}>
              {plan.badge && (
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#16a34a', color:'#fff', fontSize:11, fontWeight:700, padding:'3px 14px', borderRadius:20, whiteSpace:'nowrap' }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:8 }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:6 }}>
                  <span style={{ fontSize:40, fontWeight:900, letterSpacing:'-0.04em', color:'#111' }}>{plan.price}</span>
                  <span style={{ fontSize:13, color:'#9ca3af' }}>/ {plan.period}</span>
                </div>
                <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6 }}>{plan.desc}</p>
              </div>
              <div style={{ flex:1, marginBottom:24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'6px 0', borderBottom:'1px solid #f9fafb' }}>
                    <CheckCircle size={14} color="#16a34a" style={{ flexShrink:0, marginTop:2 }}/>
                    <span style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setPage('auth')}
                style={{ width:'100%', padding:'11px', background: plan.ctaStyle==='primary' ? '#16a34a' : '#fff', color: plan.ctaStyle==='primary' ? '#fff' : '#111', border: plan.ctaStyle==='primary' ? 'none' : '1.5px solid #111', borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                {plan.cta} →
              </button>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div style={{ marginBottom:64 }}>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.03em', marginBottom:24, textAlign:'center' }}>Full feature comparison</h2>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f9fafb', borderBottom:'1px solid #e5e7eb' }}>
                  <th style={{ padding:'12px 18px', textAlign:'left', fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.07em' }}>Feature</th>
                  {PLANS.map(p => <th key={p.name} style={{ padding:'12px 18px', fontSize:13, fontWeight:700, color: p.badge ? '#16a34a' : '#111' }}>{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} style={{ borderBottom:'1px solid #f3f4f6', background: i%2===0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding:'11px 18px', fontSize:13, color:'#374151', fontWeight:500 }}>{row.feature}</td>
                    <td style={{ padding:'11px 18px', textAlign:'center' }}><Check ok={row.free}/></td>
                    <td style={{ padding:'11px 18px', textAlign:'center' }}><Check ok={row.pro}/></td>
                    <td style={{ padding:'11px 18px', textAlign:'center' }}><Check ok={row.agency}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ textAlign:'center', padding:'48px 32px', background:'#f0fdf4', borderRadius:16, border:'1px solid #bbf7d0' }}>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.03em', marginBottom:10, color:'#111' }}>Questions about pricing?</h2>
          <p style={{ fontSize:14, color:'#4b7a57', marginBottom:24, lineHeight:1.6 }}>All plans come with a 14-day free trial. No credit card required to start. Cancel anytime.</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => setPage('auth')} style={{ padding:'10px 24px', background:'#16a34a', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:F }}>Start free trial →</button>
            <button onClick={() => setPage('about')} style={{ padding:'10px 20px', background:'transparent', color:'#374151', border:'1px solid #bbf7d0', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:F }}>Learn about us</button>
          </div>
        </div>
      </div>
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
            {[['Landing','landing'],['About','about'],['Developer','developer'],['Free Audit','audit'],['Sign in','auth']].map(([l,id]) => (
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