import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

function buildReportHtml(user: any, domains: any[], alerts: any[], avgScore: number, delta: number | null) {
  const scoreColor = avgScore >= 70 ? '#27500A' : avgScore >= 50 ? '#633806' : '#791F1F'
  const scoreBg = avgScore >= 70 ? '#EAF3DE' : avgScore >= 50 ? '#FAEEDA' : '#FCEBEB'
  const critical = alerts.filter(a => a.severity === 'critical')
  const warns = alerts.filter(a => a.severity === 'warn')

  const domainRows = domains.map(d => {
    const score = d.latest_score || d.health_score || 0
    const sc = score >= 70 ? '#27500A' : score >= 50 ? '#633806' : '#791F1F'
    const issues = d.latest_issues?.length || 0
    return `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f3f5;font-family:monospace;font-size:13px;color:#343a40">${d.domain_name}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f3f5;text-align:center">
          <span style="font-size:18px;font-weight:700;color:${sc}">${score}</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f3f5;text-align:center">
          ${issues > 0 ? `<span style="background:#FCEBEB;color:#791F1F;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500">${issues} issues</span>` : `<span style="background:#EAF3DE;color:#27500A;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500">All clear</span>`}
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #f1f3f5;font-size:11px;color:#6c757d">${d.monitor_interval}</td>
      </tr>`
  }).join('')

  const alertRows = alerts.slice(0, 10).map(a => {
    const bg = a.severity === 'critical' ? '#FCEBEB' : a.severity === 'warn' ? '#FAEEDA' : '#E6F1FB'
    const color = a.severity === 'critical' ? '#791F1F' : a.severity === 'warn' ? '#633806' : '#0C447C'
    return `
      <tr>
        <td style="padding:8px 16px;border-bottom:1px solid #f1f3f5">
          <span style="background:${bg};color:${color};padding:2px 7px;border-radius:8px;font-size:10px;font-weight:500">${a.severity}</span>
        </td>
        <td style="padding:8px 16px;border-bottom:1px solid #f1f3f5;font-size:12px;color:#343a40">${a.message || a.alert_type}</td>
        <td style="padding:8px 16px;border-bottom:1px solid #f1f3f5;font-size:11px;font-family:monospace;color:#6c757d">${a.domains?.domain_name || ''}</td>
      </tr>`
  }).join('')

  const appUrl = Deno.env.get('APP_URL') || 'https://dns-radar.vercel.app'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DomainRadar Daily Report</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;background:#F8F9FA;margin:0;padding:24px">
  <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E9ECEF">
    <!-- Header -->
    <div style="background:#0F6E56;padding:20px 24px;display:flex;justify-content:space-between;align-items:center">
      <div style="color:#fff;font-size:18px;font-weight:700">⬡ DomainRadar</div>
      <div style="color:rgba(255,255,255,0.7);font-size:12px">${today}</div>
    </div>
    <!-- Intro -->
    <div style="padding:20px 24px;border-bottom:1px solid #E9ECEF">
      <p style="font-size:14px;color:#495057;margin:0;line-height:1.7">
        Hi — here's your daily DNS health report. You have <strong>${domains.length} monitored domain${domains.length !== 1 ? 's' : ''}</strong>.
        ${critical.length > 0 ? `<span style="color:#791F1F;font-weight:600">${critical.length} critical issue${critical.length !== 1 ? 's' : ''} need your attention.</span>` : alerts.length === 0 ? 'Everything looks healthy today.' : `${warns.length} warning${warns.length !== 1 ? 's' : ''} to review.`}
      </p>
    </div>
    <!-- Score summary -->
    <div style="padding:20px 24px;border-bottom:1px solid #E9ECEF">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <div style="width:72px;height:72px;border-radius:50%;background:${scoreBg};border:3px solid ${scoreColor};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0">
          <div style="font-size:22px;font-weight:700;color:${scoreColor};line-height:1">${avgScore}</div>
          <div style="font-size:9px;color:${scoreColor};font-weight:500">avg score</div>
        </div>
        <div>
          <div style="font-size:13px;color:#6c757d">Fleet average health score</div>
          ${delta !== null ? `<div style="font-size:12px;color:${delta >= 0 ? '#27500A' : '#791F1F'};font-weight:500;margin-top:4px">${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)} points vs yesterday</div>` : ''}
        </div>
      </div>
      <!-- Domain table -->
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#F8F9FA">
            <th style="text-align:left;padding:8px 16px;font-size:11px;color:#6c757d;font-weight:500;border-bottom:1px solid #E9ECEF">Domain</th>
            <th style="text-align:center;padding:8px 16px;font-size:11px;color:#6c757d;font-weight:500;border-bottom:1px solid #E9ECEF">Score</th>
            <th style="text-align:center;padding:8px 16px;font-size:11px;color:#6c757d;font-weight:500;border-bottom:1px solid #E9ECEF">Status</th>
            <th style="text-align:left;padding:8px 16px;font-size:11px;color:#6c757d;font-weight:500;border-bottom:1px solid #E9ECEF">Interval</th>
          </tr>
        </thead>
        <tbody>${domainRows}</tbody>
      </table>
    </div>
    ${alerts.length > 0 ? `
    <!-- Alerts -->
    <div style="padding:20px 24px;border-bottom:1px solid #E9ECEF">
      <div style="font-size:13px;font-weight:600;color:#343a40;margin-bottom:12px">Alerts from the last 24 hours (${alerts.length})</div>
      <table style="width:100%;border-collapse:collapse">
        <tbody>${alertRows}</tbody>
      </table>
    </div>` : ''}
    <!-- CTA -->
    <div style="padding:24px;text-align:center">
      <a href="${appUrl}/dashboard" style="display:inline-block;padding:11px 28px;background:#0F6E56;color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none">View full dashboard →</a>
    </div>
    <!-- Footer -->
    <div style="padding:14px 24px;background:#F8F9FA;border-top:1px solid #E9ECEF;text-align:center;font-size:11px;color:#adb5bd">
      DomainRadar · Built by a Certified PKI Specialist · 
      <a href="${appUrl}/settings" style="color:#0F6E56;text-decoration:none">Manage alerts</a> · 
      <a href="${appUrl}/settings" style="color:#6c757d;text-decoration:none">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const RESEND_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'reports@dnsradar.easysecurity.in'

  try {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const since24h = new Date(Date.now() - 86400000).toISOString()

    // Get all users with verified domains
    const { data: userIds } = await supabase.from('domains')
      .select('user_id').eq('verified', true).eq('paused', false)

    const uniqueUserIds = [...new Set(userIds?.map(u => u.user_id) || [])]
    let sent = 0

    for (const userId of uniqueUserIds) {
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
        if (!profile?.alert_email) continue

        // Get domains with latest scan
        const { data: domains } = await supabase.from('domains')
          .select(`*, scan_results(health_score, score_dns, score_email, issues, scanned_at)`)
          .eq('user_id', userId).eq('verified', true)

        if (!domains?.length) continue

        // Format domains with latest scan
        const domainsWithLatest = domains.map(d => ({
          ...d, latest_score: d.scan_results?.[0]?.health_score, latest_issues: d.scan_results?.[0]?.issues || [],
        }))

        // Compute avg score
        const scores = domainsWithLatest.map(d => d.latest_score || 0).filter(Boolean)
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

        // Get yesterday's report for delta
        const { data: prevReport } = await supabase.from('report_snapshots').select('avg_score').eq('user_id', userId).eq('report_date', yesterday).single()
        const delta = prevReport?.avg_score ? avgScore - prevReport.avg_score : null

        // Get last 24h alerts
        const { data: alerts } = await supabase.from('alerts')
          .select('*, domains(domain_name)').eq('user_id', userId)
          .gte('created_at', since24h).order('created_at', { ascending: false })

        const critical = (alerts || []).filter(a => a.severity === 'critical').length
        const totalIssues = domainsWithLatest.reduce((a, d) => a + (d.latest_issues?.length || 0), 0)

        const html = buildReportHtml(profile, domainsWithLatest, alerts || [], avgScore, delta)

        // Save snapshot
        await supabase.from('report_snapshots').upsert({
          user_id: userId, report_date: today,
          domain_count: domains.length, total_issues: totalIssues,
          critical_count: critical, avg_score: avgScore,
          avg_score_delta: delta, domains_json: domainsWithLatest,
          report_html: html,
        })

        // Send via Resend
        if (RESEND_KEY && profile.email) {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: `DomainRadar <${FROM_EMAIL}>`,
              to: [profile.email],
              subject: `DomainRadar daily report — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · Avg score ${avgScore}${critical > 0 ? ` · ${critical} critical` : ''}`,
              html,
            }),
          })
          if (emailRes.ok) {
            await supabase.from('report_snapshots').update({ sent_at: new Date().toISOString() }).eq('user_id', userId).eq('report_date', today)
            sent++
          }
        }
      } catch (e) { console.error(`Report error for ${userId}:`, e.message) }
    }

    return new Response(JSON.stringify({ processed: uniqueUserIds.length, sent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
