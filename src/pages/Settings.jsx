import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check, Users, Mail, Bell, LogOut, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const D = { bg:'#f7f8fa', surface:'#ffffff', surface2:'#f9fafb', border:'#e5e7eb', text:'#111827', muted:'#374151', dim:'#6b7280' }
const card = { background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', marginBottom:16 }
const cardHd = { padding:'12px 16px', borderBottom:'1px solid #f0f2f5', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafafa' }

function CopyBtn({ text }) {
  const [c,setC]=useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setC(true); setTimeout(()=>setC(false),2000) }}
      style={{ padding:'4px 10px', background:'rgba(16,185,129,0.1)', border:'1px solid #86efac', borderRadius:5, color:'#111827', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
      {c?<><Check size={11}/>Copied</>:<><Copy size={11}/>Copy</>}
    </button>
  )
}

export default function Settings({ user }) {
  const { signOut } = useAuth()
  const [apiKeys, setApiKeys] = useState([])
  const [profile, setProfile] = useState({})
  const [saving, setSaving] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState(null)
  const [showKey, setShowKey] = useState({})
  const [activeTab, setActiveTab] = useState('api')

  useEffect(() => { if(user) { fetchKeys(); fetchProfile() } }, [user])

  async function fetchKeys() {
    const { data } = await supabase.from('api_keys').select('id,name,key_prefix,last_used_at,created_at,revoked,request_count').eq('user_id', user.id).order('created_at', { ascending: false })
    setApiKeys(data || [])
  }

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data || {})
  }

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update({ full_name: profile.full_name, alert_email: profile.alert_email, alert_webhook: profile.alert_webhook }).eq('id', user.id)
    setSaving(false)
  }

  async function createApiKey() {
    if (!newKeyName.trim()) return
    const rawKey = `dr_${crypto.randomUUID().replace(/-/g,'').slice(0,32)}`
    const encoder = new TextEncoder()
    const data = encoder.encode(rawKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: keyRow, error } = await supabase.from('api_keys').insert({
      user_id: user.id,
      name: newKeyName.trim(),
      key_hash: keyHash,
      key_prefix: rawKey.slice(0, 8),
    }).select('id').single()

    if (!error) {
      setCreatedKey({ id: keyRow.id, key: rawKey })
      setNewKeyName('')
      fetchKeys()
    }
  }

  async function revokeKey(id) {
    await supabase.from('api_keys').update({ revoked: true }).eq('id', id)
    fetchKeys()
  }

  return (
    <div style={{ background:'#f7f8fa', minHeight:'100%', padding:20, fontFamily:"'DM Sans','Inter',system-ui,sans-serif", maxWidth:800 }}>
      <h2 style={{ fontSize:17, fontWeight:700, color:'#111827', marginBottom:20 }}>Settings</h2>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid #e5e7eb', marginBottom:20 }}>
        {['api','profile','notifications','team'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding:'8px 16px', background:'transparent', border:'none', borderBottom:`2px solid ${activeTab===t?'#00e5a0':'transparent'}`, cursor:'pointer', fontSize:12, fontWeight:activeTab===t?600:400, color:activeTab===t?'#00e5a0':D.muted, textTransform:'capitalize', transition:'all 0.15s', marginBottom:-1 }}>
            {t === 'api' ? 'API Keys' : t === 'notifications' ? 'Notifications' : t === 'team' ? 'Team' : 'Profile'}
          </button>
        ))}
      </div>

      {activeTab === 'api' && (
        <>
          <div style={card}>
            <div style={{ ...cardHd }}><Key size={13} color="#10b981"/> API keys</div>
            <div style={{ padding:16 }}>
              <div style={{ fontSize:13,color:'#374151', marginBottom:12, lineHeight:1.6 }}>
                Use API keys to access DomainRadar programmatically. Include as <code style={{ fontFamily:'monospace', background:'#e5e7eb', padding:'1px 6px', borderRadius:4 }}>Authorization: Bearer YOUR_KEY</code> header.
              </div>
              {/* Endpoint docs */}
              <div style={{ background:'#f1f5f9', borderRadius:8, padding:'12px 14px', marginBottom:16, fontFamily:'monospace', fontSize:11 }}>
                <div style={{ color:'#374151', marginBottom:6 }}>Base URL: https://kbfgnbhjczicpjqxbxjj.supabase.co/functions/v1/api-scan</div>
                {[
                  ['GET','?action=scan&domain=example.com','Full DNS scan'],
                  ['GET','?action=domains','List your domains'],
                  ['GET','?action=history&domain=example.com','Scan history'],
                ].map(([m,ep,desc]) => (
                  <div key={ep} style={{ display:'flex', gap:10, marginBottom:4 }}>
                    <span style={{ color:'#3730a3', width:30 }}>{m}</span>
                    <span style={{ color:'#15803d', flex:1 }}>{ep}</span>
                    <span style={{ color:'#374151' }}>{desc}</span>
                  </div>
                ))}
              </div>
              {/* Create new key */}
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. CI/CD pipeline)"
                  style={{ flex:1, padding:'8px 12px', background:'#f1f5f9', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, color:'#111827', outline:'none', fontFamily:'inherit' }}
                  onKeyDown={e => e.key==='Enter'&&createApiKey()}/>
                <button onClick={createApiKey} disabled={!newKeyName.trim()}
                  style={{ padding:'8px 16px', background:'#dcfce7', border:'1px solid rgba(16,185,129,0.3)', borderRadius:7, color:'#111827', fontSize:13, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5, opacity:!newKeyName.trim()?0.5:1 }}>
                  <Plus size={13}/> Generate
                </button>
              </div>
              {/* Show newly created key */}
              {createdKey && (
                <div style={{ padding:'12px 14px', background:'#f0fdf4', border:'1px solid #d1d5db', borderRadius:8, marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#111827', marginBottom:6 }}>✓ Key created — copy it now, it won't be shown again</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <code style={{ flex:1, fontFamily:'monospace', fontSize:12, color:'#111827', background:'#f1f5f9', padding:'6px 10px', borderRadius:6, wordBreak:'break-all' }}>{createdKey.key}</code>
                    <CopyBtn text={createdKey.key}/>
                    <button onClick={() => setCreatedKey(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151', fontSize:16 }}>✕</button>
                  </div>
                </div>
              )}
              {/* Keys list */}
              {apiKeys.map(k => (
                <div key={k.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:`1px solid #f9fafb` }}>
                  <Key size={13} color={k.revoked?D.dim:'#00e5a0'}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:k.revoked?D.dim:D.text }}>{k.name}</div>
                    <div style={{ fontSize:10, color:'#374151', fontFamily:'monospace' }}>{k.key_prefix}… · {k.request_count||0} requests · {k.last_used_at?`Last used ${new Date(k.last_used_at).toLocaleDateString()}`:'Never used'}</div>
                  </div>
                  {k.revoked ? <span style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:'#e5e7eb', color:'#374151' }}>Revoked</span>
                    : <button onClick={() => revokeKey(k.id)} style={{ padding:'4px 10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, color:'#ff4d6a', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}><Trash2 size={10}/> Revoke</button>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'profile' && (
        <div style={card}>
          <div style={{ ...cardHd }}><Users size={13} color="#a78bfa"/> Profile</div>
          <div style={{ padding:16 }}>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12,color:'#374151', display:'block', marginBottom:5 }}>Email</label>
              <div style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:7, fontSize:13, color:'#374151', fontFamily:'monospace' }}>{user?.email}</div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12,color:'#374151', display:'block', marginBottom:5 }}>Display name</label>
              <input value={profile.full_name||''} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Your name"
                style={{ width:'100%', padding:'8px 12px', background:'#f1f5f9', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, color:'#111827', outline:'none', fontFamily:'inherit' }}/>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={saveProfile} disabled={saving}
                style={{ padding:'8px 18px', background:'#00e5a0', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:500, cursor:'pointer' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={() => { if(window.confirm('Sign out?')) signOut() }}
                style={{ padding:'8px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, color:'#ff4d6a', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <LogOut size={13}/> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div style={card}>
          <div style={{ ...cardHd }}><Bell size={13} color="#f59e0b"/> Notifications</div>
          <div style={{ padding:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, cursor:'pointer' }}>
              <input type="checkbox" checked={profile.alert_email||true} onChange={e => setProfile(p => ({ ...p, alert_email: e.target.checked }))} style={{ accentColor:'#00e5a0', width:16, height:16 }}/>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'#111827' }}>Email alerts</div>
                <div style={{ fontSize:12,color:'#374151' }}>Get notified when a domain score changes or new issues are detected</div>
              </div>
            </label>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12,color:'#374151', display:'block', marginBottom:5 }}>Webhook URL (Slack, Teams, custom)</label>
              <input value={profile.alert_webhook||''} onChange={e => setProfile(p => ({ ...p, alert_webhook: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
                style={{ width:'100%', padding:'8px 12px', background:'#f1f5f9', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, color:'#111827', outline:'none', fontFamily:'monospace' }}/>
            </div>
            <button onClick={saveProfile} disabled={saving}
              style={{ padding:'8px 18px', background:'#00e5a0', color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:500, cursor:'pointer' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
      {activeTab === 'team' && (
        <TeamSection user={user}/>
      )}
    </div>
  )
}

function TeamSection({ user }) {
  const [members, setMembers] = useState([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const D = { surface:'#ffffff', surface2:'#f9fafb', border:'#e5e7eb', text:'#111827', muted:'#374151', dim:'#6b7280' }
  const card = { background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }
  const cardHd = { padding:'11px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:7, background:'#ffffff', fontSize:13, fontWeight:600, color:'#111827' }
  const input = { width:'100%', padding:'8px 12px', background:'#f1f5f9', border:'1px solid #e5e7eb', borderRadius:7, fontSize:13, color:'#111827', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }

  useEffect(() => { load() }, [user.id])

  async function load() {
    const { data } = await supabase.from('team_members').select('*').eq('owner_id', user.id).order('invited_at', { ascending: false })
    setMembers(data || [])
  }

  async function invite() {
    if (!email.trim()) return
    setSaving(true)
    const token = crypto.randomUUID().replace(/-/g,'')
    const { error } = await supabase.from('team_members').insert({ owner_id:user.id, member_email:email.trim(), role, status:'pending', invite_token:token, invited_at:new Date().toISOString() })
    if (error) { setMsg('Error: ' + error.message) } else { setMsg(`Invite sent to ${email.trim()}`); setEmail(''); load() }
    setSaving(false); setTimeout(() => setMsg(''), 4000)
  }

  async function remove(id) {
    await supabase.from('team_members').delete().eq('id', id)
    setMembers(m => m.filter(x => x.id !== id))
  }

  const statusColor = { pending:'#ffb224', active:'#00e5a0', rejected:'#ff4d6a' }
  const roleColor   = { admin:'#a855f7', editor:'#3d9bff', viewer:'#6b7280' }

  return (
    <div style={card}>
      <div style={cardHd}><Users size={13} color="#3b82f6"/> Team members</div>
      <div style={{ padding:16 }}>
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          <input style={{ ...input, flex:1, minWidth:180 }} placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter'&&invite()}/>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ ...input, width:'auto' }}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={invite} disabled={saving||!email.trim()} style={{ padding:'8px 16px', background:'#00e5a0', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
            {saving ? 'Sending…' : 'Invite'}
          </button>
        </div>
        {msg && <div style={{ fontSize:12, color:'#111827', marginBottom:12, padding:'6px 10px', background:'#f0fdf4', borderRadius:6 }}>{msg}</div>}
        {members.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px', color:'#374151', fontSize:12 }}>No team members yet. Invite someone above.</div>
        ) : members.map(m => (
          <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid #e5e7eb', marginBottom:6 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(59,130,246,0.15)', color:'#3730a3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{m.member_email?.[0]?.toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:500, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.member_email}</div>
              <div style={{ fontSize:10, color:'#374151' }}>{m.accepted_at ? `Joined ${new Date(m.accepted_at).toLocaleDateString()}` : `Invited ${new Date(m.invited_at).toLocaleDateString()}`}</div>
            </div>
            <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:`${roleColor[m.role]||'#6b7280'}18`, color:roleColor[m.role]||'#6b7280', fontWeight:600, border:`1px solid ${roleColor[m.role]||'#6b7280'}30` }}>{m.role}</span>
            <span style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:`${statusColor[m.status]||'#6b7280'}18`, color:statusColor[m.status]||'#6b7280', fontWeight:600 }}>{m.status}</span>
            <button onClick={() => remove(m.id)} style={{ padding:4, background:'none', border:'none', cursor:'pointer', color:'rgba(239,68,68,0.6)', lineHeight:0, flexShrink:0 }}><Trash2 size={13}/></button>
          </div>
        ))}
      </div>
    </div>
  )
}
