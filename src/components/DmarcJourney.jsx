import { CheckCircle, Circle, ArrowRight, Shield, Inbox, Eye, Wand2 } from 'lucide-react'

const STEPS = [
  { key: 'none', label: 'None', icon: Eye, desc: 'Monitoring only. No action on failing emails.', color: '#ef4444', risk: 'No protection' },
  { key: 'quarantine', label: 'Quarantine', icon: Inbox, desc: 'Suspicious emails sent to spam folder.', color: '#f59e0b', risk: 'Partial protection' },
  { key: 'reject', label: 'Reject', icon: Shield, desc: 'Unauthorized emails blocked completely.', color: '#10b981', risk: 'Full protection' },
]

export default function DmarcJourney({ currentPolicy, onGenerate }) {
  const policy = (currentPolicy || 'none').toLowerCase()
  const currentIdx = STEPS.findIndex(s => s.key === policy)
  const current = STEPS[currentIdx] || STEPS[0]
  const next = STEPS[currentIdx + 1]

  return (
    <div>
      {/* Steps */}
      <div style={{ display:'flex', alignItems:'center', padding:'16px 20px 12px', gap:0 }}>
        {STEPS.map((step, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          const future = i > currentIdx
          return (
            <div key={step.key} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ textAlign:'center', minWidth:80 }}>
                <div style={{
                  width:40, height:40, borderRadius:'50%', margin:'0 auto 8px',
                  background: done ? 'rgba(16,185,129,0.15)' : active ? `rgba(${step.color === '#ef4444' ? '239,68,68' : step.color === '#f59e0b' ? '245,158,11' : '16,185,129'},0.15)` : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${done ? '#10b981' : active ? step.color : 'rgba(255,255,255,0.1)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  position:'relative',
                }}>
                  {done
                    ? <CheckCircle size={18} color="#10b981"/>
                    : <step.icon size={18} color={active ? step.color : 'rgba(255,255,255,0.25)'}/>
                  }
                  {active && (
                    <div style={{ position:'absolute', top:-3, right:-3, width:10, height:10, borderRadius:'50%', background:step.color, border:'2px solid #0d1117' }}/>
                  )}
                </div>
                <div style={{ fontSize:12, fontWeight:active ? 600 : 400, color: active ? step.color : done ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
                  {step.label}
                </div>
                <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{step.risk}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex:1, height:2, background: i < currentIdx ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)', margin:'0 8px', marginBottom:28 }}/>
              )}
            </div>
          )
        })}
      </div>

      {/* Status banner */}
      <div style={{ margin:'0 16px 14px', padding:'10px 14px', background:`rgba(${current.color === '#ef4444' ? '239,68,68' : current.color === '#f59e0b' ? '245,158,11' : '16,185,129'},0.08)`, border:`1px solid rgba(${current.color === '#ef4444' ? '239,68,68' : current.color === '#f59e0b' ? '245,158,11' : '16,185,129'},0.2)`, borderRadius:8 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:current.color, marginBottom:3 }}>
              Current: p={current.key} — {current.risk}
            </div>
            <div style={{ fontSize:11, color:'#6b7280' }}>{current.desc}</div>
            {next && (
              <div style={{ fontSize:11, color:'#6b7280', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                <ArrowRight size={10}/>
                Next: upgrade to <strong style={{ color:next.color }}>p={next.key}</strong> for {next.risk.toLowerCase()}
              </div>
            )}
          </div>
          {next && (
            <button onClick={() => onGenerate && onGenerate(next.key)}
              style={{ padding:'7px 14px', background:'rgba(16,185,129,0.15)', color:'#15803d', border:'1px solid rgba(16,185,129,0.3)', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap', flexShrink:0 }}>
              <Wand2 size={12}/> Generate p={next.key}
            </button>
          )}
          {!next && (
            <div style={{ fontSize:12, color:'#15803d', display:'flex', alignItems:'center', gap:5, fontWeight:500 }}>
              <CheckCircle size={14}/> Fully enforced
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
