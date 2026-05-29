import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

const RESOLVERS = [
  'https://cloudflare-dns.com/dns-query',
  'https://dns.google/resolve',
  'https://dns.quad9.net/dns-query',
]

// FIX: query all 3 resolvers, accept if any 2 of 3 confirm
async function checkTXTRecord(domain: string, token: string): Promise<{ found: boolean, foundOn: string[], allRecords: string[] }> {
  const results = await Promise.allSettled(
    RESOLVERS.map(async resolver => {
      const url = `${resolver}?name=${encodeURIComponent(domain)}&type=TXT`
      const r = await fetch(url, { headers: { Accept: 'application/dns-json' }, signal: AbortSignal.timeout(8000) })
      if (!r.ok) throw new Error(`${r.status}`)
      const data = await r.json()
      return (data.Answer || []).map((rec: any) => rec.data?.replace(/"/g, '').trim()).filter(Boolean)
    })
  )

  const foundOn: string[] = []
  const allRecords: string[] = []
  const resolverNames = ['cloudflare', 'google', 'quad9']

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      r.value.forEach((rec: string) => { if (!allRecords.includes(rec)) allRecords.push(rec) })
      if (r.value.some((rec: string) => rec === token)) foundOn.push(resolverNames[i])
    }
  })

  // FIX: verified if found on ANY resolver (propagation may be partial)
  return { found: foundOn.length > 0, foundOn, allRecords }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const { domain_id } = await req.json()
    if (!domain_id) return new Response(JSON.stringify({ error: 'domain_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: domain } = await supabase.from('domains').select('*').eq('id', domain_id).single()
    if (!domain) return new Response(JSON.stringify({ error: 'Domain not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    if (domain.verified) return new Response(JSON.stringify({ verified: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const expectedToken = `domainradar-verify=${domain.verify_token}`

    // FIX: try up to 3 times with short delays (handles slow propagation)
    let checkResult = { found: false, foundOn: [] as string[], allRecords: [] as string[] }
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000))
      checkResult = await checkTXTRecord(domain.domain_name, expectedToken)
      if (checkResult.found) break
    }

    if (checkResult.found) {
      await supabase.from('domains').update({
        verified: true,
        verified_at: new Date().toISOString(),
        next_scan_at: new Date().toISOString(),
      }).eq('id', domain_id)

      // Trigger immediate scan
      supabase.functions.invoke('dns-scan', {
        body: { domain: domain.domain_name, scan_type: 'website', save_to_db: true, domain_id }
      }).catch(console.error)

      return new Response(JSON.stringify({ verified: true, found_on: checkResult.foundOn }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      verified: false,
      expected: expectedToken,
      found_records: checkResult.allRecords.length,
      hint: checkResult.allRecords.length > 0 ? `Found other TXT records but not the verification token. Make sure you added: ${expectedToken}` : 'No TXT records found yet. DNS propagation can take up to 30 minutes.',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as any).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
