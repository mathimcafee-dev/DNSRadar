// AuditReport is now a thin wrapper — it routes directly into the shared ScanResult flow.
// The "Free Audit" concept is merged into the main scan: enter domain → get full report → export PDF.
import { useState } from 'react'
import { Search, Radar, ArrowRight } from 'lucide-react'

const F = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif"
const MONO = "'JetBrains Mono','Fira Code',monospace"

export default function AuditReport({ setPage, setScanDomain, setScanType }) {
  const [domain, setDomain] = useState('')

  function go(e) {
    e.preventDefault()
    const d = domain.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
    if (!d) return
    if (setScanDomain) setScanDomain(d)
    if (setScanType)   setScanType('website')
    setPage('scan')
  }

  return (
    <div style={{ fontFamily:F, background:'#fafafa', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
      <div style={{ maxWidth:520, width:'100%', textAlign:'center' }}>
        <div style={{ width:48, height:48, background:'#16a34a', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <Radar size={24} color="#fff" strokeWidth={2.5}/>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>Free DNS Audit</div>
        <h1 style={{ fontSize:'clamp(26px,5vw,40px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:16 }}>
          Full domain security audit
        </h1>
        <p style={{ fontSize:15, color:'#6b7280', lineHeight:1.7, marginBottom:32, maxWidth:420, margin:'0 auto 32px' }}>
          SPF, DKIM, DMARC, SSL, blacklists, propagation — all in one scan. No account required. Export a full PDF report when done.
        </p>
        <form onSubmit={go} style={{ display:'flex', gap:8, marginBottom:12 }}>
          <div style={{ flex:1, position:'relative' }}>
            <Search size={14} color="#9ca3af" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="yourdomain.com"
              autoFocus
              style={{ width:'100%', padding:'13px 14px 13px 36px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:15, fontFamily:MONO, color:'#111', outline:'none', boxSizing:'border-box', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}
              onFocus={e => e.target.style.borderColor='#16a34a'}
              onBlur={e => e.target.style.borderColor='#e5e7eb'}
            />
          </div>
          <button type="submit" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'13px 22px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:F, whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(22,163,74,0.25)' }}>
            Run audit <ArrowRight size={15}/>
          </button>
        </form>
        <p style={{ fontSize:12, color:'#9ca3af', marginBottom:32 }}>No account needed · Results in 90 seconds · PDF export included</p>
        <div style={{ display:'flex', gap:20, justifyContent:'center', flexWrap:'wrap', marginBottom:40 }}>
          {['SPF & DKIM & DMARC','SSL certificate','Blacklists (52)','DNS propagation','Security checks','Health score'].map(f => (
            <div key={f} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6b7280' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#16a34a' }}/>
              {f}
            </div>
          ))}
        </div>
        <button onClick={() => setPage('landing')} style={{ fontSize:13, color:'#9ca3af', background:'transparent', border:'none', cursor:'pointer', fontFamily:F }}>
          ← Back to home
        </button>
      </div>
    </div>
  )
}
