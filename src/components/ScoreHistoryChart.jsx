import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { supabase } from '../lib/supabase'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'#4a5568', marginBottom:6, fontSize:11 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background: d?.overall >= 70 ? '#0073d1' : d?.overall >= 50 ? '#f59e0b' : '#ef4444' }}/>
        <span style={{ color:'#1a2332', fontWeight:600 }}>Overall: {d?.overall}</span>
      </div>
      {[['DNS','#3b82f6'],['Email','#ef4444'],['SSL','#0073d1'],['Security','#a78bfa']].map(([k,c]) => (
        <div key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:c }}/>
          <span style={{ color:'#4a5568' }}>{k}: {d?.[k.toLowerCase()]}</span>
        </div>
      ))}
    </div>
  )
}

export default function ScoreHistoryChart({ domainId }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!domainId) return
    async function load() {
      const { data: rows } = await supabase
        .from('scan_results')
        .select('health_score,score_dns,score_email,score_ssl,score_security,scanned_at')
        .eq('domain_id', domainId)
        .order('scanned_at', { ascending: true })
        .limit(30)
      if (rows?.length) {
        setData(rows.map(r => ({
          time: new Date(r.scanned_at).toLocaleDateString('en-GB', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }),
          overall: r.health_score,
          dns: r.score_dns,
          email: r.score_email,
          ssl: r.score_ssl,
          security: r.score_security,
        })))
      }
      setLoading(false)
    }
    load()
  }, [domainId])

  if (loading) return (
    <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'#4a5568', fontSize:12 }}>
      Loading history…
    </div>
  )

  if (data.length < 2) return (
    <div style={{ height:180, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
      <div style={{ fontSize:13, color:'#4a5568' }}>Not enough data yet</div>
      <div style={{ fontSize:11, color:'#4a5568' }}>Run at least 2 scans to see history</div>
    </div>
  )

  const latest = data[data.length - 1]?.overall
  const prev = data[data.length - 2]?.overall
  const delta = latest - prev
  const scoreColor = latest >= 70 ? '#0073d1' : latest >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11, color:'#4a5568', marginBottom:2 }}>Score trend</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontSize:24, fontWeight:700, color:scoreColor }}>{latest}</span>
            {delta !== 0 && (
              <span style={{ fontSize:12, color: delta > 0 ? '#16a34a' : '#e53e3e', fontWeight:500 }}>
                {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} vs prev
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginLeft:'auto', fontSize:10 }}>
          {[['Overall','#0073d1'],['DNS','#3b82f6'],['Email','#ef4444'],['SSL','#a78bfa']].map(([l,c]) => (
            <span key={l} style={{ display:'flex', alignItems:'center', gap:4, color:'#4a5568' }}>
              <span style={{ width:8, height:2, background:c, borderRadius:1, display:'inline-block' }}/>
              {l}
            </span>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <defs>
            {[['overall','#0073d1'],['dns','#3b82f6'],['email','#ef4444'],['ssl','#a78bfa']].map(([k,c]) => (
              <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={c} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
          <XAxis dataKey="time" tick={{ fill:'#9ca3af', fontSize:9 }} axisLine={false} tickLine={false}/>
          <YAxis domain={[0,100]} tick={{ fill:'#9ca3af', fontSize:9 }} axisLine={false} tickLine={false}/>
          <Tooltip content={<CustomTooltip/>}/>
          <ReferenceLine y={70} stroke="#a8d0f0" strokeDasharray="4 4"/>
          <Area type="monotone" dataKey="overall" stroke="var(--green)" strokeWidth={2} fill="url(#grad-overall)" dot={{ fill:'#0073d1', r:3 }} activeDot={{ r:5 }}/>
          <Area type="monotone" dataKey="dns" stroke="#3b82f6" strokeWidth={1.5} fill="url(#grad-dns)" dot={false}/>
          <Area type="monotone" dataKey="email" stroke="#ef4444" strokeWidth={1.5} fill="url(#grad-email)" dot={false}/>
          <Area type="monotone" dataKey="ssl" stroke="#a78bfa" strokeWidth={1.5} fill="url(#grad-ssl)" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
