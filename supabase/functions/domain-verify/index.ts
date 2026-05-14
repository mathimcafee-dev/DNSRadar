import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const { domain_id } = await req.json()
    if (!domain_id) return new Response(JSON.stringify({ error: 'domain_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: domain } = await supabase.from('domains').select('*').eq('id', domain_id).single()
    if (!domain) return new Response(JSON.stringify({ error: 'Domain not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    if (domain.verified) return new Response(JSON.stringify({ verified: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Query TXT records via Cloudflare DoH
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain.domain_name)}&type=TXT`
    const res = await fetch(url, { headers: { Accept: 'application/dns-json' } })
    const data = await res.json()
    const txtRecords: string[] = (data.Answer || []).map((r: any) => r.data?.replace(/"/g, '').trim())

    const expectedToken = `domainradar-verify=${domain.verify_token}`
    const found = txtRecords.some(r => r === expectedToken)

    if (found) {
      await supabase.from('domains').update({
        verified: true,
        verified_at: new Date().toISOString(),
        next_scan_at: new Date().toISOString(), // trigger immediate scan
      }).eq('id', domain_id)

      // Trigger immediate scan
      supabase.functions.invoke('dns-scan', {
        body: { domain: domain.domain_name, scan_type: 'website', save_to_db: true, domain_id }
      }).catch(console.error)

      return new Response(JSON.stringify({ verified: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Increment attempts
    await supabase.from('domains').update({ next_scan_at: null }).eq('id', domain_id)
    return new Response(JSON.stringify({ verified: false, expected: expectedToken, found_records: txtRecords.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
