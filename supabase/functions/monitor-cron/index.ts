import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

function intervalToMs(interval: string) {
  if (interval === '1h')  return 3600000
  if (interval === '6h')  return 21600000
  if (interval === '12h') return 43200000
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
  if (prev.dmarc_policy && curr.dmarc_policy && prev.dmarc_policy !== curr.dmarc_policy) {
    const downgrade = (prev.dmarc_policy === 'reject' && curr.dmarc_policy !== 'reject') || (prev.dmarc_policy === 'quarantine' && curr.dmarc_policy === 'none')
    changes.push({ category: 'DMARC', before_val: `p=${prev.dmarc_policy}`, after_val: `p=${curr.dmarc_policy}`, severity: downgrade ? 'critical' : 'warn', message: downgrade ? `DMARC policy weakened from p=${prev.dmarc_policy} to p=${curr.dmarc_policy}` : `DMARC policy changed to p=${curr.dmarc_policy}` })
  }
  if (prev.spf_raw && curr.spf_raw && prev.spf_raw !== curr.spf_raw) {
    changes.push({ category: 'SPF', before_val: prev.spf_raw, after_val: curr.spf_raw, severity: 'warn', message: 'SPF record changed.' })
  }
  return changes
}

// FIX: scan one domain with timeout isolation — never blocks the rest
async function scanDomain(domain: any, supabase: any): Promise<{ changes: any[], scanned: boolean }> {
  try {
    // Fetch previous scan
    const { data: prevScan } = await supabase.from('scan_results')
      .select('dns_records, email_auth, ssl_info')
      .eq('domain_id', domain.id)
      .order('scanned_at', { ascending: false })
      .limit(1).single()

    // Run scan with 45s timeout
    const scanRes = await Promise.race([
      supabase.functions.invoke('dns-scan', {
        body: { domain: domain.domain_name, scan_type: 'website', save_to_db: true, domain_id: domain.id }
      }),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('scan timeout')), 45000))
    ])

    if (scanRes.error) throw new Error(scanRes.error.message)
    const curr = scanRes.data

    // Set next scan
    const ms = intervalToMs(domain.monitor_interval)
    const nextScan = ms ? new Date(Date.now() + ms).toISOString() : null
    await supabase.from('domains').update({ next_scan_at: nextScan }).eq('id', domain.id)

    // Diff for changes
    const dnsChanges   = prevScan ? diffDnsRecords(prevScan.dns_records, curr.dns_records) : []
    const emailChanges = prevScan ? diffEmailAuth(prevScan.email_auth, curr.email_auth) : []
    const allChanges   = [...dnsChanges, ...emailChanges]

    // SSL expiry alerts
    for (const cert of (curr.ssl_info?.certs || [])) {
      if (cert.expires_at) {
        const days = Math.ceil((new Date(cert.expires_at).getTime() - Date.now()) / 86400000)
        if (days <= 30 && days > 0) {
          allChanges.push({ category: 'SSL', severity: days <= 7 ? 'critical' : 'warn', message: `SSL certificate expires in ${days} days`, after_val: `${days} days remaining` })
        }
      }
    }

    return { changes: allChanges, scanned: true }
  } catch (e) {
    console.error(`Scan failed for ${domain.domain_name}: ${(e as any).message}`)
    return { changes: [], scanned: false }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const now = new Date().toISOString()

    const { data: domains } = await supabase.from('domains')
      .select('*, profiles(alert_email, alert_webhook, email)')
      .eq('verified', true).eq('paused', false)
      .not('monitor_interval', 'eq', 'off')
      .or(`next_scan_at.is.null,next_scan_at.lte.${now}`)
      .limit(50) // FIX: reduced from 100 — more reliable within cron window

    if (!domains?.length) return new Response(JSON.stringify({ scanned: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // FIX: scan in parallel batches of 5 — not sequentially
    const BATCH = 5
    let scanned = 0, alertsSent = 0

    for (let i = 0; i < domains.length; i += BATCH) {
      const batch = domains.slice(i, i + BATCH)
      const results = await Promise.allSettled(batch.map(d => scanDomain(d, supabase)))

      for (let j = 0; j < batch.length; j++) {
        const domain = batch[j]
        const result = results[j]
        if (result.status !== 'fulfilled' || !result.value.scanned) continue
        scanned++
        const allChanges = result.value.changes
        if (!allChanges.length) continue

        // Insert alerts
        await supabase.from('alerts').insert(
          allChanges.map(c => ({
            domain_id: domain.id, user_id: domain.user_id,
            alert_type: c.type || 'change', severity: c.severity,
            category: c.category, before_val: c.before_val, after_val: c.after_val,
            message: c.message,
          }))
        )

        // Send alert email only if alerts are enabled
        if (domain.profiles?.alert_email && domain.profiles?.email) {
          await supabase.functions.invoke('alert-send', {
            body: { user_id: domain.user_id, domain_name: domain.domain_name, alerts: allChanges, profile: domain.profiles }
          }).catch(() => {})
          alertsSent++
        }
      }
    }

    return new Response(JSON.stringify({ scanned, alertsSent, total: domains.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as any).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
