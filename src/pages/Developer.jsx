import { Radar, Code, Terminal, Globe, Shield, Zap, Lock, Mail, FileText, ArrowRight, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"
const MONO = "'JetBrains Mono','Fira Code','Courier New',monospace"

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{ position:'absolute', top:10, right:10, display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:7, color:'rgba(255,255,255,0.6)', fontSize:11, cursor:'pointer', fontFamily:F }}>
      {copied ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
    </button>
  )
}

function CodeBlock({ code, lang = '' }) {
  return (
    <div style={{ position:'relative', background:'#0d1117', borderRadius:10, padding:'16px 18px', marginBottom:16, border:'1px solid #1f2937', overflow:'hidden' }}>
      {lang && <div style={{ fontSize:10, color:'#4b5563', fontFamily:MONO, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.09em' }}>{lang}</div>}
      <pre style={{ margin:0, fontFamily:MONO, fontSize:13, color:'#e5e7eb', lineHeight:1.7, overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{code}</pre>
      <CopyBtn text={code}/>
    </div>
  )
}

const ENDPOINTS = [
  {
    method: 'POST', path: '/functions/v1/dns-scan',
    desc: 'Run a full DNS scan on any domain. Returns health score, all DNS records, email auth, SSL, propagation, blacklists, and issues.',
    body: '{"domain": "example.com", "save_to_db": false}',
    response: `{
  "domain": "example.com",
  "health_score": 74,
  "score_dns": 25,
  "score_email": 22,
  "score_ssl": 20,
  "ssl_info": { "overall_status": "Pass", "certs": [...] },
  "email_auth": { "spf_status": "Pass", "dkim_status": "Pass", "dmarc_status": "Warn" },
  "blacklists": { "listed_count": 0, "ip": "1.2.3.4" },
  "issues": [{ "type": "DMARC", "severity": "warn", "message": "...", "fix": "..." }]
}`
  },
  {
    method: 'POST', path: '/functions/v1/ssl-check',
    desc: 'Check SSL certificate details for any domain. Returns issuer, expiry, SANs, HSTS, CT log status.',
    body: '{"domain": "example.com"}',
    response: `{
  "overall_status": "Pass",
  "certs": [{
    "issuer_org": "Let's Encrypt",
    "issuer_cn": "R11",
    "subject_cn": "example.com",
    "days_remaining": 82,
    "expires_at": "2026-08-10T00:00:00.000Z",
    "hsts": "HSTS enabled",
    "san": ["example.com", "www.example.com"],
    "ct_logged": true
  }],
  "note": "Valid for 82 more days · Issued by Let's Encrypt"
}`
  },
]

const STACK = [
  { name:'React + Vite',       desc:'Frontend SPA with page-based routing. No React Router.' },
  { name:'Supabase',           desc:'Postgres DB, Row Level Security, Edge Functions (Deno), Auth, Realtime.' },
  { name:'Vercel',             desc:'Auto-deploy on push to main. Edge network for global performance.' },
  { name:'Cloudflare DoH',     desc:'DNS over HTTPS for all DNS lookups. No system resolver dependency.' },
  { name:'crt.sh / Certspotter', desc:'CT log lookups for SSL certificate data.' },
  { name:'Resend',             desc:'Transactional email for alerts, reports, and auth.' },
]

export default function Developer({ setPage }) {
  const SUPABASE_URL = 'https://kbfgnbhjczicpjqxbxjj.supabase.co'
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

  return (
    <div style={{ fontFamily:F, background:'#0d1117', color:'#e5e7eb', minHeight:'100vh' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation: fadeUp 0.5s ease both; }
        a { color: #4ade80; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      {/* Nav */}
      <nav style={{ background:'#111827', borderBottom:'1px solid #1f2937', padding:'0 32px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => setPage('landing')}>
          <div style={{ width:28, height:28, background:'#16a34a', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Radar size={14} color="#fff" strokeWidth={2.5}/>
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:'#f9fafb' }}>DomainRadar</span>
          <span style={{ fontSize:10, background:'rgba(74,222,128,0.12)', color:'#4ade80', padding:'2px 8px', borderRadius:8, fontWeight:600, border:'1px solid rgba(74,222,128,0.2)' }}>Developer</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setPage('landing')} style={{ padding:'6px 14px', background:'rgba(255,255,255,0.05)', color:'#9ca3af', border:'1px solid #374151', borderRadius:7, fontSize:13, cursor:'pointer', fontFamily:F }}>← Home</button>
          <button onClick={() => setPage('auth')} style={{ padding:'6px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>Start free</button>
        </div>
      </nav>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'60px 24px' }}>

        {/* Header */}
        <div className="fade" style={{ marginBottom:56 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#4ade80', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>Developer docs</div>
          <h1 style={{ fontSize:'clamp(32px,5vw,52px)', fontWeight:900, letterSpacing:'-0.04em', color:'#f9fafb', lineHeight:1.1, marginBottom:18 }}>
            Build with DomainRadar
          </h1>
          <p style={{ fontSize:16, color:'#9ca3af', lineHeight:1.8, maxWidth:580 }}>
            DomainRadar's scan engine runs on Supabase Edge Functions (Deno). The public scan endpoints are open — no API key required for basic scans. Full API access with authentication coming in Agency plan.
          </p>
        </div>

        {/* Mission (developer framing) */}
        <div className="fade" style={{ background:'#111827', border:'1px solid #1f2937', borderLeft:'4px solid #16a34a', borderRadius:'0 12px 12px 0', padding:'20px 24px', marginBottom:48 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#4ade80', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.09em' }}>Why this exists</div>
          <p style={{ fontSize:14, color:'#9ca3af', lineHeight:1.8, margin:0 }}>
            I built DomainRadar because I was tired of watching small businesses and indie developers get blacklisted, spoofed, or have their sites go down over expired certificates — problems that are completely preventable with the right tooling. The scan engine checks 50+ things in parallel in under 90 seconds. The auto-fix layer means zero DNS knowledge required to resolve most issues.
          </p>
          <div style={{ marginTop:12, fontSize:12, color:'#4b5563' }}>— Spartan, PKI Specialist & Founder · DigiCert Partner APAC · Netherlands</div>
        </div>

        {/* Tech stack */}
        <div className="fade" style={{ marginBottom:56 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#f9fafb', letterSpacing:'-0.03em', marginBottom:20 }}>Tech stack</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
            {STACK.map(s => (
              <div key={s.name} style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#f9fafb', marginBottom:5, display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a', display:'inline-block' }}/>
                  {s.name}
                </div>
                <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick start */}
        <div className="fade" style={{ marginBottom:56 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#f9fafb', letterSpacing:'-0.03em', marginBottom:20 }}>Quick start</h2>
          <p style={{ fontSize:14, color:'#9ca3af', marginBottom:16, lineHeight:1.7 }}>Run a full DNS scan on any domain in one fetch call — no API key required:</p>
          <CodeBlock lang="bash" code={`curl -X POST ${SUPABASE_URL}/functions/v1/dns-scan \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "yourdomain.com", "save_to_db": false}'`}/>
          <CodeBlock lang="javascript" code={`const res = await fetch('${SUPABASE_URL}/functions/v1/dns-scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ domain: 'yourdomain.com', save_to_db: false })
})
const data = await res.json()
console.log(data.health_score)      // 74
console.log(data.ssl_info.certs)    // cert details
console.log(data.issues)            // [{type:'DMARC', severity:'warn', ...}]`}/>
        </div>

        {/* Endpoints */}
        <div className="fade" style={{ marginBottom:56 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#f9fafb', letterSpacing:'-0.03em', marginBottom:8 }}>Endpoints</h2>
          <p style={{ fontSize:13, color:'#6b7280', marginBottom:24 }}>Base URL: <code style={{ fontFamily:MONO, background:'#111827', padding:'2px 8px', borderRadius:5, color:'#4ade80' }}>{SUPABASE_URL}/functions/v1</code></p>
          {ENDPOINTS.map(ep => (
            <div key={ep.path} style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid #1f2937', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, fontWeight:800, padding:'3px 9px', borderRadius:6, background:'rgba(22,163,74,0.12)', color:'#4ade80', fontFamily:MONO }}>{ep.method}</span>
                <code style={{ fontFamily:MONO, fontSize:13, color:'#f9fafb' }}>{ep.path}</code>
              </div>
              <div style={{ padding:'14px 18px' }}>
                <p style={{ fontSize:13, color:'#9ca3af', marginBottom:16, lineHeight:1.7 }}>{ep.desc}</p>
                <div style={{ fontSize:11, color:'#4b5563', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.09em', fontWeight:600 }}>Request body</div>
                <CodeBlock code={ep.body}/>
                <div style={{ fontSize:11, color:'#4b5563', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.09em', fontWeight:600 }}>Response</div>
                <CodeBlock lang="json" code={ep.response}/>
              </div>
            </div>
          ))}
        </div>

        {/* Response shape */}
        <div className="fade" style={{ marginBottom:56 }}>
          <h2 style={{ fontSize:22, fontWeight:800, color:'#f9fafb', letterSpacing:'-0.03em', marginBottom:20 }}>Response shape</h2>
          <CodeBlock lang="typescript" code={`interface ScanResult {
  domain: string
  scanned_at: string          // ISO timestamp
  health_score: number        // 0–100
  score_dns: number           // 0–25
  score_email: number         // 0–30
  score_ssl: number           // 0–20
  score_propagation: number   // 0–10
  score_security: number      // 0–10
  score_blacklist: number     // 0–5

  dns_records: DNSRecord[]
  email_auth: {
    spf_status: 'Pass' | 'Warn' | 'Fail' | 'Missing'
    spf_raw: string | null
    dkim_status: 'Pass' | 'Missing'
    dkim_selector: string | null
    dmarc_status: 'Pass' | 'Warn' | 'Fail' | 'Missing'
    dmarc_raw: string | null
    dmarc_policy: string | null
    bimi_status: string
    mta_sts_status: string
  }
  ssl_info: {
    overall_status: 'Pass' | 'Warn' | 'Fail'
    note: string
    certs: SSLCert[]
  }
  blacklists: {
    ip: string
    listed_count: number
    results: { name: string; listed: boolean }[]
  }
  propagation: { consistent: boolean; records: PropRecord[] }
  security: { dnssec_status: string; caa_status: string }
  issues: Issue[]
}`}/>
        </div>

        {/* Rate limits */}
        <div className="fade" style={{ background:'#111827', border:'1px solid #374151', borderRadius:14, padding:'24px 26px', marginBottom:56 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#f9fafb', letterSpacing:'-0.02em', marginBottom:12 }}>Rate limits & fair use</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              ['Public scan endpoint', 'No auth required. Supabase default rate limits apply (~50 req/min per IP).'],
              ['Authenticated scans', 'Use your Supabase anon key in Authorization header for higher limits.'],
              ['save_to_db: true',    'Requires an authenticated session. Saves results to your account.'],
              ['API access (Agency)', 'Coming soon — dedicated API key, higher limits, bulk scan endpoint.'],
            ].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', flexShrink:0, marginTop:5 }}/>
                <div>
                  <span style={{ fontSize:13, fontWeight:600, color:'#f9fafb' }}>{k}: </span>
                  <span style={{ fontSize:13, color:'#9ca3af' }}>{v}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open source */}
        <div className="fade" style={{ textAlign:'center', padding:'40px 32px', background:'#111827', border:'1px solid #1f2937', borderRadius:16 }}>
          <Code size={32} color="#4ade80" style={{ marginBottom:14 }}/>
          <h2 style={{ fontSize:20, fontWeight:800, color:'#f9fafb', letterSpacing:'-0.02em', marginBottom:10 }}>Want to contribute?</h2>
          <p style={{ fontSize:13, color:'#9ca3af', lineHeight:1.7, marginBottom:24, maxWidth:440, margin:'0 auto 24px' }}>
            DomainRadar is in active development. We welcome bug reports, feature requests, and pull requests. The edge function source is included in the repository.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="https://github.com/mathimcafee-dev/DNSRadar" target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', background:'rgba(255,255,255,0.06)', color:'#f9fafb', border:'1px solid #374151', borderRadius:8, fontSize:13, fontWeight:600, textDecoration:'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              View on GitHub
            </a>
            <button onClick={() => setPage('auth')} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:F }}>
              Start building →
            </button>
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
            {[['Landing','landing'],['Pricing','pricing'],['About','about'],['Developer','developer'],['Free Audit','audit'],['Sign in','auth']].map(([l,id]) => (
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
