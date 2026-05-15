import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

function intervalToMs(interval: string) {
  if (interval === '1h') return 3600000
  if (interval === '6h') return 21600000
  if (interval === '24h') return 86400000
  return null
}

function diffDnsRecords(prev: any[], curr: any[]) {
  const changes: any[] = []
  const prevMap = new Map(prev?.map((r: any) => [`${r.type}:${r.value}`, r]) || [])
  const currMap = new Map(curr?.map((r: any) => [`${r.type}:${r.value}`, r]) || [])

  for (const [key, rec] of currMap) {
    if (!prevMap.has(key)) changes.push({ type: 'added', category: rec.type, after_val: rec.value, severity: ['MX', 'NS', 'A'].includes(rec.type) ? 'critical' : 'warn', message: `New ${rec.type} record added: ${rec.value}` })
  }
  for (const [key, rec] of prevMap) {
    if (!currMap.has(key)) changes.push({ type: 'removed', category: rec.type, before_val: rec.value, severity: ['MX', 'NS', 'A'].includes(rec.type) ? 'critical' : 'warn', message: `${rec.type} record removed: ${rec.value}` })
  }
  return changes
}

function diffEmailAuth(prev: any, curr: any) {
  const changes: any[] = []
  if (!prev || !curr) return changes

  // DMARC policy change
  if (prev.dmarc_policy && curr.dmarc_policy && prev.dmarc_policy !== curr.dmarc_policy) {
    const downgrade = (prev.dmarc_policy === 'reject' && curr.dmarc_policy !== 'reject') || (prev.dmarc_policy === 'quarantine' && curr.dmarc_policy === 'none')
    changes.push({
      category: 'DMARC', before_val: `p=${prev.dmarc_policy}`, after_val: `p=${curr.dmarc_policy}`,
      severity: downgrade ? 'critical' : 'warn',
      message: downgrade ? `DMARC policy weakened from p=${prev.dmarc_policy} to p=${curr.dmarc_policy}. Your domain is now less protected.` : `DMARC policy changed to p=${curr.dmarc_policy}`,
    })
  }

  // SPF change
  if (prev.spf_raw && curr.spf_raw && prev.spf_raw !== curr.spf_raw) {
    changes.push({ category: 'SPF', before_val: prev.spf_raw, after_val: curr.spf_raw, severity: 'warn', message: 'SPF record changed.' })
  }

  return changes
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const now = new Date().toISOString()

    // Get domains due for scanning
    const { data: domains } = await supabase.from('domains')
      .select('*, profiles(alert_email, alert_webhook)')
      .eq('verified', true).eq('paused', false)
      .not('monitor_interval', 'eq', 'off')
      .or(`next_scan_at.is.null,next_scan_at.lte.${now}`)
      .limit(100)

    if (!domains?.length) return new Response(JSON.stringify({ scanned: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    let scanned = 0
    let alertsSent = 0

    for (const domain of domains) {
      try {
        // Fetch previous scan
        const { data: prevScan } = await supabase.from('scan_results')
          .select('*').eq('domain_id', domain.id)
          .order('scanned_at', { ascending: false }).limit(1).single()

        // Run new scan
        const scanRes = await supabase.functions.invoke('dns-scan', {
          body: { domain: domain.domain_name, scan_type: 'website', save_to_db: true, domain_id: domain.id }
        })

        if (scanRes.error) continue
        const curr = scanRes.data

        // Calculate next scan time
        const ms = intervalToMs(domain.monitor_interval)
        const nextScan = ms ? new Date(Date.now() + ms).toISOString() : null
        await supabase.from('domains').update({ next_scan_at: nextScan }).eq('id', domain.id)

        scanned++

        // Diff engine — detect changes
        const dnsChanges = prevScan ? diffDnsRecords(prevScan.dns_records, curr.dns_records) : []
        const emailChanges = prevScan ? diffEmailAuth(prevScan.email_auth, curr.email_auth) : []
        const allChanges = [...dnsChanges, ...emailChanges]

        // SSL expiry alerts
        const sslCerts = curr.ssl_info?.certs || []
        for (const cert of sslCerts) {
          if (cert.expires_at) {
            const days = Math.ceil((new Date(cert.expires_at).getTime() - Date.now()) / 86400000)
            if (days <= 30 && days > 0) {
              allChanges.push({ category: 'SSL', severity: days <= 14 ? 'critical' : 'warn', message: `SSL certificate for ${cert.domain} expires in ${days} days`, before_val: null, after_val: `${days} days remaining` })
            }
          }
        }

        if (allChanges.length > 0) {
          // Insert alerts
          const alertRows = allChanges.map(c => ({
            domain_id: domain.id, user_id: domain.user_id,
            alert_type: c.type || 'change', severity: c.severity,
            category: c.category, before_val: c.before_val, after_val: c.after_val,
            message: c.message,
          }))
          await supabase.from('alerts').insert(alertRows)

          // Send alert email
          await supabase.functions.invoke('alert-send', {
            body: { user_id: domain.user_id, domain_name: domain.domain_name, alerts: allChanges, profile: domain.profiles }
          })
          alertsSent++
        }
      } catch (e) {
        console.error(`Error scanning ${domain.domain_name}:`, e.message)
      }
    }

    return new Response(JSON.stringify({ scanned, alertsSent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
