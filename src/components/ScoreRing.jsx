import { getScoreColor, getScoreBg, getScoreLabel } from '../lib/scoreEngine'

export default function ScoreRing({ score, size = 80, strokeWidth = 6 }) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(Math.max(score || 0, 0), 100)
  const offset = circumference - (pct / 100) * circumference
  const color = getScoreColor(score)
  const bg = getScoreBg(score)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill={bg} stroke="#E9ECEF" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.26, fontWeight: 600, color, lineHeight: 1 }}>
          {score ?? '–'}
        </span>
        <span style={{ fontSize: size * 0.12, color, fontWeight: 500, marginTop: 2 }}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  )
}
