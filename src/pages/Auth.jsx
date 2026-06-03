import { useState } from 'react'
import { Radar, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const pwStrength = pw => pw.length === 0 ? null : pw.length < 6 ? 'weak' : pw.length < 10 ? 'medium' : 'strong'
const pwColor = s => s === 'weak' ? '#e53e3e' : s === 'medium' ? '#d97706' : '#0073d1'

export default function Auth({ setPage }) {
  const [mode, setMode] = useState('signin')
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
    if (err) { setError(err.message.includes('Invalid login') ? 'Incorrect email or password.' : err.message); return }
    setPage('dashboard')
  }

  async function handleSignUp() {
    setError('')
    if (!email || !password) { setError('Please fill all fields'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    const { data: signUpData, error: err } = await supabase.auth.signUp({ email, password })
    if (err) { setLoading(false); setError(err.message); return }
    if (signUpData?.user?.id) {
      const ruaToken = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
      await supabase.from('profiles').upsert({ id: signUpData.user.id, email, rua_token: ruaToken, alert_email: true }, { onConflict: 'id' })
    }
    setLoading(false)
    setSuccess('Account created! You can now sign in.')
  }

  async function handleForgot() {
    setError('')
    if (!email) { setError('Enter your email address'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess('Password reset email sent — check your inbox.')
  }

  const strength = pwStrength(password)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8', padding: 24 }}>
      <style>{`.auth-input:focus { border-color: var(--green-bdr) !important; box-shadow: 0 0 0 3px rgba(255,107,43,0.08) !important; } .auth-tab-active { background: var(--card-hi) !important; color: var(--t1) !important; }`}</style>

      <div style={{ width: '100%', maxWidth: 420 }}>
        <button onClick={() => setPage('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#4a5568', marginBottom: 24, padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a2332'}
          onMouseLeave={e => e.currentTarget.style.color = '#4a5568'}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '36px 32px', boxShadow: '0 4px 40px rgba(0,0,0,0.4)' }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: '#0073d1', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Radar size={24} color="#021812" strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a2332', margin: 0, letterSpacing: '-0.02em' }}>
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </h1>
            <p style={{ fontSize: 13, color: '#4a5568', margin: '6px 0 0' }}>
              {mode === 'signin' ? 'Welcome back to DomainRadar.' : mode === 'signup' ? 'Free during beta — no credit card.' : 'Enter your email to get a reset link.'}
            </p>
          </div>

          {mode !== 'forgot' && (
            <div style={{ display: 'flex', background: '#f4f6f8', borderRadius: 9, padding: 3, marginBottom: 24, gap: 3 }}>
              {[['signin', 'Sign in'], ['signup', 'Create account']].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  className={mode === m ? 'auth-tab-active' : ''}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: 'transparent', color: mode === m ? '#1a2332' : '#8896a7', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: '#e8f3fc', border: '1px solid var(--green-bdr)', borderRadius: 8, fontSize: 13, color: '#0073d1', marginBottom: 16 }}>
              <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {success}
            </div>
          )}
          {error && (
            <div style={{ padding: '10px 12px', background: '#fff5f5', border: '1px solid var(--red-bdr)', borderRadius: 8, fontSize: 13, color: '#e53e3e', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2332', display: 'block', marginBottom: 6 }}>Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--t3)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input type="email" className="auth-input" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : mode === 'signup' ? handleSignUp() : handleForgot())}
                  style={{ paddingLeft: 36 }} autoFocus />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2332', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--t3)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type={showPw ? 'text' : 'password'} className="auth-input"
                    placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (mode === 'signin' ? handleSignIn() : handleSignUp())}
                    style={{ paddingLeft: 36, paddingRight: 38 }} />
                  <button onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8896a7', padding: 0, lineHeight: 0 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {mode === 'signup' && password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {['weak', 'medium', 'strong'].map((l, i) => (
                        <div key={l} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= ['weak', 'medium', 'strong'].indexOf(strength) ? pwColor(strength) : '#e2e8f0', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: pwColor(strength), fontWeight: 500 }}>{strength.charAt(0).toUpperCase() + strength.slice(1)} password</div>
                  </div>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#1a2332', display: 'block', marginBottom: 6 }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="var(--t3)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input type={showPw ? 'text' : 'password'} className="auth-input" placeholder="Re-enter password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                    style={{ paddingLeft: 36, borderColor: confirmPassword && confirmPassword !== password ? '#feb2b2' : confirmPassword && confirmPassword === password ? '#a8d0f0' : undefined }} />
                  {confirmPassword && confirmPassword === password && (
                    <CheckCircle size={15} color="var(--green)" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
              </div>
            )}

            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: -8 }}>
                <button onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0073d1' }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button onClick={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleForgot}
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: '#0073d1', color: '#f4f6f8', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} /> Please wait…</>
              ) : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </button>

            {mode === 'forgot' && (
              <button onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#4a5568', textAlign: 'center' }}>
                ← Back to sign in
              </button>
            )}
          </div>

          <p style={{ fontSize: 12, color: '#8896a7', textAlign: 'center', marginTop: 24 }}>
            Free during beta · No credit card required
          </p>
        </div>
      </div>
    </div>
  )
}
