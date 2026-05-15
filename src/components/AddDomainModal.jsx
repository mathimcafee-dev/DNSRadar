import { useState } from 'react'
import { X, Copy, Check, Radar, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AddDomainModal({ onClose, onSuccess, user }) {
  const [step, setStep] = useState(1)
  const [domain, setDomain] = useState('')
  const [token, setToken] = useState('')
  const [domainId, setDomainId] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [verifyError, setVerifyError] = useState('')

  function cleanDomain(val) {
    const clean = val.replace(/^https?:\/\//, '').split('/')[0].toLowerCase().trim()
    // Only strip www. prefix, keep other subdomains intact
    return clean.startsWith('www.') ? clean.slice(4) : clean
  }

  async function handleAddDomain() {
    setError('')
    const d = cleanDomain(domain)
    if (!d || !d.includes('.') || d.length < 4) { setError('Please enter a valid domain or subdomain'); return }
    setLoading(true)
    try {
      // Ensure profile exists (handles stale sessions / first-time users)
      await supabase.from('profiles').upsert({ id: user.id, email: user.email }, { onConflict: 'id' })
      const tok = 'dr-verify-' + Math.random().toString(36).slice(2, 18)
      const { data, error: err } = await supabase.from('domains').insert({
        user_id: user.id,
        domain_name: d,
        verify_token: tok,
        verified: false,
        monitor_interval: '6h',
      }).select().single()
      if (err) {
        if (err.code === '23505') setError('This domain is already in your account.')
        else setError(err.message)
        return
      }
      setToken(tok)
      setDomainId(data.id)
      setDomain(d)
      setStep(2)
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    setVerifyError('')
    setVerifying(true)
    try {
      const { data, error: err } = await supabase.functions.invoke('domain-verify', {
        body: { domain_id: domainId }
      })
      if (err) { setVerifyError('Verification service error. Please try again.'); return }
      if (data?.verified) {
        onSuccess()
        onClose()
      } else {
        setVerifyError(`TXT record not found yet. DNS propagation can take up to 24 hours. Attempts: ${data?.attempts || 1}`)
      }
    } catch (e) {
      setVerifyError('Could not reach verification service. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  function copyToken() {
    navigator.clipboard.writeText(`domainradar-verify=${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
        margin: '0 16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }} className="fade-in">
        {/* Header */}
        <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {step === 1 ? 'Add a domain' : 'Verify ownership'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
              Step {step} of 2
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}><X size={16} /></button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? 'var(--green)' : 'var(--gray-200)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {step === 1 ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.6 }}>
                Enter your domain name to begin. We'll generate a unique TXT record for you to add to your DNS — this proves you own the domain.
              </p>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>
                Domain name
              </label>
              <input
                type="text" placeholder="yourdomain.com or mail.yourdomain.com" value={domain}
                onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
                style={{ marginBottom: 8 }}
                autoFocus
              />
              <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 16 }}>
                Enter a domain or subdomain — e.g. example.com, mail.example.com, newsletter.example.com
              </div>
              {error && (
                <div style={{ padding: '8px 12px', background: 'var(--red-light)', color: 'var(--red-text)', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddDomain} disabled={loading || !domain}>
                  {loading ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Adding…</> : 'Continue →'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                background: '#EAF3DE', border: '1px solid var(--green-mid)',
                borderRadius: 10, padding: 14, marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--green-dark)', marginBottom: 8 }}>
                  <Radar size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Verifying: {domain}
                </div>
                <p style={{ fontSize: 12, color: 'var(--green-dark)', lineHeight: 1.6 }}>
                  Add this TXT record to your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.) to prove you own this domain.
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4 }}>Record type</div>
                    <div style={{ padding: '7px 10px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12, fontFamily: 'var(--mono)' }}>TXT</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4 }}>Name / Host</div>
                    <div style={{ padding: '7px 10px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 12, fontFamily: 'var(--mono)' }}>@ (root)</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray-600)', marginBottom: 4 }}>Value</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', background: 'var(--gray-50)',
                    border: '1px solid var(--gray-200)', borderRadius: 6,
                  }}>
                    <span className="mono" style={{ fontSize: 11, flex: 1, wordBreak: 'break-all', color: 'var(--gray-800)' }}>
                      domainradar-verify={token}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={copyToken} style={{ flexShrink: 0, padding: '4px 8px' }}>
                      {copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 12px', background: 'var(--blue-light)', borderRadius: 8, fontSize: 11, color: 'var(--blue-text)', marginBottom: 16, lineHeight: 1.6 }}>
                ℹ After adding the record, click "Verify now". DNS propagation can take a few minutes to several hours. You can close this window and verify later from your dashboard.
              </div>

              {verifyError && (
                <div style={{ padding: '8px 12px', background: 'var(--amber-light)', color: 'var(--amber-text)', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                  {verifyError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={onClose}>Verify later</button>
                <button className="btn btn-primary" onClick={handleVerify} disabled={verifying}>
                  {verifying
                    ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Checking DNS…</>
                    : <><RefreshCw size={13} /> Verify now</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
