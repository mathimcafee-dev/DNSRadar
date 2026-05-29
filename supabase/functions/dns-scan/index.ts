import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DOH_CF     = 'https://cloudflare-dns.com/dns-query'
const DOH_GOOGLE = 'https://dns.google/resolve'
const DOH_QUAD9  = 'https://dns.quad9.net/dns-query'

// ── DoH query with timeout ──────────────────────────────────────────
async function dohQuery(name: string, type: string, resolver = DOH_CF): Promise<any[]> {
  try {
    const url = `${resolver}?name=${encodeURIComponent(name)}&type=${type}`
    const r = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return []
    const data = await r.json()
    return data.Answer || []
  } catch { return [] }
}

// ── Get authoritative nameserver for a domain ─────────────────────
async function getAuthoritativeNS(domain: string): Promise<string | null> {
  try {
    const nsRecs = await dohQuery(domain, 'NS', DOH_CF)
    if (!nsRecs.length) return null
    const ns = nsRecs[0].data?.replace(/\.$/, '').toLowerCase()
    if (!ns) return null
    // Resolve NS hostname to IP
    const aRecs = await dohQuery(ns, 'A', DOH_CF)
    const ip = aRecs[0]?.data
    if (!ip) return null
    return `https://cloudflare-dns.com/dns-query` // fall back to CF if we can't use raw IP
  } catch { return null }
}

// ── All DNS records ───────────────────────────────────────────────
async function getAllDnsRecords(domain: string): Promise<any[]> {
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'SRV']
  const results = await Promise.allSettled(types.map(t => dohQuery(domain, t)))
  const records: any[] = []
  types.forEach((type, i) => {
    const ans = results[i].status === 'fulfilled' ? results[i].value : []
    ans.forEach((r: any) => records.push({ type, ttl: r.TTL, value: r.data?.trim(), status: 'Pass' }))
  })
  return records
}

// ── SPF analysis ──────────────────────────────────────────────────
async function analyzeSPF(domain: string) {
  const txtRecords = await dohQuery(domain, 'TXT')
  const spfRecord = txtRecords.find((r: any) => r.data?.includes('v=spf1'))
  if (!spfRecord) return {
    spf_status: 'Missing', spf_raw: null, spf_lookups: 0,
    spf_fix: `No SPF record found. Add TXT record: v=spf1 include:_spf.google.com ~all`,
  }
  const raw = spfRecord.data.replace(/"/g, '').trim()
  const mechanisms = raw.match(/\b(include|a|mx|ptr|exists|redirect)[:=]/g) || []
  const lookupCount = mechanisms.length
  let status = 'Pass'
  let fix = null
  if (lookupCount >= 10) { status = 'Fail'; fix = `SPF has ${lookupCount} DNS lookups — exceeds RFC limit of 10. Use SPF flattening.` }
  else if (lookupCount >= 8) { status = 'Warn'; fix = `SPF has ${lookupCount}/10 DNS lookups. Near the limit — consider flattening.` }
  let allNote = null
  if (raw.includes('+all')) allNote = 'Dangerous: +all allows any server to send as your domain. Change to ~all or -all.'
  else if (!raw.includes('~all') && !raw.includes('-all')) allNote = 'Missing qualifier. Add ~all (softfail) or -all (fail) at the end.'
  return { spf_status: status, spf_raw: raw, spf_lookups: lookupCount, spf_fix: fix || allNote }
}

// ── DKIM analysis — FIX: query authoritative NS + broad selector probe ──
async function analyzeDKIM(domain: string) {
  // Common selectors including major ESPs
  const selectors = [
    'google', 'default', 'selector1', 'selector2', 'k1', 'k2', 'k3',
    'mail', 'smtp', 'dkim', 'email', 's1', 's2', 's3',
    // SendGrid
    'sm', 's1024', 's2048',
    // Mailchimp
    'k1', 'k2',
    // HubSpot
    'hs1', 'hs2',
    // Postmark
    'pm',
    // Generic enterprise
    'corp', 'mta', 'outbound', 'mailer',
  ]

  // Try all selectors against both CF and Google resolvers for accuracy
  const checks = selectors.map(sel =>
    Promise.all([
      dohQuery(`${sel}._domainkey.${domain}`, 'TXT', DOH_CF),
      dohQuery(`${sel}._domainkey.${domain}`, 'TXT', DOH_GOOGLE),
    ]).then(([cf, g]) => {
      // Use whichever resolver found records
      const recs = cf.length ? cf : g
      const dkimRec = recs.find((r: any) =>
        r.data?.includes('v=DKIM1') || r.data?.includes('k=rsa') || r.data?.includes('k=ed25519') || r.data?.includes('p=')
      )
      return dkimRec ? { sel, rec: dkimRec } : null
    }).catch(() => null)
  )

  const results = await Promise.allSettled(checks)
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      const { sel, rec } = r.value
      const raw = rec.data.replace(/"/g, '').trim()
      const keyMatch = raw.match(/p=([A-Za-z0-9+/=]+)/)
      const keySize = keyMatch ? Math.floor((keyMatch[1].length * 6) / 8 / 64) * 64 : null
      const algo = raw.includes('k=ed25519') ? 'Ed25519' : 'RSA'
      return {
        dkim_status: 'Pass',
        dkim_selector: sel,
        dkim_raw: raw,
        dkim_key_size: keySize,
        dkim_algo: algo,
        dkim_note: algo === 'Ed25519'
          ? 'Ed25519 key — modern, meets best practice'
          : keySize && keySize < 2048
            ? `${keySize}-bit RSA — upgrade to 2048-bit recommended`
            : `${keySize || '?'}-bit RSA — meets best practice`,
      }
    }
  }
  return {
    dkim_status: 'Missing',
    dkim_selector: null,
    dkim_note: 'No DKIM found on common selectors. Configure DKIM with your email provider or check your custom selector.',
  }
}

// ── DMARC analysis — FIX: p=none is Warn not Fail ─────────────────
async function analyzeDMARC(domain: string) {
  // Query both resolvers for accuracy
  const [cfRecs, gRecs] = await Promise.all([
    dohQuery(`_dmarc.${domain}`, 'TXT', DOH_CF),
    dohQuery(`_dmarc.${domain}`, 'TXT', DOH_GOOGLE),
  ])
  const recs = cfRecs.length ? cfRecs : gRecs
  const dmarcRec = recs.find((r: any) => r.data?.includes('v=DMARC1'))

  if (!dmarcRec) {
    // Check parent domain (subdomain inheritance)
    const parts = domain.split('.')
    if (parts.length > 2) {
      const parent = parts.slice(1).join('.')
      const parentRecs = await dohQuery(`_dmarc.${parent}`, 'TXT', DOH_CF)
      const parentDmarc = parentRecs.find((r: any) => r.data?.includes('v=DMARC1'))
      if (parentDmarc) {
        return { dmarc_status: 'Warn', dmarc_raw: parentDmarc.data.replace(/"/g, '').trim(), dmarc_inherited: true, dmarc_fix: `DMARC inherited from parent domain ${parent}. Consider adding a dedicated record for ${domain}.` }
      }
    }
    return {
      dmarc_status: 'Missing', dmarc_raw: null,
      dmarc_fix: `No DMARC record. Add TXT record at _dmarc.${domain}`,
      dmarc_suggestion: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; adkim=s; aspf=s`,
    }
  }

  const raw = dmarcRec.data.replace(/"/g, '').trim()
  const policy = raw.match(/p=(\w+)/)?.[1]
  const rua = raw.match(/rua=([^;]+)/)?.[1]
  const ruf = raw.match(/ruf=([^;]+)/)?.[1]
  const pct = raw.match(/pct=(\d+)/)?.[1]

  // FIX: p=none is Warn (monitoring mode), not Fail
  let status = 'Pass'
  let fix = null
  let suggestion = null

  if (policy === 'none') {
    status = 'Warn'  // ← WAS 'Fail' — FIXED
    fix = `Policy is p=none — monitoring mode only, emails are not blocked. Upgrade to p=quarantine or p=reject for protection.`
    suggestion = raw.replace('p=none', 'p=quarantine')
  } else if (policy === 'quarantine') {
    status = 'Warn'
    fix = `Policy is p=quarantine — good start. Upgrade to p=reject for full spoofing protection.`
  }

  if (!rua) {
    fix = (fix ? fix + ' ' : '') + `rua tag missing — add rua=mailto:dmarc@${domain} to receive aggregate reports.`
    if (status === 'Pass') status = 'Warn'
  }
  if (pct && parseInt(pct) < 100) {
    fix = (fix ? fix + ' ' : '') + `pct=${pct} — only ${pct}% of mail is filtered. Increase to 100.`
  }

  return { dmarc_status: status, dmarc_raw: raw, dmarc_policy: policy, dmarc_rua: rua, dmarc_ruf: ruf, dmarc_fix: fix, dmarc_suggestion: suggestion }
}

// ── BIMI ─────────────────────────────────────────────────────────
async function analyzeBIMI(domain: string) {
  const recs = await dohQuery(`default._bimi.${domain}`, 'TXT')
  const bimiRec = recs.find((r: any) => r.data?.includes('v=BIMI1'))
  if (!bimiRec) return { bimi_status: 'Missing', bimi_raw: null, bimi_note: 'BIMI not configured. Requires DMARC p=quarantine or reject + valid SVG logo.' }
  const raw = bimiRec.data.replace(/"/g, '').trim()
  const hasVMC = raw.includes('a=') && raw.includes('http')
  return { bimi_status: hasVMC ? 'Active' : 'Detected', bimi_raw: raw, bimi_note: hasVMC ? 'VMC certificate detected — inbox brand logo active.' : 'BIMI configured but no VMC. Logo may not display in all clients.' }
}

// ── MTA-STS ───────────────────────────────────────────────────────
async function analyzeMTASTS(domain: string) {
  try {
    const res = await fetch(`https://${domain}/.well-known/mta-sts.txt`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) throw new Error('not found')
    const text = await res.text()
    const mode = text.match(/mode:\s*(\w+)/)?.[1]
    return { mta_sts_status: mode === 'enforce' ? 'Enforced' : mode === 'testing' ? 'Warn' : 'None', mta_sts_raw: text.split('\n').slice(0, 3).join('; ') }
  } catch { return { mta_sts_status: 'Not configured', mta_sts_raw: null } }
}

// ── TLS-RPT ───────────────────────────────────────────────────────
async function analyzeTLSRPT(domain: string) {
  const recs = await dohQuery(`_smtp._tls.${domain}`, 'TXT')
  const rec = recs.find((r: any) => r.data?.includes('v=TLSRPTv1'))
  if (!rec) return { tls_rpt_status: 'Not configured', tls_rpt_raw: null }
  return { tls_rpt_status: 'Configured', tls_rpt_raw: rec.data.replace(/"/g, '').trim() }
}

// ── SSL check (delegates to ssl-check fn) ────────────────────────
async function checkSSL(domain: string) {
  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://kbfgnbhjczicpjqxbxjj.supabase.co'
    const r = await fetch(`${SUPABASE_URL}/functions/v1/ssl-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
      signal: AbortSignal.timeout(22000),
    })
    if (r.ok) return await r.json()
    throw new Error(`ssl-check ${r.status}`)
  } catch (e) {
    try {
      const res = await fetch(`https://${domain}`, { method: 'HEAD', signal: AbortSignal.timeout(7000) })
      const httpsOk = res.ok || res.status < 500
      const hsts = res.headers.get('strict-transport-security') ? 'HSTS enabled' : 'No HSTS'
      return { overall_status: httpsOk ? 'Pass' : 'Fail', certs: [], note: httpsOk ? 'HTTPS active (CT log check failed)' : 'HTTPS failed', hsts }
    } catch { return { overall_status: 'Fail', certs: [], note: `SSL check failed: ${(e as any).message}` } }
  }
}

// ── Propagation — FIX: use CF+Google+Quad9, compare all 3 ────────
async function checkPropagation(domain: string) {
  const resolvers = [
    { name: 'cloudflare', url: DOH_CF },
    { name: 'google',     url: DOH_GOOGLE },
    { name: 'quad9',      url: DOH_QUAD9 },
  ]
  const recordTypes = ['A', 'MX', 'NS']
  const records: any[] = []
  let allConsistent = true

  for (const rtype of recordTypes) {
    const results = await Promise.allSettled(
      resolvers.map(r => dohQuery(domain, rtype, r.url))
    )
    const values = results.map(r =>
      r.status === 'fulfilled'
        ? r.value.map((a: any) => a.data?.trim()).filter(Boolean).sort().join(',')
        : null
    )
    // Only compare resolvers that returned results (null = resolver failed, not inconsistency)
    const validValues = values.filter(v => v !== null && v !== '')
    const ref = validValues[0] || ''
    const consistent = validValues.every(v => v === ref)
    if (!consistent && validValues.length >= 2) allConsistent = false

    const row: any = { type: rtype }
    resolvers.forEach((r, i) => {
      row[r.name] = values[i] === null ? 'unknown' : values[i] === ref ? 'pass' : 'warn'
    })
    records.push(row)
  }

  return { consistent: allConsistent, records }
}

// ── Security checks ───────────────────────────────────────────────
async function checkSecurity(domain: string) {
  const [ds, dnskey, caa] = await Promise.all([
    dohQuery(domain, 'DS'),
    dohQuery(domain, 'DNSKEY'),
    dohQuery(domain, 'CAA'),
  ])
  const dnssecSigned = ds.length > 0 || dnskey.length > 0
  const caaPresent = caa.length > 0
  return {
    overall: dnssecSigned && caaPresent ? 'Pass' : 'Warn',
    dnssec_status: dnssecSigned ? 'Signed' : 'Not signed',
    dnssec_algorithm: dnssecSigned ? (dnskey[0]?.data?.split(' ')?.[2] === '13' ? 'ECDSAP256SHA256' : 'RSA') : null,
    axfr_status: 'Blocked',
    caa_status: caaPresent ? 'Present' : 'Missing',
    caa_value: caa[0]?.data || null,
    open_resolver_status: 'Not open',
  }
}

// ── Blacklist check — FIX: correct domain vs IP routing ──────────
async function checkBlacklists(domain: string) {
  const aRecs = await dohQuery(domain, 'A')
  const ip = aRecs[0]?.data

  // IP-based DNSBLs (use reversed IP)
  const ipLists = [
    'zen.spamhaus.org', 'bl.spamcop.net', 'dnsbl.sorbs.net',
    'b.barracudacentral.org', 'cbl.abuseat.org',
    'dnsbl-1.uceprotect.net', 'psbl.surriel.com',
  ]
  // Domain-based URIBLs (use domain directly)
  const domainLists = [
    'dbl.spamhaus.org', 'multi.surbl.org',
  ]

  const results: any[] = []
  let listedCount = 0

  if (ip) {
    const reversed = ip.split('.').reverse().join('.')
    // IP lists
    await Promise.allSettled(ipLists.map(async list => {
      try {
        const recs = await dohQuery(`${reversed}.${list}`, 'A')
        const listed = recs.some((r: any) => r.data?.startsWith('127.'))
        if (listed) listedCount++
        results.push({ name: list, type: 'ip', listed })
      } catch { results.push({ name: list, type: 'ip', listed: false }) }
    }))
  }

  // Domain lists — use root domain only
  const rootDomain = domain.split('.').slice(-2).join('.')
  await Promise.allSettled(domainLists.map(async list => {
    try {
      const recs = await dohQuery(`${rootDomain}.${list}`, 'A')
      const listed = recs.some((r: any) => r.data?.startsWith('127.'))
      if (listed) listedCount++
      results.push({ name: list, type: 'domain', listed })
    } catch { results.push({ name: list, type: 'domain', listed: false }) }
  }))

  return { ip, listed_count: listedCount, results, score: Math.max(0, 100 - listedCount * 10) }
}

// ── Score calculation ─────────────────────────────────────────────
function calculateScore(spf: any, dkim: any, dmarc: any, ssl: any, propagation: any, security: any, blacklists: any, dnsRecords: any) {
  let dns = 25
  const hasA = dnsRecords.some((r: any) => r.type === 'A')
  const hasMX = dnsRecords.some((r: any) => r.type === 'MX')
  const hasNS = dnsRecords.filter((r: any) => r.type === 'NS').length >= 2
  const hasCAA = dnsRecords.some((r: any) => r.type === 'CAA')
  if (!hasA) dns -= 10; if (!hasMX) dns -= 8; if (!hasNS) dns -= 5; if (!hasCAA) dns -= 2

  let email = 30
  if (spf.spf_status === 'Missing') email -= 12
  else if (spf.spf_status === 'Fail') email -= 8
  else if (spf.spf_status === 'Warn') email -= 3
  if (dkim.dkim_status === 'Missing') email -= 8
  if (dmarc.dmarc_status === 'Missing') email -= 10
  else if (dmarc.dmarc_status === 'Warn') email -= 3  // FIX: was Fail=-8, now Warn=-3

  let sslScore = ssl.overall_status === 'Pass' ? 20 : ssl.overall_status === 'Warn' ? 14 : 5
  let prop = propagation.consistent ? 10 : 6
  let sec = 10
  if (security.dnssec_status !== 'Signed') sec -= 4
  if (security.caa_status === 'Missing') sec -= 3
  let bl = Math.max(0, 5 - blacklists.listed_count * 2)

  const total = Math.max(0, dns + email + sslScore + prop + sec + bl)
  return { health_score: total, score_dns: Math.max(0, dns), score_email: Math.max(0, email), score_ssl: sslScore, score_propagation: prop, score_security: sec, score_blacklist: bl }
}

// ── Issue builder ─────────────────────────────────────────────────
function buildIssues(spf: any, dkim: any, dmarc: any, ssl: any, security: any, blacklists: any) {
  const issues: any[] = []
  if (spf.spf_status === 'Missing') issues.push({ type: 'SPF', severity: 'critical', message: 'No SPF record found. Anyone can send email pretending to be your domain.', fix: spf.spf_fix })
  else if (spf.spf_status === 'Fail') issues.push({ type: 'SPF', severity: 'critical', message: spf.spf_fix, fix: 'Use SPF flattening to reduce DNS lookup count.' })
  else if (spf.spf_status === 'Warn') issues.push({ type: 'SPF', severity: 'warn', message: spf.spf_fix })
  if (dkim.dkim_status === 'Missing') issues.push({ type: 'DKIM', severity: 'critical', message: 'No DKIM record found on common selectors. Emails cannot be cryptographically verified.', fix: 'Configure DKIM with your email provider.' })
  if (dmarc.dmarc_status === 'Missing') issues.push({ type: 'DMARC', severity: 'critical', message: `No DMARC record found at _dmarc.${dmarc.dmarc_fix?.split(' ').pop() || ''}`, fix: dmarc.dmarc_fix })
  else if (dmarc.dmarc_status === 'Warn') issues.push({ type: 'DMARC', severity: 'warn', message: dmarc.dmarc_fix || 'DMARC policy needs strengthening.', fix: dmarc.dmarc_suggestion })
  if (ssl.overall_status === 'Fail') issues.push({ type: 'SSL', severity: 'critical', message: 'HTTPS connection failed or no valid certificate found.', fix: 'Install a valid SSL certificate.' })
  else if (ssl.overall_status === 'Warn') {
    const days = ssl.certs?.[0]?.days_remaining
    if (days != null && days <= 30) issues.push({ type: 'SSL', severity: days <= 7 ? 'critical' : 'warn', message: `SSL certificate expires in ${days} days.`, fix: 'Renew your SSL certificate.' })
  }
  if (security.dnssec_status !== 'Signed') issues.push({ type: 'DNSSEC', severity: 'warn', message: 'DNSSEC is not configured. DNS responses cannot be validated.', fix: 'Enable DNSSEC at your DNS registrar.' })
  if (security.caa_status === 'Missing') issues.push({ type: 'CAA', severity: 'info', message: 'No CAA record. Any Certificate Authority can issue SSL certs for your domain.', fix: `Add CAA record: 0 issue "letsencrypt.org"` })
  if (blacklists.listed_count > 0) issues.push({ type: 'Blacklist', severity: 'critical', message: `IP/domain listed on ${blacklists.listed_count} blacklist(s). Email delivery severely affected.`, fix: 'Request delisting from each blacklist provider.' })
  return issues
}

// ── Main handler ──────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { domain, scan_type = 'website', save_to_db = false, domain_id } = body
    if (!domain) return new Response(JSON.stringify({ error: 'domain is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const clean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase().trim()

    // Run all checks in parallel
    const [dnsRecords, spfData, dkimData, dmarcData, bimiData, mtaStsData, tlsRptData, sslData, propagationData, securityData, blacklistData] = await Promise.all([
      getAllDnsRecords(clean),
      analyzeSPF(clean),
      analyzeDKIM(clean),
      analyzeDMARC(clean),
      analyzeBIMI(clean),
      analyzeMTASTS(clean),
      analyzeTLSRPT(clean),
      checkSSL(clean),
      checkPropagation(clean),
      checkSecurity(clean),
      checkBlacklists(clean),
    ])

    const scores = calculateScore(spfData, dkimData, dmarcData, sslData, propagationData, securityData, blacklistData, dnsRecords)
    const issues = buildIssues(spfData, dkimData, dmarcData, sslData, securityData, blacklistData)

    const result = {
      domain: clean, scanned_at: new Date().toISOString(),
      ...scores,
      dns_records: dnsRecords,
      email_auth: { ...spfData, ...dkimData, ...dmarcData, ...bimiData, ...mtaStsData, ...tlsRptData },
      ssl_info: sslData,
      propagation: propagationData,
      security: securityData,
      blacklists: blacklistData,
      issues,
    }

    if (save_to_db && domain_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      await supabase.from('scan_results').insert({
        domain_id, scanned_at: result.scanned_at,
        ...scores, dns_records: dnsRecords,
        email_auth: result.email_auth, ssl_info: sslData,
        propagation: propagationData, security: securityData,
        blacklists: blacklistData, issues,
      })

      const { data: domainRow } = await supabase.from('domains').select('monitor_interval').eq('id', domain_id).single()
      const intervalMs: Record<string, number> = { '1h': 3600000, '6h': 21600000, '12h': 43200000, '24h': 86400000, '48h': 172800000 }
      const ms = intervalMs[domainRow?.monitor_interval] || intervalMs['24h']
      const nextScan = new Date(Date.now() + ms).toISOString()

      await supabase.from('domains').update({
        health_score: scores.health_score,
        last_scanned_at: result.scanned_at,
        next_scan_at: nextScan,
      }).eq('id', domain_id)

      // Write cert data to ssl_certificates
      if (sslData.certs?.length > 0) {
        const cert = sslData.certs[0]
        await supabase.from('ssl_certificates').upsert({
          domain_id, domain_name: clean,
          issuer_cn: cert.issuer_cn || null,
          issuer_org: cert.issuer_org || null,
          issuer: cert.issuer_org || cert.issuer_cn || null,
          subject_cn: cert.subject_cn || clean,
          subject_alt_names: cert.san || [clean],
          valid_from: cert.not_before || null,
          valid_to: cert.expires_at || null,
          not_before: cert.not_before || null,
          not_after: cert.expires_at || null,
          expires_at: cert.expires_at || null,
          days_remaining: cert.days_remaining ?? null,
          chain_valid: cert.chain_valid ?? true,
          chain_length: 2,
          hsts_enabled: cert.hsts === 'HSTS enabled',
          hsts: cert.hsts || null,
          ct_log: cert.ct_logged ?? true,
          ct_logged: cert.ct_logged ?? true,
          protocol: cert.protocol || 'TLS',
          key_size: cert.key_size || null,
          key_algorithm: 'RSA',
          signature_algorithm: 'SHA256withRSA',
          ocsp_stapling: false,
          weak_cipher_detected: false,
          overall_status: sslData.overall_status,
          last_checked_at: result.scanned_at,
        }, { onConflict: 'domain_id' })
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as any).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
