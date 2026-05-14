import { useState } from 'react'
import { Wand2, Shield, Key, Mail, Upload, Copy, Check, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'

const D = {
  bg: '#0a0e1a', surface: '#0f1525', surface2: '#0f1525',
  border: rgba(255,255,255,0.07), text: '#f0f4ff',
  muted: 'rgba(255,255,255,0.45)', dim: 'rgba(255,255,255,0.25)',
}
const card = { background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, overflow:'hidden' }
const cardHd = { padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', background:D.surface2 }

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{ padding:'5px 12px', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:6, color:'#00d97e', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
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
      <div style={{ background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'10px 14px' }}>
        <div style={{ fontFamily:'monospace', fontSize:12, color:'#4d9fff', wordBreak:'break-all', lineHeight:1.6 }}>
          {parts.map((p, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color:D.dim }}>; </span>}
              <span style={{ color: p.startsWith('v=') ? '#ea580c' : p.includes('include:') || p.includes('rua=') || p.includes('ruf=') ? '#a78bfa' : '#4d9fff' }}>{p}</span>
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
              style={{ width:'100%', padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:8 }}>Email providers</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {PROVIDERS.map(p => (
                <label key={p.key} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:providers[p.key] ? 'rgba(16,185,129,0.08)' : '#0f1525', border:`1px solid ${providers[p.key] ? 'rgba(16,185,129,0.3)' : D.border}`, borderRadius:7, cursor:'pointer', fontSize:12, color:D.text }}>
                  <input type="checkbox" checked={providers[p.key]} onChange={e => setProviders(prev => ({ ...prev, [p.key]: e.target.checked }))}
                    style={{ accentColor:'#00d97e', width:14, height:14 }}/>
                  {p.label}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>Custom IPs (optional, one per line)</label>
            <textarea value={customIPs} onChange={e => setCustomIPs(e.target.value)} rows={2} placeholder="192.168.1.1&#10;10.0.0.0/24"
              style={{ width:'100%', padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:12, color:D.text, outline:'none', resize:'vertical', fontFamily:'monospace' }}/>
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:8 }}>Policy (how to handle failures)</label>
            <div style={{ display:'flex', gap:6 }}>
              {[['~all','SoftFail (recommended)'],['−all','HardFail (strict)'],['?all','Neutral']].map(([v, l]) => (
                <button key={v} onClick={() => setQualifier(v)}
                  style={{ padding:'6px 12px', background:qualifier === v ? 'rgba(16,185,129,0.15)' : '#0f1525', border:`1px solid ${qualifier === v ? 'rgba(16,185,129,0.4)' : D.border}`, borderRadius:6, color:qualifier === v ? '#00d97e' : D.muted, fontSize:11, cursor:'pointer', fontFamily:'monospace' }}>
                  {v} <span style={{ fontFamily:'inherit', fontSize:10, opacity:0.7 }}>— {l}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Lookup counter */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'8px 12px', background:`rgba(${lookupCount >= 8 ? '239,68,68' : lookupCount >= 6 ? '245,158,11' : '16,185,129'},0.08)`, borderRadius:7, border:`1px solid rgba(${lookupCount >= 8 ? '239,68,68' : lookupCount >= 6 ? '245,158,11' : '16,185,129'},0.2)` }}>
            <AlertTriangle size={13} color={lookupCount >= 8 ? '#ff5e5e' : lookupCount >= 6 ? '#ffb547' : '#00d97e'}/>
            <span style={{ fontSize:12, color: lookupCount >= 8 ? '#ff5e5e' : lookupCount >= 6 ? '#ffb547' : '#00d97e' }}>
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
  const policyColor = policy === 'reject' ? '#00d97e' : policy === 'quarantine' ? '#ffb547' : '#ff5e5e'

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
                style={{ width:'100%', padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>Policy (p=)</label>
              <div style={{ display:'flex', gap:5 }}>
                {['none','quarantine','reject'].map(p => (
                  <button key={p} onClick={() => setPolicy(p)}
                    style={{ flex:1, padding:'7px 4px', background:policy === p ? `rgba(${p === 'reject' ? '16,185,129' : p === 'quarantine' ? '245,158,11' : '239,68,68'},0.15)` : '#0f1525', border:`1px solid ${policy === p ? policyColor : D.border}`, borderRadius:6, color:policy === p ? policyColor : D.muted, fontSize:11, cursor:'pointer', fontWeight:policy === p ? 600 : 400 }}>
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
                style={{ width:'100%', padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:12, color:D.text, outline:'none', fontFamily:'inherit' }}/>
            </div>
            <div>
              <label style={{ fontSize:11, color:D.muted, display:'block', marginBottom:5 }}>RUF email (forensic reports)</label>
              <input type="email" placeholder={`forensic@${domain || 'yourdomain.com'}`} value={ruf} onChange={e => setRuf(e.target.value)}
                style={{ width:'100%', padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:12, color:D.text, outline:'none', fontFamily:'inherit' }}/>
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
                    style={{ flex:1, padding:'6px', background:adkim===v?'rgba(99,102,241,0.15)':'#0f1525', border:`1px solid ${adkim===v?'rgba(99,102,241,0.4)':D.border}`, borderRadius:6, color:adkim===v?'#818cf8':D.muted, fontSize:11, cursor:'pointer' }}>
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
                    style={{ flex:1, padding:'6px', background:aspf===v?'rgba(99,102,241,0.15)':'#0f1525', border:`1px solid ${aspf===v?'rgba(99,102,241,0.4)':D.border}`, borderRadius:6, color:aspf===v?'#818cf8':D.muted, fontSize:11, cursor:'pointer' }}>
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
              style={{ flex:1, padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
            <button onClick={scan} disabled={loading || !domain}
              style={{ padding:'8px 20px', background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:7, color:'#ffb547', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: !domain ? 0.5 : 1 }}>
              {loading ? <><div style={{ width:13, height:13, border:'2px solid rgba(245,158,11,0.3)', borderTopColor:'#ffb547', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Scanning {SELECTORS.length} selectors…</> : <><Zap size={13}/> Discover</>}
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
                        <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color:'#ffb547' }}>{r.selector}</span>
                        <span style={{ fontSize:11, color:D.muted }}>._domainkey.{domain}</span>
                        {r.keySize && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:8, background:r.keySize >= 2048 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color:r.keySize >= 2048 ? '#00d97e' : '#ffb547' }}>{r.keySize}-bit</span>}
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
    const color = pass ? '#00d97e' : fail ? '#ff5e5e' : '#ffb547'
    const status = pass ? 'Pass' : fail ? 'Fail' : 'Unknown'
    return (
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
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
              style={{ width:'100%', padding:'10px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:11, color:D.muted, outline:'none', resize:'vertical', fontFamily:'monospace', lineHeight:1.5 }}/>
          </div>
          <button onClick={analyse} disabled={!header}
            style={{ padding:'8px 20px', background:'rgba(167,139,250,0.15)', border:'1px solid rgba(167,139,250,0.3)', borderRadius:7, color:'#a78bfa', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: !header ? 0.5 : 1, marginBottom:12 }}>
            <Zap size={13}/> Analyse header
          </button>
          {result && (
            <div style={{ ...card, border:'1px solid rgba(255,255,255,0.07)' }}>
              <StatusDot pass={result.spfPass} fail={result.spfFail} label="SPF" value={result.spfLine}/>
              <StatusDot pass={result.dkimPass} fail={result.dkimFail} label="DKIM" value={result.dkimLine}/>
              <StatusDot pass={result.dmarcPass} fail={result.dmarcFail} label="DMARC" value={result.authResults}/>
              {[
                { l:'From', v:result.fromHeader },
                { l:'Sending IP', v:result.sendingIP },
                { l:'Date', v:result.date },
                { l:'Subject', v:result.subject },
              ].filter(f => f.v).map(f => (
                <div key={f.l} style={{ display:'flex', gap:12, padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', fontSize:12 }}>
                  <span style={{ color:D.dim, width:72, flexShrink:0 }}>{f.l}</span>
                  <span style={{ color:D.text, fontFamily: f.l === 'Sending IP' ? 'monospace' : 'inherit' }}>{f.v}</span>
                </div>
              ))}
              {result.receivedFrom.length > 0 && (
                <div style={{ padding:'8px 14px' }}>
                  <div style={{ fontSize:11, color:D.dim, marginBottom:6 }}>Routing path ({result.receivedFrom.length} hops)</div>
                  {result.receivedFrom.map((r, i) => (
                    <div key={i} style={{ fontSize:10, color:D.dim, fontFamily:'monospace', padding:'3px 0', borderBottom:`1px solid #f9fafb` }}>{r.slice(0, 100)}</div>
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
              style={{ width:'100%', padding:'10px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:12, color:D.text, outline:'none', resize:'vertical', fontFamily:'monospace' }}/>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <button onClick={runBulk} disabled={scanning || !input}
              style={{ padding:'8px 20px', background:'rgba(34,211,238,0.15)', border:'1px solid rgba(34,211,238,0.3)', borderRadius:7, color:'#22d3ee', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6, opacity: !input ? 0.5 : 1 }}>
              {scanning ? <><div style={{ width:13, height:13, border:'2px solid rgba(34,211,238,0.3)', borderTopColor:'#22d3ee', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Scanning… {progress}%</> : <><Zap size={13}/> Scan all domains</>}
            </button>
            {results.length > 0 && !scanning && (
              <button onClick={exportCSV}
                style={{ padding:'8px 14px', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, background:'transparent', color:D.muted, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <Upload size={12}/> Export CSV
              </button>
            )}
          </div>
          {scanning && (
            <div style={{ marginBottom:12 }}>
              <div style={{ height:4, background:'#141b2d', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'#22d3ee', borderRadius:2, transition:'width 0.3s ease' }}/>
              </div>
            </div>
          )}
          {results.length > 0 && (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#0f1525' }}>
                    {['Domain','Score','SPF','DMARC','SSL','Critical'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'7px 12px', fontSize:10, fontWeight:600, color:D.muted, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.domain} style={{ borderBottom:`1px solid #f9fafb` }}>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace', color:D.text }}>{r.domain}</td>
                      <td style={{ padding:'8px 12px', fontWeight:700, color: r.score >= 70 ? '#00d97e' : r.score >= 50 ? '#ffb547' : r.score ? '#ff5e5e' : D.dim }}>{r.score ?? '–'}</td>
                      {[r.spf, r.dmarc, r.ssl].map((v, i) => {
                        const p = ['pass','valid','pass'].includes(v?.toLowerCase())
                        const f = ['missing','fail','fail'].includes(v?.toLowerCase())
                        return <td key={i} style={{ padding:'8px 12px' }}><span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:`rgba(${p ? '16,185,129' : f ? '239,68,68' : '245,158,11'},0.12)`, color: p ? '#00d97e' : f ? '#ff5e5e' : '#ffb547' }}>{v ?? '–'}</span></td>
                      })}
                      <td style={{ padding:'8px 12px', color: r.issues > 0 ? '#ff5e5e' : '#00d97e', fontWeight:600 }}>{r.issues ?? '–'}</td>
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

// ─── SPF Flattener ────────────────────────────────────────────────────
function SPFFlattener() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  async function flatten() {
    if (!domain.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await supabase.functions.invoke('spf-flatten', { body: { domain: domain.trim() } })
      if (res.data?.error) throw new Error(res.data.error)
      setResult(res.data)
      setOpen(true)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text }}>SPF flattening — resolve all includes to a single flat record</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12, color:D.muted, marginBottom:12, lineHeight:1.6 }}>
          Too many DNS lookups? This tool recursively resolves all <code style={{ color:'#ea580c' }}>include:</code>, <code style={{ color:'#ea580c' }}>a:</code>, and <code style={{ color:'#ea580c' }}>mx</code> mechanisms into a flat list of IP addresses — bringing your lookup count to near zero.
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key==='Enter'&&flatten()}
            placeholder="yourdomain.com" style={{ flex:1, padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
          <button onClick={flatten} disabled={loading||!domain.trim()} style={{ padding:'8px 18px', background:'#00d97e', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            {loading ? <div style={{ width:12, height:12, border:'2px solid #9ca3af', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> : <Zap size={13}/>}
            Flatten
          </button>
        </div>
        {error && <div style={{ fontSize:12, color:'#ff5e5e', marginBottom:10 }}>{error}</div>}
        {result && (
          <>
            <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
              {[['IPs resolved', result.ip_count, '#00d97e'], ['Lookups after', result.lookup_count_after, result.lookup_count_after === 0 ? '#00d97e' : '#ffb547'], ['Original lookups', '10 limit', 'rgba(255,255,255,0.45)']].map(([l,v,c]) => (
                <div key={l} style={{ background:'#0f1525', borderRadius:8, padding:'8px 12px', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
                  <div style={{ fontSize:10, color:D.muted }}>{l}</div>
                </div>
              ))}
            </div>
            {result.warning && <div style={{ fontSize:11, color:'#ffb547', marginBottom:10, padding:'6px 10px', background:'rgba(245,158,11,0.08)', borderRadius:6 }}>⚠️ {result.warning}</div>}
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, color:D.muted, marginBottom:5 }}>Original record</div>
              <div style={{ fontFamily:'monospace', fontSize:11, color:'rgba(255,255,255,0.45)', background:'rgba(0,0,0,0.2)', padding:'8px 12px', borderRadius:7, wordBreak:'break-all', lineHeight:1.6 }}>{result.original}</div>
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:11, color:D.muted }}>Flattened record (copy this into DNS)</span>
                <CopyBtn text={result.flattened}/>
              </div>
              <div style={{ fontFamily:'monospace', fontSize:11, color:'#4d9fff', background:'#0f1525', padding:'8px 12px', borderRadius:7, wordBreak:'break-all', lineHeight:1.6 }}>{result.flattened}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── DKIM Rotation Wizard ─────────────────────────────────────────────
function DKIMRotation() {
  const [domain, setDomain] = useState('')
  const [checking, setChecking] = useState(false)
  const [selectors, setSelectors] = useState([])
  const [error, setError] = useState('')
  const [newSelector, setNewSelector] = useState('selector2')

  async function checkSelectors() {
    if (!domain.trim()) return
    setChecking(true); setError(''); setSelectors([])
    try {
      const allSelectors = ['google', 'selector1', 'selector2', 'default', 'k1', 'mail', 'smtp', 'dkim', 'email', 's1', 's2', 'key1', 'key2']
      const results = await Promise.all(allSelectors.map(async sel => {
        try {
          const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${sel}._domainkey.${domain.trim()}&type=TXT`, { headers: { Accept: 'application/dns-json' } })
          const data = await res.json()
          const rec = data.Answer?.find(a => a.data?.includes('v=DKIM1') || a.data?.includes('k=rsa') || a.data?.includes('p='))
          if (!rec) return null
          const raw = rec.data.replace(/"/g, '').trim()
          const keyMatch = raw.match(/p=([A-Za-z0-9+/=]+)/)
          const keyLen = keyMatch ? Math.round(keyMatch[1].length * 6 / 8 / 64) * 64 : null
          return { selector: sel, raw, key_size: keyLen, ttl: rec.TTL }
        } catch { return null }
      }))
      setSelectors(results.filter(Boolean))
    } catch (e) { setError(e.message) }
    setChecking(false)
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text }}>DKIM key rotation wizard</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12, color:D.muted, marginBottom:12, lineHeight:1.6 }}>
          Find all active DKIM selectors on your domain, check key sizes, and get step-by-step rotation guidance.
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key==='Enter'&&checkSelectors()}
            placeholder="yourdomain.com" style={{ flex:1, padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
          <button onClick={checkSelectors} disabled={checking||!domain.trim()} style={{ padding:'8px 16px', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:7, color:'#3b82f6', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {checking ? 'Scanning…' : 'Find selectors'}
          </button>
        </div>
        {error && <div style={{ fontSize:12, color:'#ff5e5e', marginBottom:10 }}>{error}</div>}
        {selectors.length > 0 && (
          <>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, color:D.muted, marginBottom:8, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em' }}>Active DKIM selectors found</div>
              {selectors.map(s => (
                <div key={s.selector} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'#0f1525', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)', marginBottom:6 }}>
                  <code style={{ fontSize:12, color:'#a78bfa', fontWeight:600 }}>{s.selector}</code>
                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background: s.key_size >= 2048 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: s.key_size >= 2048 ? '#00d97e' : '#ffb547', fontWeight:600 }}>{s.key_size || '?'}-bit</span>
                  <span style={{ fontSize:11, color:D.dim }}>TTL {s.ttl}s</span>
                  {s.key_size < 2048 && <span style={{ fontSize:10, color:'#ffb547', marginLeft:'auto' }}>⚠️ Upgrade to 2048-bit</span>}
                </div>
              ))}
            </div>
            <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:D.text, marginBottom:8 }}>How to rotate safely (zero downtime)</div>
              <ol style={{ fontSize:12, color:D.muted, margin:0, paddingLeft:20, lineHeight:2 }}>
                <li>Generate a new 2048-bit RSA key pair in your email provider dashboard</li>
                <li>Add the new public key as a TXT record: <code style={{ color:'#ea580c' }}>{newSelector}._domainkey.{domain}</code></li>
                <li>Wait for DNS propagation (15–60 minutes), then verify it appears above</li>
                <li>Switch your email provider to sign with the new selector</li>
                <li>Wait 48 hours, then delete the old selector record from DNS</li>
              </ol>
            </div>
          </>
        )}
        {selectors.length === 0 && domain && !checking && (
          <div style={{ fontSize:12, color:D.dim, textAlign:'center', padding:16 }}>No active DKIM selectors found. Check your email provider's setup instructions.</div>
        )}
      </div>
    </div>
  )
}

// ─── BIMI Checker ─────────────────────────────────────────────────────
function BIMIChecker() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function check() {
    if (!domain.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const d = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*/, '')
      const [bimiRes, dmarcRes] = await Promise.all([
        fetch(`https://cloudflare-dns.com/dns-query?name=default._bimi.${d}&type=TXT`, { headers: { Accept: 'application/dns-json' } }).then(r => r.json()),
        fetch(`https://cloudflare-dns.com/dns-query?name=_dmarc.${d}&type=TXT`, { headers: { Accept: 'application/dns-json' } }).then(r => r.json()),
      ])
      const bimiRec = bimiRes.Answer?.find(a => a.data?.includes('v=BIMI1'))
      const dmarcRec = dmarcRes.Answer?.find(a => a.data?.includes('v=DMARC1'))
      const dmarcRaw = dmarcRec?.data?.replace(/"/g, '').trim() || ''
      const dmarcPolicy = dmarcRaw.match(/p=(\w+)/)?.[1] || 'none'
      const logoUrl = bimiRec?.data?.match(/l=([^;]+)/)?.[1]?.trim()
      const vmcUrl = bimiRec?.data?.match(/a=([^;]+)/)?.[1]?.trim()
      setResult({
        bimi_found: !!bimiRec,
        raw: bimiRec?.data?.replace(/"/g, '').trim(),
        logo_url: logoUrl,
        vmc_url: vmcUrl,
        has_vmc: !!vmcUrl && vmcUrl !== '',
        dmarc_policy: dmarcPolicy,
        dmarc_ready: dmarcPolicy === 'quarantine' || dmarcPolicy === 'reject',
        domain: d,
      })
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text }}>BIMI checker — Brand Indicators for Message Identification</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12, color:D.muted, marginBottom:12, lineHeight:1.6 }}>
          BIMI lets your brand logo appear in Gmail, Apple Mail, and Yahoo inboxes next to your emails. Requires DMARC p=quarantine or p=reject, and a verified SVG logo.
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key==='Enter'&&check()}
            placeholder="yourdomain.com" style={{ flex:1, padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
          <button onClick={check} disabled={loading||!domain.trim()} style={{ padding:'8px 16px', background:'rgba(167,139,250,0.15)', border:'1px solid rgba(167,139,250,0.3)', borderRadius:7, color:'#a78bfa', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {loading ? 'Checking…' : 'Check BIMI'}
          </button>
        </div>
        {error && <div style={{ fontSize:12, color:'#ff5e5e', marginBottom:10 }}>{error}</div>}
        {result && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {[
                { label:'BIMI record', ok: result.bimi_found, yes:'Found', no:'Missing' },
                { label:'DMARC policy', ok: result.dmarc_ready, yes:`p=${result.dmarc_policy} ✓`, no:`p=${result.dmarc_policy} — upgrade needed` },
                { label:'VMC certificate', ok: result.has_vmc, yes:'Present', no:'Not found (logo may not show in all clients)' },
              ].map(s => (
                <div key={s.label} style={{ flex:1, minWidth:140, padding:'10px 12px', borderRadius:8, background: s.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${s.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                  <div style={{ fontSize:10, color:D.muted, marginBottom:3 }}>{s.label}</div>
                  <div style={{ fontSize:12, fontWeight:600, color: s.ok ? '#00d97e' : '#ff5e5e' }}>{s.ok ? s.yes : s.no}</div>
                </div>
              ))}
            </div>
            {result.bimi_found && result.raw && (
              <div>
                <div style={{ fontSize:11, color:D.muted, marginBottom:5 }}>BIMI record</div>
                <div style={{ fontFamily:'monospace', fontSize:11, color:'#4d9fff', background:'#0f1525', padding:'8px 12px', borderRadius:7, wordBreak:'break-all', lineHeight:1.6 }}>{result.raw}</div>
              </div>
            )}
            {result.logo_url && (
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:'#0f1525', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }}>
                <img src={result.logo_url} alt="BIMI logo" style={{ width:40, height:40, objectFit:'contain', background:'#fff', borderRadius:6, padding:2 }} onError={e => e.target.style.display='none'}/>
                <div>
                  <div style={{ fontSize:11, color:D.muted, marginBottom:2 }}>Logo URL</div>
                  <a href={result.logo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:'#3b82f6', wordBreak:'break-all' }}>{result.logo_url}</a>
                </div>
              </div>
            )}
            {!result.bimi_found && (
              <div style={{ background:'rgba(167,139,250,0.06)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:8, padding:'12px 14px' }}>
                <div style={{ fontSize:12, fontWeight:600, color:D.text, marginBottom:6 }}>How to set up BIMI</div>
                <ol style={{ fontSize:12, color:D.muted, margin:0, paddingLeft:20, lineHeight:2 }}>
                  <li>Ensure DMARC is at p=quarantine or p=reject</li>
                  <li>Create a square SVG logo (aspect ratio 1:1, &lt;32KB)</li>
                  <li>Host it at a public HTTPS URL</li>
                  <li>Add TXT record: <code style={{ color:'#ea580c' }}>default._bimi.{result.domain}</code> → <code style={{ color:'#4d9fff' }}>v=BIMI1; l=https://yourdomain.com/logo.svg;</code></li>
                  <li>For Gmail display, get a VMC (Verified Mark Certificate) from DigiCert or Entrust</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MTA-STS Checker ──────────────────────────────────────────────────
function MTASTSChecker() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function check() {
    if (!domain.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const d = domain.trim().replace(/^https?:\/\//, '').replace(/\/.*/, '')
      const [mtsStsRec, tlsRptRec, policyFetch] = await Promise.allSettled([
        fetch(`https://cloudflare-dns.com/dns-query?name=_mta-sts.${d}&type=TXT`, { headers: { Accept: 'application/dns-json' } }).then(r => r.json()),
        fetch(`https://cloudflare-dns.com/dns-query?name=_smtp._tls.${d}&type=TXT`, { headers: { Accept: 'application/dns-json' } }).then(r => r.json()),
        fetch(`https://mta-sts.${d}/.well-known/mta-sts.txt`).then(r => r.ok ? r.text() : null).catch(() => null),
      ])
      const mtaRaw = mtsStsRec.status === 'fulfilled' ? mtsStsRec.value.Answer?.find(a => a.data?.includes('v=STSv1'))?.data?.replace(/"/g,'').trim() : null
      const tlsRaw = tlsRptRec.status === 'fulfilled' ? tlsRptRec.value.Answer?.find(a => a.data?.includes('v=TLSRPTv1'))?.data?.replace(/"/g,'').trim() : null
      const policy = policyFetch.status === 'fulfilled' ? policyFetch.value : null
      const policyMode = policy?.match(/mode:\s*(\w+)/)?.[1] || null
      setResult({
        mta_sts_record: mtaRaw,
        tls_rpt_record: tlsRaw,
        policy_file: policy,
        policy_mode: policyMode,
        domain: d,
      })
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const statusDot = (ok) => <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: ok ? '#00d97e' : '#ff5e5e', marginRight:6 }}/>

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text }}>MTA-STS + TLS-RPT checker</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12, color:D.muted, marginBottom:12, lineHeight:1.6 }}>
          MTA-STS forces email servers to use TLS when delivering to your domain. TLS-RPT sends you reports when TLS fails. Together they protect against downgrade attacks.
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key==='Enter'&&check()}
            placeholder="yourdomain.com" style={{ flex:1, padding:'8px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit' }}/>
          <button onClick={check} disabled={loading||!domain.trim()} style={{ padding:'8px 16px', background:'rgba(34,211,238,0.12)', border:'1px solid rgba(34,211,238,0.25)', borderRadius:7, color:'#22d3ee', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>
        {error && <div style={{ fontSize:12, color:'#ff5e5e', marginBottom:10 }}>{error}</div>}
        {result && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { label:'MTA-STS DNS record', ok:!!result.mta_sts_record, val:result.mta_sts_record },
                { label:'MTA-STS policy file (mta-sts.'+result.domain+'/.well-known/mta-sts.txt)', ok:!!result.policy_file, val:result.policy_file ? `mode: ${result.policy_mode || '?'}` : null },
                { label:'TLS-RPT record', ok:!!result.tls_rpt_record, val:result.tls_rpt_record },
              ].map(item => (
                <div key={item.label} style={{ padding:'10px 12px', background:'#0f1525', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize:12, color:D.text, marginBottom:item.val ? 5 : 0 }}>{statusDot(item.ok)}{item.label}</div>
                  {item.val && <div style={{ fontFamily:'monospace', fontSize:10, color:'rgba(255,255,255,0.45)', marginTop:3, wordBreak:'break-all' }}>{item.val.slice(0,200)}</div>}
                  {!item.ok && <div style={{ fontSize:11, color:'#ff5e5e', marginTop:3 }}>Not configured</div>}
                </div>
              ))}
            </div>
            {(!result.mta_sts_record || !result.policy_file) && (
              <div style={{ background:'rgba(34,211,238,0.06)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:8, padding:'12px 14px' }}>
                <div style={{ fontSize:12, fontWeight:600, color:D.text, marginBottom:6 }}>How to set up MTA-STS</div>
                <ol style={{ fontSize:12, color:D.muted, margin:0, paddingLeft:20, lineHeight:2 }}>
                  <li>Host a policy file at <code style={{ color:'#ea580c' }}>https://mta-sts.{result.domain}/.well-known/mta-sts.txt</code></li>
                  <li>Content: <code style={{ color:'#4d9fff' }}>version: STSv1\nmode: enforce\nmx: mail.{result.domain}\nmax_age: 86400</code></li>
                  <li>Add DNS TXT: <code style={{ color:'#ea580c' }}>_mta-sts.{result.domain}</code> → <code style={{ color:'#4d9fff' }}>v=STSv1; id=20240101000000Z;</code></li>
                  <li>For TLS-RPT add: <code style={{ color:'#ea580c' }}>_smtp._tls.{result.domain}</code> → <code style={{ color:'#4d9fff' }}>v=TLSRPTv1; rua=mailto:tls@{result.domain};</code></li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Bulk Domain Import ───────────────────────────────────────────────
function BulkDomainImport({ user }) {
  const [text, setText] = useState('')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)

  async function importDomains() {
    if (!text.trim() || !user) return
    const lines = text.split(/[\n,;]+/).map(l => l.trim().replace(/^https?:\/\//, '').replace(/\/.*/, '').toLowerCase()).filter(l => l && l.includes('.'))
    const unique = [...new Set(lines)]
    if (!unique.length) return
    setImporting(true); setResults([]); setDone(false)
    const res = []
    for (const domain of unique.slice(0, 50)) {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
      const { error } = await supabase.from('domains').insert({ user_id: user.id, domain_name: domain, verify_token: token, monitor_interval: '6h' })
      res.push({ domain, status: error ? (error.code === '23505' ? 'already exists' : 'error') : 'added', ok: !error })
      setResults([...res])
    }
    setDone(true); setImporting(false)
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{ fontSize:13, fontWeight:600, color:D.text }}>Bulk domain import — add up to 50 domains at once</span>
      </div>
      <div style={{ padding:16 }}>
        <div style={{ fontSize:12, color:D.muted, marginBottom:12 }}>Paste domains one per line, or comma/semicolon separated. URLs are automatically cleaned.</div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder={'example.com\ngoogle.com\nhttps://microsoft.com/\nyourdomain.org'}
          style={{ width:'100%', padding:'10px 12px', background:'#0f1525', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, fontSize:12, fontFamily:'monospace', color:D.text, outline:'none', resize:'vertical', boxSizing:'border-box', marginBottom:10 }}/>
        {!user && <div style={{ fontSize:11, color:'#ffb547', marginBottom:10 }}>⚠️ Sign in to import domains to your account</div>}
        <button onClick={importDomains} disabled={importing || !text.trim() || !user} style={{ padding:'8px 18px', background:'#00d97e', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', marginBottom: results.length ? 14 : 0 }}>
          {importing ? 'Importing…' : 'Import domains'}
        </button>
        {results.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {results.map(r => (
              <div key={r.domain} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:`rgba(${r.ok ? '16,185,129' : '239,68,68'},0.06)`, borderRadius:6, border:`1px solid rgba(${r.ok ? '16,185,129' : '239,68,68'},0.15)` }}>
                <span style={{ fontSize:11, color: r.ok ? '#00d97e' : '#ffb547' }}>{r.ok ? '✓' : '—'}</span>
                <span style={{ fontSize:12, fontFamily:'monospace', color:D.text, flex:1 }}>{r.domain}</span>
                <span style={{ fontSize:10, color:D.muted }}>{r.status}</span>
              </div>
            ))}
            {done && <div style={{ fontSize:12, color:'#00d97e', marginTop:6 }}>Done. Go to Dashboard to verify and scan your new domains.</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tools Page ───────────────────────────────────────────────────────
export default function Tools({ user }) {
  const tabs = [
    { id:'generators', label:'Generators' },
    { id:'email', label:'Email security' },
    { id:'advanced', label:'Advanced' },
    { id:'import', label:'Bulk import' },
  ]
  const [activeTab, setActiveTab] = useState('generators')

  return (
    <div style={{ background:D.bg, minHeight:'100%', fontFamily:"'DM Sans','Inter',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:D.surface }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:D.text, marginBottom:12 }}>Tools</h2>
        <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding:'7px 16px', background:activeTab===t.id?'rgba(16,185,129,0.12)':'transparent', border:`1px solid ${activeTab===t.id?'rgba(16,185,129,0.25)':'transparent'}`, borderRadius:8, color:activeTab===t.id?'#00d97e':'rgba(255,255,255,0.45)', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>
        {activeTab === 'generators' && <><SPFGenerator/><DMARCGenerator/><DKIMTool/></>}
        {activeTab === 'email' && <><BIMIChecker/><MTASTSChecker/><EmailHeaderAnalyser/></>}
        {activeTab === 'advanced' && <><SPFFlattener/><DKIMRotation/><BulkScanner/></>}
        {activeTab === 'import' && <BulkDomainImport user={user}/>}
      </div>
    </div>
  )
}
