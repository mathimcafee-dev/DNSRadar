import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Trash2, Copy, Check, Eye, EyeOff, RefreshCw, Shield, Key, Globe, Clock, Bell, Zap, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'

const D = { bg:'#0d1117', surface:'#161b22', surface2:'#1c2333', border:'rgba(255,255,255,0.08)', text:'#e6edf3', muted:'rgba(255,255,255,0.5)', dim:'rgba(255,255,255,0.25)' }
const card = { background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, overflow:'hidden' }
const cardHd = { padding:'11px 16px', borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:D.surface2 }
const input = { width:'100%', padding:'8px 12px', background:'rgba(0,0,0,0.3)', border:`1px solid ${D.border}`, borderRadius:7, fontSize:13, color:D.text, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
const btn = (primary) => ({ padding:'7px 16px', background:primary?'#10b981':'rgba(255,255,255,0.06)', color:primary?'#fff':'rgba(255,255,255,0.7)', border:`1px solid ${primary?'transparent':'rgba(255,255,255,0.1)'}`, borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:5 })

function CopyBtn({ text }) {
  const [c,setC]=useState(false)
  return <button onClick={()=>{navigator.clipboard.writeText(text);setC(true);setTimeout(()=>setC(false),2000)}} style={btn(false)}>
    {c?<><Check size={12} color="#10b981"/>Copied</>:<><Copy size={12}/>Copy</>}
  </button>
}

// ─── DNS CREDENTIALS SECTION ──────────────────────────────────────────
function DNSCredentials({ user }) {
  const [creds, setCreds] = useState([])
  const [domains, setDomains] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ provider:'cloudflare', domain_id:'', zone_id:'', api_key:'', api_email:'', api_secret:'', label:'' })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState({})
  const [showKey, setShowKey] = useState({})

  useEffect(() => {
    supabase.from('dns_credentials').select('*').eq('user_id', user.id).then(({data}) => setCreds(data||[]))
    supabase.from('domains').select('id,domain_name').eq('user_id', user.id).then(({data}) => setDomains(data||[]))
  }, [user.id])

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('dns_credentials').insert({ ...form, user_id: user.id })
    if (!error) {
      const {data} = await supabase.from('dns_credentials').select('*').eq('user_id', user.id)
      setCreds(data||[]); setShowAdd(false); setForm({ provider:'cloudflare', domain_id:'', zone_id:'', api_key:'', api_email:'', api_secret:'', label:'' })
    }
    setSaving(false)
  }

  async function testCred(cred) {
    setTesting(t=>({...t,[cred.id]:true}))
    try {
      if (cred.provider === 'cloudflare') {
        const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cred.zone_id}`, { headers:{ 'Authorization':`Bearer ${cred.api_key}` } })
        const data = await res.json()
        const ok = data.success
        await supabase.from('dns_credentials').update({ verified: ok, verified_at: ok ? new Date().toISOString() : null }).eq('id', cred.id)
        setCreds(c=>c.map(x=>x.id===cred.id?{...x,verified:ok}:x))
      }
    } finally { setTesting(t=>({...t,[cred.id]:false})) }
  }

  async function remove(id) {
    await supabase.from('dns_credentials').delete().eq('id', id)
    setCreds(c=>c.filter(x=>x.id!==id))
  }

  const providerColors = { cloudflare:'#f38020', route53:'#ff9900', godaddy:'#1bdbad', namecheap:'#de3723' }
  const providerIcons = { cloudflare:'☁️', route53:'🔶', godaddy:'🤠', namecheap:'🌿' }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{fontSize:13,fontWeight:600,color:D.text,display:'flex',alignItems:'center',gap:7}}>
          <Globe size={14} color="#10b981"/> DNS provider credentials
        </span>
        <button onClick={()=>setShowAdd(s=>!s)} style={btn(true)}><Plus size={12}/> Add provider</button>
      </div>

      {showAdd && (
        <div style={{padding:16,borderBottom:`1px solid ${D.border}`,background:'rgba(16,185,129,0.04)'}}>
          <div style={{fontSize:12,fontWeight:500,color:D.text,marginBottom:12}}>Add DNS provider credentials</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>Provider</label>
              <select value={form.provider} onChange={e=>setForm(f=>({...f,provider:e.target.value}))}
                style={{...input}}>
                <option value="cloudflare">Cloudflare</option>
                <option value="godaddy">GoDaddy</option>
                <option value="route53">AWS Route 53</option>
                <option value="namecheap">Namecheap</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>Domain (optional)</label>
              <select value={form.domain_id} onChange={e=>setForm(f=>({...f,domain_id:e.target.value}))}
                style={{...input}}>
                <option value="">All domains</option>
                {domains.map(d=><option key={d.id} value={d.id}>{d.domain_name}</option>)}
              </select>
            </div>
            {form.provider==='cloudflare'&&<>
              <div>
                <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>Zone ID</label>
                <input style={input} placeholder="e.g. a1b2c3d4e5f6..." value={form.zone_id} onChange={e=>setForm(f=>({...f,zone_id:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>API Token <span style={{color:D.dim}}>(Zone:DNS Edit)</span></label>
                <input style={input} type="password" placeholder="cf_..." value={form.api_key} onChange={e=>setForm(f=>({...f,api_key:e.target.value}))}/>
              </div>
            </>}
            {form.provider==='godaddy'&&<>
              <div>
                <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>API Key</label>
                <input style={input} value={form.api_key} onChange={e=>setForm(f=>({...f,api_key:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>API Secret</label>
                <input style={input} type="password" value={form.api_secret} onChange={e=>setForm(f=>({...f,api_secret:e.target.value}))}/>
              </div>
            </>}
            <div>
              <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>Label (optional)</label>
              <input style={input} placeholder="e.g. Production Cloudflare" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))}/>
            </div>
          </div>
          <div style={{padding:'10px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:8,fontSize:11,color:'rgba(245,158,11,0.9)',marginBottom:12}}>
            <AlertTriangle size={12} style={{verticalAlign:'middle',marginRight:6}}/>
            Credentials are stored securely. DomainRadar only creates DNS records — it never deletes or modifies existing ones without your confirmation.
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={save} disabled={saving||!form.api_key} style={btn(true)}>
              {saving?'Saving…':'Save credential'}
            </button>
            <button onClick={()=>setShowAdd(false)} style={btn(false)}>Cancel</button>
          </div>
        </div>
      )}

      {creds.length===0&&!showAdd&&(
        <div style={{padding:'32px',textAlign:'center',color:D.muted,fontSize:13}}>
          <Globe size={28} color="rgba(255,255,255,0.15)" style={{marginBottom:8,display:'block',margin:'0 auto 10px'}}/>
          No DNS credentials yet. Add Cloudflare, GoDaddy, or Route 53 to enable one-click DNS record fixes.
        </div>
      )}

      {creds.map(c=>(
        <div key={c.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
          <div style={{fontSize:20}}>{providerIcons[c.provider]||'🌐'}</div>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
              <span style={{fontSize:13,fontWeight:600,color:D.text}}>{c.label||c.provider}</span>
              <span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:`${providerColors[c.provider]||'#555'}20`,color:providerColors[c.provider]||D.muted}}>{c.provider}</span>
              {c.verified&&<span style={{fontSize:10,padding:'1px 7px',borderRadius:8,background:'rgba(16,185,129,0.15)',color:'#10b981'}}>✓ Verified</span>}
            </div>
            <div style={{fontSize:11,color:D.dim,fontFamily:'monospace'}}>
              {c.zone_id?`Zone: ${c.zone_id.slice(0,12)}…`:''}
              {domains.find(d=>d.id===c.domain_id)?.domain_name||'All domains'}
            </div>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button onClick={()=>testCred(c)} disabled={testing[c.id]} style={btn(false)}>
              {testing[c.id]?<><RefreshCw size={11} style={{animation:'spin 0.7s linear infinite'}}/>Testing…</>:<><Zap size={11}/>Test</>}
            </button>
            <button onClick={()=>remove(c.id)} style={{...btn(false),color:'#ef4444',borderColor:'rgba(239,68,68,0.2)'}}>
              <Trash2 size={11}/>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── API KEYS SECTION ─────────────────────────────────────────────────
function APIKeys({ user }) {
  const [keys, setKeys] = useState([])
  const [newKey, setNewKey] = useState(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showKey, setShowKey] = useState({})

  useEffect(() => {
    supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at',{ascending:false}).then(({data})=>setKeys(data||[]))
  },[user.id])

  async function createKey() {
    if (!name) return
    setCreating(true)
    const rawKey = `dr_${crypto.randomUUID().replace(/-/g,'')}`
    const encoder = new TextEncoder()
    const data = encoder.encode(rawKey)
    const hashBuf = await crypto.subtle.digest('SHA-256', data)
    const hash = Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('')
    const prefix = rawKey.slice(0,10)
    const {error} = await supabase.from('api_keys').insert({ user_id:user.id, name, key_hash:hash, key_prefix:prefix, scopes:['scan:read'] })
    if (!error) {
      setNewKey(rawKey)
      const {data:fresh}=await supabase.from('api_keys').select('*').eq('user_id',user.id).order('created_at',{ascending:false})
      setKeys(fresh||[]); setName('')
    }
    setCreating(false)
  }

  async function revokeKey(id) {
    await supabase.from('api_keys').update({revoked:true}).eq('id',id)
    setKeys(k=>k.map(x=>x.id===id?{...x,revoked:true}:x))
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{fontSize:13,fontWeight:600,color:D.text,display:'flex',alignItems:'center',gap:7}}><Key size={14} color="#6366f1"/> API keys</span>
        <a href="https://kbfgnbhjczicpjqxbxjj.supabase.co/functions/v1/api-scan?domain=google.com" target="_blank"
          style={{fontSize:11,color:'rgba(99,102,241,0.7)',display:'flex',alignItems:'center',gap:4}}>
          API docs <ExternalLink size={11}/>
        </a>
      </div>

      {newKey&&(
        <div style={{margin:14,padding:'12px 14px',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:600,color:'#10b981',marginBottom:6}}>✓ New API key created — copy it now, it won't be shown again</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <code style={{flex:1,fontSize:12,fontFamily:'monospace',color:D.text,background:'rgba(0,0,0,0.3)',padding:'7px 10px',borderRadius:6,wordBreak:'break-all'}}>{newKey}</code>
            <CopyBtn text={newKey}/>
          </div>
          <div style={{fontSize:11,color:D.muted,marginTop:8}}>
            Use as: <code style={{fontFamily:'monospace',color:'#10b981'}}>X-API-Key: {newKey}</code> or <code style={{fontFamily:'monospace',color:'#10b981'}}>?api_key={newKey}</code>
          </div>
        </div>
      )}

      <div style={{padding:'12px 16px',borderBottom:`1px solid ${D.border}`,display:'flex',gap:8}}>
        <input style={{...input,flex:1}} placeholder="Key name, e.g. CI/CD pipeline" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createKey()}/>
        <button onClick={createKey} disabled={creating||!name} style={btn(true)}>
          {creating?'Creating…':<><Plus size={12}/>Generate key</>}
        </button>
      </div>

      {keys.length===0&&(
        <div style={{padding:'24px',textAlign:'center',color:D.muted,fontSize:12}}>No API keys yet. Generate one to access your scan data programmatically.</div>
      )}

      {keys.map(k=>(
        <div key={k.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',borderBottom:`1px solid rgba(255,255,255,0.04)`,opacity:k.revoked?0.5:1}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:2}}>
              <span style={{fontSize:12,fontWeight:600,color:D.text}}>{k.name}</span>
              {k.revoked&&<span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'rgba(239,68,68,0.15)',color:'#ef4444'}}>Revoked</span>}
              <span style={{fontSize:10,padding:'1px 6px',borderRadius:8,background:'rgba(99,102,241,0.15)',color:'#818cf8'}}>{k.scopes?.join(', ')}</span>
            </div>
            <div style={{fontSize:11,color:D.dim,fontFamily:'monospace'}}>
              {k.key_prefix}… · {k.request_count||0} requests · Created {new Date(k.created_at).toLocaleDateString()}
              {k.last_used_at&&` · Last used ${new Date(k.last_used_at).toLocaleDateString()}`}
            </div>
          </div>
          {!k.revoked&&<button onClick={()=>revokeKey(k.id)} style={{...btn(false),color:'#ef4444',borderColor:'rgba(239,68,68,0.2)'}}>Revoke</button>}
        </div>
      ))}

      <div style={{padding:'12px 16px',background:'rgba(99,102,241,0.04)',borderTop:`1px solid ${D.border}`}}>
        <div style={{fontSize:12,fontWeight:500,color:D.text,marginBottom:6}}>API endpoint</div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <code style={{flex:1,fontSize:11,fontFamily:'monospace',color:'#818cf8',background:'rgba(0,0,0,0.3)',padding:'7px 10px',borderRadius:6}}>
            GET https://kbfgnbhjczicpjqxbxjj.supabase.co/functions/v1/api-scan?domain=example.com
          </code>
          <CopyBtn text="curl -H 'X-API-Key: YOUR_KEY' 'https://kbfgnbhjczicpjqxbxjj.supabase.co/functions/v1/api-scan?domain=example.com'"/>
        </div>
      </div>
    </div>
  )
}

// ─── PROFILE / ALERTS SECTION ─────────────────────────────────────────
function ProfileSettings({ user }) {
  const [profile, setProfile] = useState({ full_name:'', alert_email:true, alert_webhook:'', report_time:'07:00' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(()=>{
    supabase.from('profiles').select('*').eq('id',user.id).single().then(({data})=>{
      if(data) setProfile({full_name:data.full_name||'',alert_email:data.alert_email??true,alert_webhook:data.alert_webhook||'',report_time:data.report_time||'07:00'})
    })
  },[user.id])

  async function save() {
    setSaving(true)
    await supabase.from('profiles').update(profile).eq('id',user.id)
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  return (
    <div style={card}>
      <div style={cardHd}>
        <span style={{fontSize:13,fontWeight:600,color:D.text,display:'flex',alignItems:'center',gap:7}}><Bell size={14} color="#a78bfa"/> Notifications & profile</span>
        {saved&&<span style={{fontSize:11,color:'#10b981',display:'flex',alignItems:'center',gap:4}}><CheckCircle size={12}/>Saved</span>}
      </div>
      <div style={{padding:16,display:'flex',flexDirection:'column',gap:12}}>
        <div>
          <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>Display name</label>
          <input style={input} value={profile.full_name} onChange={e=>setProfile(p=>({...p,full_name:e.target.value}))} placeholder="Your name"/>
        </div>
        <div>
          <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>Email</label>
          <input style={{...input,opacity:0.5}} value={user.email} disabled/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:8,border:`1px solid ${D.border}`}}>
          <input type="checkbox" id="alertEmail" checked={profile.alert_email} onChange={e=>setProfile(p=>({...p,alert_email:e.target.checked}))} style={{accentColor:'#10b981',width:15,height:15}}/>
          <label htmlFor="alertEmail" style={{fontSize:13,color:D.text,cursor:'pointer'}}>Email alerts when DNS records change</label>
        </div>
        <div>
          <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>Slack / Teams webhook URL <span style={{color:D.dim}}>(optional)</span></label>
          <input style={input} value={profile.alert_webhook} onChange={e=>setProfile(p=>({...p,alert_webhook:e.target.value}))} placeholder="https://hooks.slack.com/services/..."/>
        </div>
        <div>
          <label style={{fontSize:11,color:D.muted,display:'block',marginBottom:4}}>Daily report time (UTC)</label>
          <select value={profile.report_time} onChange={e=>setProfile(p=>({...p,report_time:e.target.value}))} style={{...input,width:'auto'}}>
            {['06:00','07:00','08:00','09:00','12:00','18:00'].map(t=><option key={t} value={t}>{t} UTC</option>)}
          </select>
        </div>
        <button onClick={save} disabled={saving} style={{...btn(true),alignSelf:'flex-start'}}>
          {saving?'Saving…':'Save settings'}
        </button>
      </div>
    </div>
  )
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────
export default function Settings({ user }) {
  const [tab, setTab] = useState('dns')
  const tabs = [
    { id:'dns', icon:Globe, label:'DNS providers' },
    { id:'api', icon:Key, label:'API keys' },
    { id:'profile', icon:Bell, label:'Notifications' },
  ]

  return (
    <div style={{background:D.bg,minHeight:'100%',fontFamily:"'DM Sans','Inter',system-ui,sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{padding:'16px 20px',borderBottom:`1px solid ${D.border}`,background:D.surface}}>
        <h2 style={{fontSize:16,fontWeight:700,color:D.text,marginBottom:12}}>Settings</h2>
        <div style={{display:'flex',gap:2}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:'7px 16px',background:tab===t.id?'rgba(16,185,129,0.12)':'transparent',border:`1px solid ${tab===t.id?'rgba(16,185,129,0.25)':'transparent'}`,borderRadius:8,color:tab===t.id?'#10b981':'rgba(255,255,255,0.45)',fontSize:12,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
              <t.icon size={13}/>{t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:20,display:'flex',flexDirection:'column',gap:14,maxWidth:820}}>
        {tab==='dns'&&<DNSCredentials user={user}/>}
        {tab==='api'&&<APIKeys user={user}/>}
        {tab==='profile'&&<ProfileSettings user={user}/>}
      </div>
    </div>
  )
}
