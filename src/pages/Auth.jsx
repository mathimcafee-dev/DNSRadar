import { useState } from 'react'
import { Radar, Mail, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Auth({ setPage }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleMagicLink() {
    setError('')
    if (!email || !email.includes('@')) { setError('Please enter a valid email address'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://dnsradar.easysecurity.in/?page=dashboard' }
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage('landing')} style={{ marginBottom: 24 }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 16, padding: 32, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: 'var(--green)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Radar size={24} color="#fff" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
              {sent ? 'Check your email' : 'Welcome to DomainRadar'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {sent
                ? `We sent a magic link to ${email}`
                : 'Sign in or create a free account — no password needed.'}
            </p>
          </div>

          {!sent ? (
            <>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-700)', display: 'block', marginBottom: 6 }}>
                Email address
              </label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                style={{ marginBottom: 12 }} autoFocus />
              {error && (
                <div style={{ padding: '8px 12px', background: 'var(--red-light)', color: 'var(--red-text)', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleMagicLink} disabled={loading}>
                {loading
                  ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Sending…</>
                  : <><Mail size={14} /> Send magic link</>}
              </button>
              <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 14 }}>
                Free during beta · No credit card · No password
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: '#EAF3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Mail size={24} color="var(--green)" />
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: 20 }}>
                Click the link in your email to sign in. The link expires in 1 hour.
              </p>
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setSent(false)}>
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
