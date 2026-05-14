import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'alerts@domainradar.io'
  const APP_URL = Deno.env.get('APP_URL') || 'https://domainradar.vercel.app'

  try {
    const { user_id, domain_name, alerts, profile } = await req.json()
    if (!alerts?.length || !profile) return new Response(JSON.stringify({ sent: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: userProfile } = profile?.email ? { data: profile } : await supabase.from('profiles').select('*').eq('id', user_id).single()
    if (!userProfile?.email || !userProfile?.alert_email) return new Response(JSON.stringify({ sent: false, reason: 'alerts disabled' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const critical = alerts.filter((a: any) => a.severity === 'critical')
    const subjectSeverity = critical.length > 0 ? '🔴 Critical' : '⚠️ Warning'

    const alertRows = alerts.map((a: any) => {
      const bg = a.severity === 'critical' ? '#FCEBEB' : a.severity === 'warn' ? '#FAEEDA' : '#E6F1FB'
      const color = a.severity === 'critical' ? '#791F1F' : a.severity === 'warn' ? '#633806' : '#0C447C'
      return `
        <div style="padding:12px 16px;border-bottom:1px solid #f1f3f5;display:flex;gap:10px;align-items:flex-start">
          <span style="background:${bg};color:${color};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:500;flex-shrink:0;margin-top:2px">${a.severity}</span>
          <div>
            <div style="font-size:13px;color:#343a40;margin-bottom:3px">${a.message}</div>
            ${a.before_val || a.after_val ? `<div style="font-size:11px">
              ${a.before_val ? `<span style="background:#FCEBEB;padding:1px 6px;border-radius:4px;margin-right:6px;font-family:monospace">− ${a.before_val}</span>` : ''}
              ${a.after_val ? `<span style="background:#EAF3DE;padding:1px 6px;border-radius:4px;font-family:monospace">+ ${a.after_val}</span>` : ''}
            </div>` : ''}
          </div>
        </div>`
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#F8F9FA;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E9ECEF">
    <div style="background:#0F6E56;padding:16px 20px;display:flex;justify-content:space-between;align-items:center">
      <div style="color:#fff;font-size:16px;font-weight:700">⬡ DomainRadar</div>
      <div style="color:rgba(255,255,255,0.7);font-size:11px">DNS Alert</div>
    </div>
    <div style="padding:18px 20px;border-bottom:1px solid #E9ECEF">
      <div style="font-size:15px;font-weight:600;color:#343a40;margin-bottom:4px">${alerts.length} alert${alerts.length !== 1 ? 's' : ''} for ${domain_name}</div>
      <div style="font-size:12px;color:#6c757d">${new Date().toLocaleString('en-GB')}</div>
    </div>
    <div>${alertRows}</div>
    <div style="padding:18px 20px;text-align:center">
      <a href="${APP_URL}?page=dashboard" style="display:inline-block;padding:10px 24px;background:#0F6E56;color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">View in dashboard →</a>
    </div>
    <div style="padding:12px 20px;background:#F8F9FA;border-top:1px solid #E9ECEF;text-align:center;font-size:11px;color:#adb5bd">
      DomainRadar · <a href="${APP_URL}?page=settings" style="color:#6c757d;text-decoration:none">Manage alert preferences</a>
    </div>
  </div>
</body>
</html>`

    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `DomainRadar Alerts <${FROM_EMAIL}>`,
          to: [userProfile.email],
          subject: `${subjectSeverity}: ${alerts.length} DNS change${alerts.length !== 1 ? 's' : ''} detected on ${domain_name}`,
          html,
        }),
      })
    }

    // Webhook
    if (userProfile.alert_webhook) {
      await fetch(userProfile.alert_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain_name, alerts, timestamp: new Date().toISOString(), source: 'DomainRadar' }),
      }).catch(() => {})
    }

    return new Response(JSON.stringify({ sent: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
