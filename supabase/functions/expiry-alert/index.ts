import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'alerts@dnsradar.easysecurity.in'
  const APP_URL = Deno.env.get('APP_URL') || 'https://dns-radar.vercel.app'
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const now = new Date()
    const THRESHOLDS = [30, 7, 1]
    let sent = 0, checked = 0

    const { data: certs } = await supabase
      .from('ssl_certificates')
      .select('*, domains(id, domain_name, user_id, paused)')
      .gt('expires_at', now.toISOString())
      .order('expires_at', { ascending: true })

    if (!certs?.length) return new Response(JSON.stringify({ checked: 0, sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const byUser: Record<string, any[]> = {}
    for (const cert of certs) {
      const userId = cert.domains?.user_id
      if (!userId || cert.domains?.paused) continue
      const daysLeft = Math.ceil((new Date(cert.expires_at).getTime() - now.getTime()) / 86400000)
      if (!THRESHOLDS.includes(daysLeft)) continue
      if (!byUser[userId]) byUser[userId] = []
      byUser[userId].push({ ...cert, daysLeft })
    }

    for (const [userId, expiring] of Object.entries(byUser)) {
      checked++
      try {
        const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single()
        if (!profile?.email) continue

        const today = now.toISOString().slice(0, 10)
        for (const cert of expiring) {
          const alertKey = `ssl_expiry_${cert.id}_${cert.daysLeft}d_${today}`
          const { count } = await supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('alert_type', alertKey)
          if (count && count > 0) continue

          const urgency = cert.daysLeft === 1 ? '🔴 URGENT' : cert.daysLeft <= 7 ? '⚠️ Warning' : 'ℹ️ Notice'
          const html = `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;background:#f8f9fa;padding:24px;margin:0">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e9ecef;overflow:hidden">
  <div style="background:${cert.daysLeft===1?'#dc2626':cert.daysLeft<=7?'#d97706':'#1d4ed8'};padding:20px 24px">
    <div style="color:#fff;font-size:18px;font-weight:700">DomainRadar</div>
    <div style="color:rgba(255,255,255,0.8);font-size:12px">SSL Certificate Expiry Alert</div>
  </div>
  <div style="padding:24px">
    <h2 style="font-size:16px;color:#111827;margin:0 0 12px">${cert.domains.domain_name} expires in ${cert.daysLeft} day${cert.daysLeft!==1?'s':''}</h2>
    <p style="font-size:14px;color:#374151;line-height:1.7;margin:0 0 20px">
      Your SSL certificate for <strong>${cert.domains.domain_name}</strong> expires on
      <strong>${new Date(cert.expires_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</strong>.
      ${cert.daysLeft===1?'Renew immediately to prevent HTTPS errors.':'Please renew it soon.'}
    </p>
    <div style="background:#f8f9fa;border-radius:10px;padding:14px;border:1px solid #e9ecef;margin-bottom:20px;font-size:13px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#6b7280">Domain</span><code style="color:#111827">${cert.domains.domain_name}</code></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:#6b7280">Expires</span><span style="color:${cert.daysLeft<=7?'#dc2626':'#374151'};font-weight:600">${new Date(cert.expires_at).toLocaleDateString('en-GB')}</span></div>
      <div style="display:flex;justify-content:space-between"><span style="color:#6b7280">Days left</span><span style="color:${cert.daysLeft===1?'#dc2626':cert.daysLeft<=7?'#d97706':'#374151'};font-weight:700">${cert.daysLeft}</span></div>
    </div>
    <a href="${APP_URL}" style="background:#111827;color:#fff;padding:11px 22px;border-radius:9px;text-decoration:none;font-size:13px;font-weight:600;display:inline-block">View in DomainRadar →</a>
  </div>
  <div style="padding:12px 24px;border-top:1px solid #f0f2f5;font-size:11px;color:#9ca3af;text-align:center">DomainRadar · SSL monitoring</div>
</div></body></html>`

          if (RESEND_KEY) {
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: `DomainRadar <${FROM_EMAIL}>`, to: [profile.email], subject: `${urgency}: SSL for ${cert.domains.domain_name} expires in ${cert.daysLeft} day${cert.daysLeft!==1?'s':''}`, html }),
            })
            if (res.ok) {
              sent++
              await supabase.from('alerts').insert({ user_id: userId, domain_id: cert.domains.id, alert_type: alertKey, severity: cert.daysLeft===1?'critical':cert.daysLeft<=7?'warn':'info', message: `SSL for ${cert.domains.domain_name} expires in ${cert.daysLeft} day${cert.daysLeft!==1?'s':''} (${new Date(cert.expires_at).toLocaleDateString('en-GB')})`, read: false })
            }
          }
        }
      } catch (e) { console.error('Expiry alert error:', e.message) }
    }

    return new Response(JSON.stringify({ checked, sent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
