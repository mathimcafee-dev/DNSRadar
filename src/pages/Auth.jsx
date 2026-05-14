import { useState } from 'react'
import { Radar, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Auth({ setPage }) {
  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSignIn() {
    setError('')
    if (!email || !password) { setError('Please enter your email and password'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      if (err.message.includes('Invalid login')) setError('Incorrect email or password.')
      else setError(err.message)
      return
    }
    setPage('dashboard')
  }

  async function handleSignUp() {
    setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: 'https://dnsradar.easysecurity.in/?page=dashboard' }
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Account created! You can now sign in below.')
    setMode('signin')
    setPassword('')
  }

  async function handleForgot() {
    setError('')
    if (!email) { setError('Enter your email address first'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://dnsradar.easysecurity.in/?page=reset'
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Password reset email sent. Check your inbox.')
  }

  const pwStrength = password.length === 0 ? null : password.length < 8 ? 'weak' : password.match(/[A-Z]/) && password.match(/[0-9]/) ? 'strong' : 'medium'
  const pwColors = { weak: '#A32D2D', medium: '#854F0B', strong: '#0F6E56' }
  const pwLabels = { weak: 'Weak', medium: 'Good', strong: 'Strong' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f7f8fa', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setPage('landing')} style={{ marginBottom: 24 }}>
          <ArrowLeft size={13} /> Back
        </button>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, background: '#16a34a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Radar size={24} color="#fff" />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              {mode === 'signin' ? 'Sign in to DomainRadar' : mode === 'signup' ? 'Create your account' : 'Reset password'}
            </h1>
            <p style={{ fontSize: 13, color: '#6b7280' }}>
              {mode === 'signin' ? 'Welcome back.' : mode === 'signup' ? 'Free during beta. No credit card.' : 'Enter your email to reset.'}
            </p>
          </div>

          {/* Tab toggle */}
          {mode !== 'forgot' && (
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3, marginBottom: 20 }}>
              {['signin', 'signup'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s', background: mode === m ? '#fff' : 'transparent', color: mode === m ? 'var(--gray-900)' : 'var(--gray-500)', boxShadow: mode === m ? 'var(--shadow-sm)' : 'none' }}>
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d', marginBottom: 16 }}>
              <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{ padding: '10px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : mode === 'signup' ? handleSignUp() : handleForgot())}
                  style={{ paddingLeft: 32 }} autoFocus />
              </div>
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : handleSignUp())}
                    style={{ paddingLeft: 32, paddingRight: 36 }} />
                  <button onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {/* Password strength */}
                {mode === 'signup' && password.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                      {['weak', 'medium', 'strong'].map((level, i) => (
                        <div key={level} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= ['weak','medium','strong'].indexOf(pwStrength) ? pwColors[pwStrength] : 'var(--gray-200)', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: pwColors[pwStrength] }}>{pwLabels[pwStrength]} password</div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm password */}
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 5 }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Re-enter password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                    style={{ paddingLeft: 32, borderColor: confirmPassword && confirmPassword !== password ? '#A32D2D' : confirmPassword && confirmPassword === password ? 'var(--green)' : undefined }} />
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle size={14} color="var(--green)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
              </div>
            )}

            {/* Forgot password link */}
            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: -8 }}>
                <button onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#16a34a' }}>
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              onClick={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleForgot}
              disabled={loading}>
              {loading
                ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> Please wait…</>
                : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset email'}
            </button>

            {/* Back from forgot */}
            {mode === 'forgot' && (
              <button onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
                ← Back to sign in
              </button>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 20 }}>
            Free during beta · No credit card required
          </p>
        </div>
      </div>
    </div>
  )
}
