import { Check, AlertTriangle, X, Info } from 'lucide-react'
import { getPillClass } from '../lib/scoreEngine'

function StatusIcon({ status }) {
  const s = status?.toLowerCase()
  const isPass = ['pass', 'valid', 'signed', 'active', 'enforced', 'clean', 'blocked', 'configured', 'present', 'detected'].includes(s)
  const isWarn = ['warn', 'warning', 'expiring', 'partial', 'near limit'].includes(s)
  const isFail = ['fail', 'invalid', 'missing', 'none', 'error', 'listed'].includes(s)

  if (isPass) return (
    <div className="check-icon check-icon-pass">
      <Check size={13} strokeWidth={2.5} />
    </div>
  )
  if (isWarn) return (
    <div className="check-icon check-icon-warn">
      <AlertTriangle size={13} strokeWidth={2.5} />
    </div>
  )
  if (isFail) return (
    <div className="check-icon check-icon-fail">
      <X size={13} strokeWidth={2.5} />
    </div>
  )
  return (
    <div className="check-icon check-icon-info">
      <Info size={13} strokeWidth={2.5} />
    </div>
  )
}

export default function CheckRow({ name, status, value, note, fix, suggestion, extra }) {
  return (
    <div className="check-row fade-in">
      <StatusIcon status={status} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-800)' }}>{name}</span>
          {status && <span className={`pill ${getPillClass(status)}`}>{status}</span>}
        </div>
        {value && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--gray-600)', wordBreak: 'break-all', marginBottom: 3 }}>
            {value}
          </div>
        )}
        {note && (
          <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.5 }}>{note}</div>
        )}
        {extra && <div style={{ marginTop: 4 }}>{extra}</div>}
        {fix && (
          <div style={{
            marginTop: 6, padding: '6px 10px', background: '#FAEEDA',
            borderRadius: 6, fontSize: 11, color: 'var(--amber-text)', lineHeight: 1.5,
          }}>
            ⚠ {fix}
          </div>
        )}
        {suggestion && (
          <div style={{
            marginTop: 4, padding: '6px 10px', background: '#EAF3DE',
            borderRadius: 6, fontSize: 11, color: 'var(--green-text)',
            fontFamily: 'var(--mono)', wordBreak: 'break-all',
          }}>
            ✓ Suggested: {suggestion}
          </div>
        )}
      </div>
    </div>
  )
}
