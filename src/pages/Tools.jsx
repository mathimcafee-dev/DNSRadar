import { useState } from 'react'
import { Wand2, Shield, Key, Mail, Upload, Copy, Check, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

const D = {
  bg: '#0d1117', surface: '#161b22', surface2: '#1c2333',
  border: 'rgba(255,255,255,0.08)', text: '#e6edf3',
  muted: 'rgba(255,255,255,0.5)', dim: 'rgba(255,255,255,0.25)',
}
const card = { background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, overflow:'hidden' }
const cardHd = { padding:'12px 16px', borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:D.surface2 }

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{ padding:'5px 12px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:6, color:'#10b981', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
      {copied ? <><Check size={12}/> Copied</> : <><Copy size={12}/> Copy</>}
    </button>
  )
}

function RecordDisplay({ record, label }) {
  if (!record) return null
  const parts = record.split(/\s*;\s*/).filter(Boolean)
  return (
    <div style={{ marginTop:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:11, fontWeight:600, color:D.muted, textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
        <CopyBtn text={record}/>
      </div>
      <div style={{ background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:8, padding:'10px 14px' }}>
        <div style={{ fontFamily:'monospace', fontSize:12, color:'#7dd3fc', wordBreak:'break-all', lineHeight:1.6 }}>
          {parts.map((p, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color:D.dim }}>; </span>}
              <span style={{ color: p.startsWith('v=') ? '#f97316' : p.includes('include:') || p.includes('rua=') || p.includes('ruf=') ? '#a78bfa' : '#7dd3fc' }}>{p}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SPF Generator ────────────────────────────────────────────────────
function SPFGenerator() {
  const [domain, setDomain] = useState('')
  const [providers, setProviders] = useState({ google: false, microsoft: false, mailchimp: false, sendgrid: false, amazon: false, custom: false })
  const [customIPs, setCustomIPs] = useState('')
  const [qualifier, setQualifier] = useState('~all')
  const [open, setOpen] = useState(true)

  const PROVIDERS = [
    { key:'google', label:'Google Workspace', include:'_spf.google.com', lookups:1 },
    { key:'microsoft', label:'Microsoft 365', include:'spf.protection.outlook.com', lookups:1 },
    { key:'mailchimp', label:'Mailchimp', include:'servers.mcsv.net', lookups:1 },
    { key:'sendgrid', label:'SendGrid', include:'sendgrid.net', lookups:1 },
    { key:'amazon', label:'Amazon SES', include:'amazonses.com', lookups:1 },
  ]

  const selected = PROVIDERS.filter(p => providers[p.key])
  const lookupCount = selected.length + (customIPs ? 1 : 0)

  function buildSPF() {
    if (!domain) return ''
    let parts = ['v=spf1']
    selected.forEach(p => parts.push(`include:${p.include}`))
    if (customIPs) {
      customIPs.split(/[\n,\s]+/).filter(Boolean).forEach(ip => {
        parts.push(ip.includes('/') || !ip.includes(':') ? `ip4:${ip.trim()}` : `ip6:${ip.trim()}`)
      })
    }
    parts.push(qualifier)
    return parts.join(' ')
  }

  const record = buildSPF()

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:7 }}>
          <Wand2 size={14} color="#10b981"/> SPF record generator
        </span>
        <button onClick={() => setOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', color:D.muted }}>
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>
      {open && (
        <div style={{ padding:16 }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>Your domain</label>
            <input type="text" placeholder="yourdomain.com" value={domain} onChange={e => setDomain(e.target.value)}
              style={{ width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:8 }}>Email providers</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {PROVIDERS.map(p => (
                <label key={p.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:providers[p.key] ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border:`1px solid ${providers[p.key] ? 'rgba(16,185,129,0.3)' : D.border}`, borderRadius:7, cursor:'pointer', fontSize:12, color:D.text }}>
                  <input type="checkbox" checked={providers[p.key]} onChange={e => setProviders(prev => ({ ...prev, [p.key]: e.target.checked }))}
                    style={{ accentColor:'#10b981', width:14, height:14 }}/>
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>Custom IPs (optional, one per line)</label>
            <textarea value={customIPs} onChange={e => setCustomIPs(e.target.value)} rows={2} placeholder="192.168.1.1&#10;10.0.0.0/24"
              style={{ width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:12, color:D.text, outline:'none', resize:'vertical', fontFamily:'monospace' }}/>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:8 }}>Policy (how to handle failures)</label>
            <div style={{ display:'flex', gap:6 }}>
              {[['~all','SoftFail (recommended)'],['−all','HardFail (strict)'],['?all','Neutral']].map(([v, l]) => (
                <button key={v} onClick={() => setQualifier(v)}
                  style={{ padding:'6px 12px', background:qualifier === v ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border:`1px solid ${qualifier === v ? 'rgba(16,185,129,0.4)' : D.border}`, borderRadius:6, color:qualifier === v ? '#10b981' : D.muted, fontSize:11, cursor:'pointer', fontFamily:'monospace' }}>
                  {v} <span style={{ fontFamily:'inherit', fontSize:10, opacity:0.7 }}>— {l}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Lookup counter */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 12px', background:`rgba(${lookupCount >= 8 ? '239,68,68' : lookupCount >= 6 ? '245,158,11' : '16,185,129'},0.08)`, borderRadius:7, border:`1px solid rgba(${lookupCount >= 8 ? '239,68,68' : lookupCount >= 6 ? '245,158,11' : '16,185,129'},0.2)` }}>
            <AlertTriangle size={13} color={lookupCount >= 8 ? '#ef4444' : lookupCount >= 6 ? '#f59e0b' : '#10b981'}/>
            <span style={{ fontSize:12, color: lookupCount >= 8 ? '#ef4444' : lookupCount >= 6 ? '#f59e0b' : '#10b981' }}>
              DNS lookups: {lookupCount}/10 {lookupCount >= 8 ? '— near limit! Consider SPF flattening' : lookupCount >= 6 ? '— getting close to RFC 7208 limit' : '— well within limit'}
            </span>
          </div>
          {record && <RecordDisplay record={record} label="Generated SPF record — add as TXT at @"/>}
        </div>
      )}
    </div>
  )
}

// ─── DMARC Generator ─────────────────────────────────────────────────
function DMARCGenerator({ presetPolicy }) {
  const [domain, setDomain] = useState('')
  const [policy, setPolicy] = useState(presetPolicy || 'quarantine')
  const [spolicy, setSpolicy] = useState('none')
  const [rua, setRua] = useState('')
  const [ruf, setRuf] = useState('')
  const [pct, setPct] = useState(100)
  const [adkim, setAdkim] = useState('r')
  const [aspf, setAspf] = useState('r')
  const [open, setOpen] = useState(true)

  function build() {
    if (!domain) return ''
    let parts = ['v=DMARC1', `p=${policy}`]
    if (spolicy !== 'none') parts.push(`sp=${spolicy}`)
    if (rua) parts.push(`rua=mailto:${rua}`)
    if (ruf) parts.push(`ruf=mailto:${ruf}`)
    if (pct < 100) parts.push(`pct=${pct}`)
    if (adkim !== 'r') parts.push(`adkim=${adkim}`)
    if (aspf !== 'r') parts.push(`aspf=${aspf}`)
    return parts.join('; ')
  }

  const record = build()
  const policyColor = policy === 'reject' ? '#10b981' : policy === 'quarantine' ? '#f59e0b' : '#ef4444'

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:7 }}>
          <Shield size={14} color="#6366f1"/> DMARC record generator
        </span>
        <button onClick={() => setOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', color:D.muted }}>
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>
      {open && (
        <div style={{ padding:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>Domain</label>
              <input type="text" placeholder="yourdomain.com" value={domain} onChange={e => setDomain(e.target.value)}
                style={{ width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>Policy (p=)</label>
              <div style={{ display:'flex', gap:5 }}>
                {['none','quarantine','reject'].map(p => (
                  <button key={p} onClick={() => setPolicy(p)}
                    style={{ flex:1, padding:'7px 4px', background:policy === p ? `rgba(${p === 'reject' ? '16,185,129' : p === 'quarantine' ? '245,158,11' : '239,68,68'},0.15)` : 'rgba(255,255,255,0.04)', border:`1px solid ${policy === p ? policyColor : D.border}`, borderRadius:6, color:policy === p ? policyColor : D.muted, fontSize:11, cursor:'pointer', fontWeight:policy === p ? 600 : 400 }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>RUA email (aggregate reports)</label>
              <input type="email" placeholder={`dmarc@${domain || 'yourdomain.com'}`} value={rua} onChange={e => setRua(e.target.value)}
                style={{ width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:12, color:D.text, outline:'none', fontFamily:'inherit' }}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>RUF email (forensic reports)</label>
              <input type="email" placeholder={`forensic@${domain || 'yourdomain.com'}`} value={ruf} onChange={e => setRuf(e.target.value)}
                style={{ width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:12, color:D.text, outline:'none', fontFamily:'inherit' }}/>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>Percentage (pct=) {pct}%</label>
              <input type="range" min={1} max={100} step={1} value={pct} onChange={e => setPct(+e.target.value)}
                style={{ width:'100%', accentColor:'#6366f1' }}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>DKIM alignment (adkim=)</label>
              <div style={{ display:'flex', gap:5 }}>
                {[['r','Relaxed'],['s','Strict']].map(([v,l]) => (
                  <button key={v} onClick={() => setAdkim(v)}
                    style={{ flex:1, padding:'6px', background:adkim===v?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${adkim===v?'rgba(99,102,241,0.4)':D.border}`, borderRadius:6, color:adkim===v?'#818cf8':D.muted, fontSize:11, cursor:'pointer' }}>
                    {v} — {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>SPF alignment (aspf=)</label>
              <div style={{ display:'flex', gap:5 }}>
                {[['r','Relaxed'],['s','Strict']].map(([v,l]) => (
                  <button key={v} onClick={() => setAspf(v)}
                    style={{ flex:1, padding:'6px', background:aspf===v?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${aspf===v?'rgba(99,102,241,0.4)':D.border}`, borderRadius:6, color:aspf===v?'#818cf8':D.muted, fontSize:11, cursor:'pointer' }}>
                    {v} — {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {record && <RecordDisplay record={record} label={`Generated DMARC record — add as TXT at _dmarc.${domain || 'yourdomain.com'}`}/>}
        </div>
      )}
    </div>
  )
}

// ─── DKIM Selector Tool ───────────────────────────────────────────────
function DKIMTool() {
  const [domain, setDomain] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)

  const SELECTORS = [
    'google','default','selector1','selector2','k1','k2','k3','mail','smtp','dkim',
    'email','s1','s2','sig1','sig2','dk','mx','mxvault','pm','pm-bounces',
    'everlytickey1','everlytickey2','mta','outbound','postfix','cm','sendinblue',
    'mailjet','mandrill','sparkpost','sendgrid','amazonses','mailgun','zoho',
    'proofpoint','mimecast','barracuda','ironport','symantec','messagelabs',
    'dkim1','dkim2','key1','key2','a1','b1','zmail','yandex','yahoo',
  ]

  async function scan() {
    if (!domain) return
    setLoading(true)
    setResults([])
    const d = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase().trim()
    const found = []
    for (const sel of SELECTORS) {
      try {
        const url = `https://cloudflare-dns.com/dns-query?name=${sel}._domainkey.${d}&type=TXT`
        const res = await fetch(url, { headers: { Accept: 'application/dns-json' } })
        const data = await res.json()
        const rec = (data.Answer || []).find(r => r.data?.includes('v=DKIM1') || r.data?.includes('k=rsa') || r.data?.includes('p='))
        if (rec) {
          const raw = rec.data.replace(/"/g, '').trim()
          const keyMatch = raw.match(/p=([A-Za-z0-9+/=]{20,})/)
          const keySize = keyMatch ? Math.floor(keyMatch[1].length * 6 / 8 / 64) * 64 : null
          found.push({ selector: sel, raw, keySize, valid: true })
          setResults([...found])
        }
      } catch {}
    }
    if (!found.length) setResults([{ selector: null, raw: null, valid: false }])
    setLoading(false)
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:7 }}>
          <Key size={14} color="#f59e0b"/> DKIM selector discovery
        </span>
        <button onClick={() => setOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', color:D.muted }}>
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>
      {open && (
        <div style={{ padding:16 }}>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <input type="text" placeholder="yourdomain.com" value={domain} onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && scan()}
              style={{ flex:1, padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
            <button onClick={scan} disabled={loading || !domain}
              style={{ padding:'8px 20px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:7, color:'#f59e0b', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: !domain ? 0.5 : 1 }}>
              {loading ? <><div style={{ width:13, height:13, border:'2px solid rgba(245,158,11,0.3)', borderTopColor:'#f59e0b', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Scanning {SELECTORS.length} selectors…</> : <><Zap size={13}/> Discover</>}
            </button>
          </div>
          <div style={{ fontSize:11, color:D.dim, marginBottom:12 }}>Checks {SELECTORS.length} known selectors via Cloudflare DoH</div>
          {results.length > 0 && (
            <div>
              {results[0]?.selector === null ? (
                <div style={{ padding:'16px', textAlign:'center', color:D.muted, fontSize:13 }}>
                  No DKIM records found on {SELECTORS.length} common selectors
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {results.map(r => (
                    <div key={r.selector} style={{ padding:'10px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                        <CheckCircle size={14} color="#10b981"/>
                        <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'#f59e0b' }}>{r.selector}</span>
                        <span style={{ fontSize:11, color:D.muted }}>._domainkey.{domain}</span>
                        {r.keySize && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:8, background:r.keySize >= 2048 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color:r.keySize >= 2048 ? '#10b981' : '#f59e0b' }}>{r.keySize}-bit</span>}
                      </div>
                      <div style={{ fontFamily:'monospace', fontSize:10, color:D.dim, wordBreak:'break-all', lineHeight:1.5 }}>{r.raw?.slice(0, 120)}…</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Email Header Analyser ────────────────────────────────────────────
function EmailHeaderAnalyser() {
  const [header, setHeader] = useState('')
  const [result, setResult] = useState(null)
  const [open, setOpen] = useState(true)

  function analyse() {
    const lines = header.split('\n')
    const get = key => {
      const line = lines.find(l => l.toLowerCase().startsWith(key.toLowerCase() + ':'))
      return line ? line.slice(key.length + 1).trim() : null
    }
    const getAll = key => lines.filter(l => l.toLowerCase().startsWith(key.toLowerCase() + ':')).map(l => l.slice(key.length + 1).trim())

    const authResults = get('Authentication-Results') || ''
    const spfLine = get('Received-SPF') || ''
    const dkimLine = get('DKIM-Signature') || ''

    const spfPass = /pass/i.test(spfLine) || /spf=pass/i.test(authResults)
    const spfFail = /fail/i.test(spfLine) || /spf=fail/i.test(authResults)
    const dkimPass = /dkim=pass/i.test(authResults)
    const dkimFail = /dkim=fail/i.test(authResults)
    const dmarcPass = /dmarc=pass/i.test(authResults)
    const dmarcFail = /dmarc=fail/i.test(authResults)

    const fromHeader = get('From') || ''
    const receivedFrom = getAll('Received')
    const messageId = get('Message-ID') || ''
    const date = get('Date') || ''
    const subject = get('Subject') || ''

    const ipMatch = header.match(/\[(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]/)
    const sendingIP = ipMatch ? ipMatch[1] : null

    setResult({ spfPass, spfFail, dkimPass, dkimFail, dmarcPass, dmarcFail, spfLine, dkimLine: dkimLine?.slice(0,80), fromHeader, receivedFrom: receivedFrom.slice(0,3), messageId, date, subject, sendingIP, authResults: authResults?.slice(0, 200) })
  }

  const StatusDot = ({ pass, fail, label, value }) => {
    const color = pass ? '#10b981' : fail ? '#ef4444' : '#f59e0b'
    const status = pass ? 'Pass' : fail ? 'Fail' : 'Unknown'
    return (
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderBottom:`1px solid ${D.border}` }}>
        <div style={{ width:22, height:22, borderRadius:6, background:`rgba(${pass ? '16,185,129' : fail ? '239,68,68' : '245,158,11'},0.15)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {pass ? <CheckCircle size={13} color="#10b981"/> : fail ? <AlertTriangle size={13} color="#ef4444"/> : <AlertTriangle size={13} color="#f59e0b"/>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <span style={{ fontSize:12, fontWeight:700, color:D.text, fontFamily:'monospace' }}>{label}</span>
            <span style={{ fontSize:10, padding:'1px 7px', borderRadius:8, background:`rgba(${pass ? '16,185,129' : fail ? '239,68,68' : '245,158,11'},0.15)`, color }}>{status}</span>
          </div>
          {value && <div style={{ fontSize:10, color:D.dim, fontFamily:'monospace', wordBreak:'break-all' }}>{value}</div>}
        </div>
      </div>
    )
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:7 }}>
          <Mail size={14} color="#a78bfa"/> Email header analyser
        </span>
        <button onClick={() => setOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', color:D.muted }}>
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>
      {open && (
        <div style={{ padding:16 }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>
              Paste raw email header (Gmail: ⋮ → Show original → Copy to clipboard)
            </label>
            <textarea value={header} onChange={e => setHeader(e.target.value)} rows={6}
              placeholder="Delivered-To: user@example.com&#10;Received: from mail.example.com...&#10;Authentication-Results: mx.google.com;&#10;   dkim=pass header.i=@example.com;&#10;   spf=pass..."
              style={{ width:'100%', padding:'10px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:11, color:D.muted, outline:'none', resize:'vertical', fontFamily:'monospace', lineHeight:1.5 }}/>
          </div>
          <button onClick={analyse} disabled={!header}
            style={{ padding:'8px 20px', background:'rgba(167,139,250,0.15)', border:'1px solid rgba(167,139,250,0.3)', borderRadius:7, color:'#a78bfa', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: !header ? 0.5 : 1, marginBottom:12 }}>
            <Zap size={13}/> Analyse header
          </button>
          {result && (
            <div style={{ ...card, border:`1px solid ${D.border}` }}>
              <StatusDot pass={result.spfPass} fail={result.spfFail} label="SPF" value={result.spfLine}/>
              <StatusDot pass={result.dkimPass} fail={result.dkimFail} label="DKIM" value={result.dkimLine}/>
              <StatusDot pass={result.dmarcPass} fail={result.dmarcFail} label="DMARC" value={result.authResults}/>
              {[
                { l:'From', v:result.fromHeader },
                { l:'Sending IP', v:result.sendingIP },
                { l:'Date', v:result.date },
                { l:'Subject', v:result.subject },
              ].filter(f => f.v).map(f => (
                <div key={f.l} style={{ display:'flex', gap:12, padding:'8px 14px', borderBottom:`1px solid ${D.border}`, fontSize:12 }}>
                  <span style={{ color:D.dim, width:72, flexShrink:0 }}>{f.l}</span>
                  <span style={{ color:D.text, fontFamily: f.l === 'Sending IP' ? 'monospace' : 'inherit' }}>{f.v}</span>
                </div>
              ))}
              {result.receivedFrom.length > 0 && (
                <div style={{ padding:'8px 14px' }}>
                  <div style={{ fontSize:11, color:D.dim, marginBottom:6 }}>Routing path ({result.receivedFrom.length} hops)</div>
                  {result.receivedFrom.map((r, i) => (
                    <div key={i} style={{ fontSize:10, color:D.dim, fontFamily:'monospace', padding:'3px 0', borderBottom:`1px solid rgba(255,255,255,0.03)` }}>{r.slice(0, 100)}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Bulk Scanner ─────────────────────────────────────────────────────
function BulkScanner() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState([])
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(true)

  async function runBulk() {
    const domains = input.split(/[\n,\s]+/).map(d => d.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'')).filter(d => d.includes('.') && d.length > 3).slice(0, 25)
    if (!domains.length) return
    setScanning(true)
    setResults([])
    setProgress(0)
    const out = []
    for (let i = 0; i < domains.length; i++) {
      const d = domains[i]
      try {
        const { data } = await supabase.functions.invoke('dns-scan', { body: { domain: d, scan_type: 'website', save_to_db: false } })
        out.push({ domain: d, score: data?.health_score, spf: data?.email_auth?.spf_status, dmarc: data?.email_auth?.dmarc_status, ssl: data?.ssl_info?.overall_status, issues: data?.issues?.filter(i => i.severity === 'critical').length || 0, status: 'done' })
      } catch {
        out.push({ domain: d, score: null, status: 'error' })
      }
      setResults([...out])
      setProgress(Math.round(((i + 1) / domains.length) * 100))
    }
    setScanning(false)
  }

  function exportCSV() {
    const rows = [['Domain','Score','SPF','DMARC','SSL','Critical Issues']]
    results.forEach(r => rows.push([r.domain, r.score??'error', r.spf??'–', r.dmarc??'–', r.ssl??'–', r.issues??'–']))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }))
    a.download = 'domainradar-bulk-scan.csv'
    a.click()
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text, display:'flex', alignItems:'center', gap:7 }}>
          <Upload size={14} color="#22d3ee"/> Bulk domain scanner
        </span>
        <button onClick={() => setOpen(o => !o)} style={{ background:'none', border:'none', cursor:'pointer', color:D.muted }}>
          {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </button>
      </div>
      {open && (
        <div style={{ padding:16 }}>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>Domains (one per line, max 25)</label>
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={5}
              placeholder="google.com&#10;microsoft.com&#10;digicert.com"
              style={{ width:'100%', padding:'10px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:12, color:D.text, outline:'none', resize:'vertical', fontFamily:'monospace' }}/>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <button onClick={runBulk} disabled={scanning || !input}
              style={{ padding:'8px 20px', background:'rgba(34,211,238,0.15)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:7, color:'#22d3ee', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: !input ? 0.5 : 1 }}>
              {scanning ? <><div style={{ width:13, height:13, border:'2px solid rgba(34,211,238,0.3)', borderTopColor:'#22d3ee', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Scanning… {progress}%</> : <><Zap size={13}/> Scan all domains</>}
            </button>
            {results.length > 0 && !scanning && (
              <button onClick={exportCSV}
                style={{ padding:'8px 14px', border:`1px solid ${D.border}`, borderRadius:7, background:'transparent', color:D.muted, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <Upload size={12}/> Export CSV
              </button>
            )}
          </div>
          {scanning && (
            <div style={{ marginBottom:12 }}>
              <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'#22d3ee', borderRadius:2, transition:'width 0.3s ease' }}/>
              </div>
            </div>
          )}
          {results.length > 0 && (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'rgba(255,255,255,0.03)' }}>
                    {['Domain','Score','SPF','DMARC','SSL','Critical'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'7px 12px', fontSize:10, fontWeight:600, color:D.muted, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${D.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.domain} style={{ borderBottom:`1px solid rgba(255,255,255,0.04)` }}>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace', color:D.text }}>{r.domain}</td>
                      <td style={{ padding:'8px 12px', fontWeight:700, color: r.score >= 70 ? '#10b981' : r.score >= 50 ? '#f59e0b' : r.score ? '#ef4444' : D.dim }}>{r.score ?? '–'}</td>
                      {[r.spf, r.dmarc, r.ssl].map((v, i) => {
                        const p = ['pass','valid','pass'].includes(v?.toLowerCase())
                        const f = ['missing','fail','fail'].includes(v?.toLowerCase())
                        return <td key={i} style={{ padding:'8px 12px' }}><span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:`rgba(${p ? '16,185,129' : f ? '239,68,68' : '245,158,11'},0.12)`, color: p ? '#10b981' : f ? '#ef4444' : '#f59e0b' }}>{v ?? '–'}</span></td>
                      })}
                      <td style={{ padding:'8px 12px', color: r.issues > 0 ? '#ef4444' : '#10b981', fontWeight:600 }}>{r.issues ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tools Page ───────────────────────────────────────────────────────
export default function Tools() {
  const [activeGen, setActiveGen] = useState(null)

  return (
    <div style={{ background:D.bg, minHeight:'100%', padding:20, fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:D.text, marginBottom:4 }}>DNS tools</h2>
        <p style={{ fontSize:13, color:D.muted }}>Generators, analysers and diagnostic tools. No account needed for most tools.</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <SPFGenerator/>
        <DMARCGenerator presetPolicy={activeGen}/>
        <DKIMTool/>
        <EmailHeaderAnalyser/>
        <BulkScanner/>
      </div>
    </div>
  )
}
