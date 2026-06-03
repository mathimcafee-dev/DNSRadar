import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:32, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ maxWidth:440, textAlign:'center' }}>
          <div style={{ width:56, height:56, background:'#fff5f5', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', border:'1px solid #feb2b2' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'#1a2332', marginBottom:8 }}>Something went wrong</h2>
          <p style={{ fontSize:13, color:'#4a5568', lineHeight:1.7, marginBottom:24 }}>
            An unexpected error occurred on this page. Your data is safe — this is a display issue only.
          </p>
          {this.state.error?.message && (
            <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 14px', marginBottom:20, textAlign:'left' }}>
              <div style={{ fontSize:10, color:'#8896a7', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Error details</div>
              <div style={{ fontSize:11, fontFamily:'monospace', color:'#e53e3e', wordBreak:'break-all' }}>{this.state.error.message}</div>
            </div>
          )}
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <button onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding:'8px 20px', background:'#0073d1', color:'#ffffff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Try again
            </button>
            <button onClick={() => window.location.reload()}
              style={{ padding:'8px 20px', background:'#ffffff', color:'#4a5568', border:'1px solid #c8d6e5', borderRadius:8, fontSize:13, cursor:'pointer' }}>
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
