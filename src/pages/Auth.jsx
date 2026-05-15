import { useState } from 'react'
import { Radar, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const F = "'Inter',system-ui,sans-serif"
const pwStrength = pw => pw.length === 0 ? null : pw.length < 6 ? 'weak' : pw.length < 10 ? 'medium' : 'strong'
const pwColor = s => s === 'weak' ? '#dc2626' : s === 'medium' ? '#d97706' : '#16a34a'

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
    // Generate unique RUA token for DMARC inbound email
    if (signUpData?.user?.id) {
      const ruaToken = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        email,
        rua_token: ruaToken,
        alert_email: true,
      }, { onConflict: 'id' })
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

  const inp = {
    width:'100%', padding:'11px 12px 11px 38px',
    background:'#fff', border:'1px solid #e5e7eb',
    borderRadius:9, fontSize:14, fontFamily:F,
    color:'#111827', outline:'none',
    transition:'border-color 0.15s, box-shadow 0.15s',
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f7f8fa', fontFamily:F, padding:24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .auth-input:focus { border-color:#16a34a !important; box-shadow:0 0 0 3px rgba(22,163,74,0.08) !important; }
        .auth-tab-active { background:#fff !important; color:#111827 !important; box-shadow:0 1px 3px rgba(0,0,0,0.1) !important; }
      `}</style>

      <div style={{ width:'100%', maxWidth:420 }}>

        {/* Back */}
        <button onClick={() => setPage('landing')}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#6b7280', marginBottom:24, fontFamily:F, padding:0 }}
          onMouseEnter={e => e.currentTarget.style.color='#111827'}
          onMouseLeave={e => e.currentTarget.style.color='#6b7280'}>
          <ArrowLeft size={14}/> Back
        </button>

        {/* Card */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:'36px 32px', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{ width:48, height:48, background:'#16a34a', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Radar size={24} color="#fff" strokeWidth={2}/>
            </div>
            <h1 style={{ fontSize:20, fontWeight:700, color:'#111827', margin:0, letterSpacing:'-0.02em' }}>
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
            </h1>
            <p style={{ fontSize:13, color:'#6b7280', margin:'6px 0 0' }}>
              {mode === 'signin' ? 'Welcome back to DomainRadar.' : mode === 'signup' ? 'Free during beta — no credit card.' : 'Enter your email to get a reset link.'}
            </p>
          </div>

          {/* Tab toggle */}
          {mode !== 'forgot' && (
            <div style={{ display:'flex', background:'#f3f4f6', borderRadius:9, padding:3, marginBottom:24, gap:3 }}>
              {[['signin','Sign in'],['signup','Create account']].map(([m, label]) => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  className={mode === m ? 'auth-tab-active' : ''}
                  style={{ flex:1, padding:'8px 0', borderRadius:7, border:'none', cursor:'pointer', fontSize:13, fontWeight:500, background:'transparent', color:mode===m?'#111827':'#6b7280', fontFamily:F, transition:'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {success && (
            <div style={{ display:'flex', gap:8, padding:'10px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, fontSize:13, color:'#15803d', marginBottom:16 }}>
              <CheckCircle size={15} style={{ flexShrink:0, marginTop:1 }}/> {success}
            </div>
          )}
          {error && (
            <div style={{ padding:'10px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, fontSize:13, color:'#dc2626', marginBottom:16 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Email */}
            <div>
              <label style={{ fontSize:13, fontWeight:500, color:'#374151', display:'block', marginBottom:6 }}>Email address</label>
              <div style={{ position:'relative' }}>
                <Mail size={15} color="#9ca3af" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type="email" className="auth-input" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && (mode==='signin'?handleSignIn():mode==='signup'?handleSignUp():handleForgot())}
                  style={{ ...inp }} autoFocus/>
              </div>
            </div>

            {/* Password */}
            {mode !== 'forgot' && (
              <div>
                <label style={{ fontSize:13, fontWeight:500, color:'#374151', display:'block', marginBottom:6 }}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={15} color="#9ca3af" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                  <input type={showPw?'text':'password'} className="auth-input"
                    placeholder={mode==='signup'?'Min. 8 characters':'Your password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && (mode==='signin'?handleSignIn():handleSignUp())}
                    style={{ ...inp, paddingRight:38 }}/>
                  <button onClick={() => setShowPw(s=>!s)}
                    style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:0, lineHeight:0 }}>
                    {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {mode==='signup' && password.length > 0 && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                      {['weak','medium','strong'].map((l,i) => (
                        <div key={l} style={{ flex:1, height:3, borderRadius:2, background: i <= ['weak','medium','strong'].indexOf(strength) ? pwColor(strength) : '#e5e7eb', transition:'background 0.2s' }}/>
                      ))}
                    </div>
                    <div style={{ fontSize:12, color:pwColor(strength), fontWeight:500 }}>{strength.charAt(0).toUpperCase()+strength.slice(1)} password</div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm password */}
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize:13, fontWeight:500, color:'#374151', display:'block', marginBottom:6 }}>Confirm password</label>
                <div style={{ position:'relative' }}>
                  <Lock size={15} color="#9ca3af" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                  <input type={showPw?'text':'password'} className="auth-input" placeholder="Re-enter password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && handleSignUp()}
                    style={{ ...inp, borderColor: confirmPassword && confirmPassword!==password ? '#dc2626' : confirmPassword && confirmPassword===password ? '#16a34a' : '#e5e7eb' }}/>
                  {confirmPassword && confirmPassword===password && (
                    <CheckCircle size={15} color="#16a34a" style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)' }}/>
                  )}
                </div>
              </div>
            )}

            {/* Forgot link */}
            {mode === 'signin' && (
              <div style={{ textAlign:'right', marginTop:-8 }}>
                <button onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#16a34a', fontFamily:F }}>
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button onClick={mode==='signin'?handleSignIn:mode==='signup'?handleSignUp:handleForgot}
              disabled={loading}
              style={{ width:'100%', padding:'12px', background:loading?'#4ade80':'#16a34a', color:'#fff', border:'none', borderRadius:9, fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', fontFamily:F, display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background 0.15s', marginTop:4 }}>
              {loading ? (
                <><div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Please wait…</>
              ) : mode==='signin' ? 'Sign in' : mode==='signup' ? 'Create account' : 'Send reset link'}
            </button>

            {mode==='forgot' && (
              <button onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#6b7280', textAlign:'center', fontFamily:F }}>
                ← Back to sign in
              </button>
            )}
          </div>

          <p style={{ fontSize:12, color:'#9ca3af', textAlign:'center', marginTop:24 }}>
            Free during beta · No credit card required
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
