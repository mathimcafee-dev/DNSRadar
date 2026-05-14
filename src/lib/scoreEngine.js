// Health score weights
export const WEIGHTS = {
  dns: 25,
  email: 30,
  ssl: 20,
  propagation: 10,
  security: 10,
  blacklist: 5,
}

export function getScoreColor(score) {
  if (score >= 90) return '#16a34a'
  if (score >= 70) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

export function getScoreBg(score) {
  if (score >= 70) return '#f0fdf4'
  if (score >= 50) return '#fffbeb'
  return '#FCEBEB'
}

export function getScoreLabel(score) {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Needs attention'
  return 'Critical'
}

export function getPillClass(status) {
  if (!status) return 'pill-gray'
  const s = status.toLowerCase()
  if (s === 'pass' || s === 'valid' || s === 'signed' || s === 'active' || s === 'enforced' || s === 'clean' || s === 'blocked' || s === 'configured' || s === 'present') return 'pill-pass'
  if (s === 'warn' || s === 'warning' || s === 'expiring' || s === 'partial') return 'pill-warn'
  if (s === 'fail' || s === 'invalid' || s === 'missing' || s === 'none' || s === 'error' || s === 'listed') return 'pill-fail'
  if (s === 'info' || s === 'detected') return 'pill-info'
  return 'pill-gray'
}

export function getSeverityClass(severity) {
  if (!severity) return 'pill-gray'
  if (severity === 'critical') return 'pill-fail'
  if (severity === 'warn') return 'pill-warn'
  if (severity === 'info') return 'pill-info'
  return 'pill-gray'
}

export function formatTTL(ttl) {
  if (!ttl) return ''
  if (ttl < 60) return `${ttl}s`
  if (ttl < 3600) return `${Math.floor(ttl / 60)}m`
  if (ttl < 86400) return `${Math.floor(ttl / 3600)}h`
  return `${Math.floor(ttl / 86400)}d`
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function getDaysUntilExpiry(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000)
}

export function expiryPill(days) {
  if (days === null) return { label: 'Unknown', cls: 'pill-gray' }
  if (days < 0) return { label: 'Expired', cls: 'pill-fail' }
  if (days <= 14) return { label: `${days}d — Urgent`, cls: 'pill-fail' }
  if (days <= 30) return { label: `${days}d — Renew soon`, cls: 'pill-warn' }
  return { label: `${days} days`, cls: 'pill-pass' }
}
