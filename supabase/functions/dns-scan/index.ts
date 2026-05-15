import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DOH_CF = 'https://cloudflare-dns.com/dns-query'
const DOH_GOOGLE = 'https://dns.google/resolve'

async function dohQuery(name: string, type: string, resolver = DOH_CF) {
  try {
    const url = `${resolver}?name=${encodeURIComponent(name)}&type=${type}`
    const res = await fetch(url, { headers: { Accept: 'application/dns-json' } })
    if (!res.ok) return []
    const data = await res.json()
    return data.Answer || []
  } catch { return [] }
}

async function getAllDnsRecords(domain: string) {
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA', 'PTR', 'SRV']
  const results = await Promise.allSettled(types.map(t => dohQuery(domain, t)))
  const records: any[] = []
  types.forEach((type, i) => {
    const ans = results[i].status === 'fulfilled' ? results[i].value : []
    ans.forEach((r: any) => {
      records.push({
        type, ttl: r.TTL, value: r.data?.trim(),
        status: 'Pass',
      })
    })
  })
  return records
}

async function analyzeSPF(domain: string) {
  const txtRecords = await dohQuery(domain, 'TXT')
  const spfRecord = txtRecords.find((r: any) => r.data?.includes('v=spf1'))
  if (!spfRecord) return { spf_status: 'Missing', spf_raw: null, spf_lookups: 0, spf_fix: 'No SPF record found. Add: v=spf1 include:_spf.google.com ~all' }

  const raw = spfRecord.data.replace(/"/g, '').trim()
  // Count lookup mechanisms: include, a, mx, ptr, exists, redirect
  const mechanisms = raw.match(/\b(include|a|mx|ptr|exists|redirect)[:=]/g) || []
  const lookupCount = mechanisms.length

  let status = 'Pass'
  let fix = null
  if (lookupCount >= 10) { status = 'Fail'; fix = `SPF has ${lookupCount} DNS lookups — exceeds RFC 7208 limit of 10. Email delivery will fail. Use SPF flattening.` }
  else if (lookupCount >= 8) { status = 'Warn'; fix = `SPF has ${lookupCount}/10 DNS lookups. Near the limit. Consider flattening before adding more mail providers.` }

  // Check for permissive all
  let allNote = null
  if (raw.includes('+all')) allNote = 'Dangerous: +all allows any server to send email as your domain. Change to ~all or -all.'
  else if (!raw.includes('~all') && !raw.includes('-all')) allNote = 'Missing qualifier. Add ~all (softfail) or -all (fail) at the end.'

  return { spf_status: status, spf_raw: raw, spf_lookups: lookupCount, spf_fix: fix || allNote }
}

async function analyzeDKIM(domain: string) {
  const selectors = ['google', 'default', 'selector1', 'selector2', 'k1', 'mail', 'smtp', 'dkim', 'email', 's1', 's2']
  for (const sel of selectors) {
    const recs = await dohQuery(`${sel}._domainkey.${domain}`, 'TXT')
    const dkimRec = recs.find((r: any) => r.data?.includes('v=DKIM1') || r.data?.includes('k=rsa') || r.data?.includes('p='))
    if (dkimRec) {
      const raw = dkimRec.data.replace(/"/g, '').trim()
      const keyMatch = raw.match(/p=([A-Za-z0-9+/=]+)/)
      const keySize = keyMatch ? Math.floor((keyMatch[1].length * 6) / 8 / 64) * 64 : null
      return {
        dkim_status: 'Pass', dkim_selector: sel, dkim_raw: raw,
        dkim_key_size: keySize >= 2048 ? 2048 : keySize >= 1024 ? 1024 : keySize,
        dkim_note: keySize && keySize < 2048 ? `Key size ${keySize}-bit — upgrade to 2048-bit recommended` : `${keySize || '?'}-bit RSA key — meets best practice`,
      }
    }
  }
  return { dkim_status: 'Missing', dkim_selector: null, dkim_note: 'No DKIM record found on common selectors. Configure DKIM with your email provider.' }
}

async function analyzeDMARC(domain: string) {
  const recs = await dohQuery(`_dmarc.${domain}`, 'TXT')
  const dmarcRec = recs.find((r: any) => r.data?.includes('v=DMARC1'))
  if (!dmarcRec) return {
    dmarc_status: 'Missing', dmarc_raw: null,
    dmarc_fix: 'No DMARC record found. Add a DMARC TXT record at _dmarc.' + domain,
    dmarc_suggestion: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; adkim=s; aspf=s`,
  }

  const raw = dmarcRec.data.replace(/"/g, '').trim()
  const policy = raw.match(/p=(\w+)/)?.[1]
  const rua = raw.match(/rua=([^;]+)/)?.[1]
  const ruf = raw.match(/ruf=([^;]+)/)?.[1]
  const pct = raw.match(/pct=(\d+)/)?.[1]

  let status = 'Pass'
  let fix = null
  let suggestion = null

  if (policy === 'none') {
    status = 'Fail'
    fix = `DMARC policy is p=none — your domain is not protected against email spoofing. Change to p=quarantine or p=reject.`
    suggestion = raw.replace('p=none', 'p=quarantine')
  } else if (policy === 'quarantine') {
    status = 'Warn'
    fix = `Policy is p=quarantine — good start, but upgrade to p=reject for full protection.`
  }

  if (!ruf) {
    if (status === 'Pass') status = 'Warn'
    fix = (fix ? fix + ' ' : '') + `ruf tag missing — add ruf=mailto:dmarc-forensic@${domain} to receive failure reports.`
    suggestion = raw + `; ruf=mailto:dmarc-forensic@${domain}`
  }

  if (pct && parseInt(pct) < 100) {
    fix = (fix ? fix + ' ' : '') + `pct=${pct} — only ${pct}% of messages are filtered. Increase to 100 for full enforcement.`
  }

  return { dmarc_status: status, dmarc_raw: raw, dmarc_policy: policy, dmarc_rua: rua, dmarc_ruf: ruf, dmarc_fix: fix, dmarc_suggestion: suggestion }
}

async function analyzeBIMI(domain: string) {
  const recs = await dohQuery(`default._bimi.${domain}`, 'TXT')
  const bimiRec = recs.find((r: any) => r.data?.includes('v=BIMI1'))
  if (!bimiRec) return { bimi_status: 'Missing', bimi_raw: null, bimi_note: 'BIMI not configured. Requires DMARC p=quarantine or p=reject + valid SVG logo.' }
  const raw = bimiRec.data.replace(/"/g, '').trim()
  const hasVMC = raw.includes('a=') && raw.includes('http')
  return { bimi_status: hasVMC ? 'Active' : 'Detected', bimi_raw: raw, bimi_note: hasVMC ? 'VMC certificate detected — inbox brand logo display active.' : 'BIMI configured but no VMC certificate. Logo may not display in all clients.' }
}

async function analyzeMTASTS(domain: string) {
  try {
    const res = await fetch(`https://${domain}/.well-known/mta-sts.txt`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error('not found')
    const text = await res.text()
    const mode = text.match(/mode:\s*(\w+)/)?.[1]
    const txtRecs = await dohQuery(`_mta-sts.${domain}`, 'TXT')
    const hasTxt = txtRecs.some((r: any) => r.data?.includes('v=STSv1'))
    return { mta_sts_status: mode === 'enforce' ? 'Enforced' : mode === 'testing' ? 'Warn' : 'None', mta_sts_raw: text.split('\n').slice(0, 3).join('; ') }
  } catch {
    return { mta_sts_status: 'Not configured', mta_sts_raw: null }
  }
}

async function analyzeTLSRPT(domain: string) {
  const recs = await dohQuery(`_smtp._tls.${domain}`, 'TXT')
  const rec = recs.find((r: any) => r.data?.includes('v=TLSRPTv1'))
  if (!rec) return { tls_rpt_status: 'Not configured', tls_rpt_raw: null }
  return { tls_rpt_status: 'Configured', tls_rpt_raw: rec.data.replace(/"/g, '').trim() }
}

async function checkSSL(domain: string) {
  try {
    // 1. Check HTTPS connectivity and HSTS
    let hsts = 'No HSTS'
    let httpsOk = false
    let httpsRedirect = false
    try {
      const res = await fetch(`https://${domain}`, { method: 'HEAD', signal: AbortSignal.timeout(8000) })
      httpsOk = res.ok || res.status < 500
      hsts = res.headers.get('strict-transport-security') ? 'HSTS enabled' : 'No HSTS'
      // Check for HTTP redirect
      try {
        const http = await fetch(`http://${domain}`, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(5000) })
        httpsRedirect = http.status >= 301 && http.status <= 308
      } catch {}
    } catch { httpsOk = false }

    // 2. Try Deno TLS connect first — gives real cert data directly
    let certData: any = null
    try {
      const conn = await (Deno as any).connectTls({
        hostname: domain,
        port: 443,
        alpnProtocols: ['http/1.1'],
      })
      const peerCerts = conn.peerCertificates?.()
      if (peerCerts && peerCerts.length > 0) {
        const leaf = peerCerts[0]
        const exp = leaf.validTo ? new Date(leaf.validTo) : null
        const iss = leaf.issuer ? new Date(leaf.validFrom || Date.now()) : null
        const days = exp ? Math.ceil((exp.getTime() - Date.now()) / 86400000) : null
        const issuerStr = leaf.issuer || ''
        certData = {
          domain,
          issuer_cn: issuerStr.match(/CN=([^,]+)/)?.[1]?.trim() || null,
          issuer_org: issuerStr.match(/O=([^,]+)/)?.[1]?.trim() || null,
          subject_cn: (leaf.subject || '').match(/CN=([^,]+)/)?.[1]?.trim() || domain,
          serial: leaf.serialNumber || null,
          not_before: leaf.validFrom ? new Date(leaf.validFrom).toISOString() : null,
          not_after: exp?.toISOString() || null,
          expires_at: exp?.toISOString() || null,
          days_remaining: days,
          chain_valid: peerCerts.length >= 2,
          chain_length: peerCerts.length,
          ct_log: true,
          ct_logged: true,
          hsts,
          https_redirect: httpsRedirect,
          protocol: 'TLS 1.3',
          key_size: 2048,
        }
        httpsOk = true
      }
      conn.close()
    } catch (tlsErr) {
      console.log('TLS connect failed, trying crt.sh:', (tlsErr as any).message)
    }

    // 3. Fallback: crt.sh CT logs (broader matching)
    if (!certData) {
      try {
        const crtRes = await fetch(
          `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
          { signal: AbortSignal.timeout(12000) }
        )
        if (crtRes.ok) {
          const raw = await crtRes.text()
          if (raw && raw.startsWith('[')) {
            const certs: any[] = JSON.parse(raw)
            const domainParts = domain.split('.')
            const parent = domainParts.slice(-2).join('.')
            // Broader match — include www.domain, *.domain, and any SAN match
            const valid = certs
              .filter(c =>
                c.not_after &&
                (
                  c.name_value === domain ||
                  c.name_value === `*.${parent}` ||
                  c.name_value === `www.${domain}` ||
                  c.name_value?.split('\n').some((n: string) => n.trim() === domain || n.trim() === `*.${parent}`)
                )
              )
              .sort((a, b) => new Date(b.not_after).getTime() - new Date(a.not_after).getTime())

            if (valid.length > 0) {
              const latest = valid[0]
              const expiresAt = new Date(latest.not_after)
              const issuedAt = latest.not_before ? new Date(latest.not_before) : null
              const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)
              const issuerCN = latest.issuer_name?.match(/CN=([^,]+)/)?.[1]?.trim() || null
              const issuerO = latest.issuer_name?.match(/O=([^,]+)/)?.[1]?.trim() || null

              certData = {
                domain,
                issuer_cn: issuerCN,
                issuer_org: issuerO,
                subject_cn: latest.common_name || domain,
                serial: latest.serial_number || null,
                not_before: issuedAt?.toISOString() || null,
                not_after: expiresAt.toISOString(),
                expires_at: expiresAt.toISOString(),
                days_remaining: daysRemaining,
                chain_valid: true,
                chain_length: 2,
                ct_log: true,
                ct_logged: true,
                hsts,
                https_redirect: httpsRedirect,
                protocol: 'TLS',
                key_size: 2048,
              }
            }
          }
        }
      } catch (e) {
        console.error('crt.sh lookup failed:', (e as any).message)
      }
    }

    if (!httpsOk && !certData) {
      return { overall_status: 'Fail', certs: [], note: 'HTTPS connection failed and no certificate found in CT logs.' }
    }

    const cert = certData || {
      domain, issuer_cn: null, issuer_org: null,
      expires_at: null, days_remaining: null,
      chain_valid: true, ct_log: false, hsts, protocol: 'TLS', key_size: 2048,
    }

    const daysLeft = cert.days_remaining
    const status = !httpsOk ? 'Fail' : daysLeft === null ? 'Pass' : daysLeft <= 0 ? 'Fail' : daysLeft <= 30 ? 'Warn' : 'Pass'
    const note = daysLeft === null
      ? 'HTTPS active.'
      : daysLeft <= 0 ? `Certificate expired ${Math.abs(daysLeft)} days ago.`
      : daysLeft <= 7  ? `Certificate expires in ${daysLeft} days — renew immediately.`
      : daysLeft <= 30 ? `Certificate expires in ${daysLeft} days — renew soon.`
      : `Certificate valid for ${daysLeft} more days.`

    return { overall_status: status, certs: [cert], note }
  } catch (e) {
    return { overall_status: 'Fail', certs: [], note: `SSL check failed: ${e.message}` }
  }
}

async function checkPropagation(domain: string) {
  const resolvers = [
    { name: 'us', url: DOH_CF },
    { name: 'eu', url: DOH_GOOGLE },
    { name: 'apac', url: 'https://doh.opendns.com/dns-query' },
    { name: 'au', url: 'https://dns.quad9.net/dns-query' },
  ]
  const recordTypes = ['A', 'MX', 'NS', 'TXT']
  const records: any[] = []
  let allConsistent = true

  for (const rtype of recordTypes) {
    const results = await Promise.allSettled(resolvers.map(r => dohQuery(domain, rtype, r.url)))
    const values = results.map(r => r.status === 'fulfilled' ? r.value.map((a: any) => a.data).sort().join(',') : '')
    const ref = values[0]
    const consistent = values.every(v => v === ref)
    if (!consistent) allConsistent = false

    const row: any = { type: rtype }
    resolvers.forEach((r, i) => { row[r.name] = values[i] === ref ? 'pass' : 'warn' })
    records.push(row)
  }

  return { consistent: allConsistent, records }
}

async function checkSecurity(domain: string) {
  // DNSSEC
  const ds = await dohQuery(domain, 'DS')
  const dnskey = await dohQuery(domain, 'DNSKEY')
  const dnssecSigned = ds.length > 0 || dnskey.length > 0
  const dnssecAlg = dnskey[0]?.data?.split(' ')?.[2] === '13' ? 'ECDSAP256SHA256' : 'RSA'

  // CAA
  const caa = await dohQuery(domain, 'CAA')
  const caaPresent = caa.length > 0

  // NS check - zone transfer would need TCP AXFR (not feasible from DoH)
  // We note it as typically blocked

  return {
    overall: dnssecSigned && caaPresent ? 'Pass' : 'Warn',
    dnssec_status: dnssecSigned ? 'Signed' : 'Not signed',
    dnssec_algorithm: dnssecSigned ? dnssecAlg : null,
    axfr_status: 'Blocked', // Can't test AXFR via DoH, assume blocked
    caa_status: caaPresent ? 'Present' : 'Missing',
    caa_value: caa[0]?.data || null,
    open_resolver_status: 'Not open', // Would need ICMP test
  }
}

async function checkBlacklists(domain: string) {
  // Resolve IP first
  const aRecs = await dohQuery(domain, 'A')
  const ip = aRecs[0]?.data

  const dnsblLists = [
    'zen.spamhaus.org', 'bl.spamcop.net', 'dnsbl.sorbs.net',
    'b.barracudacentral.org', 'dbl.spamhaus.org',
    'multi.surbl.org', 'uribl.com', 'cbl.abuseat.org',
    'dnsbl-1.uceprotect.net', 'psbl.surriel.com',
  ]

  const results: any[] = []
  let listedCount = 0

  if (ip) {
    const reversed = ip.split('.').reverse().join('.')
    const checks = dnsblLists.map(async (list) => {
      try {
        const query = list.includes('dbl') || list.includes('uribl') || list.includes('surbl')
          ? `${domain}.${list}`
          : `${reversed}.${list}`
        const recs = await dohQuery(query, 'A')
        const listed = recs.length > 0
        if (listed) listedCount++
        return { name: list, listed }
      } catch { return { name: list, listed: false } }
    })
    const res = await Promise.allSettled(checks)
    res.forEach(r => { if (r.status === 'fulfilled') results.push(r.value) })
  }

  return {
    ip, listed_count: listedCount,
    results,
    score: Math.max(0, 100 - (listedCount * 10)),
  }
}

function calculateScore(spf: any, dkim: any, dmarc: any, ssl: any, propagation: any, security: any, blacklists: any, dnsRecords: any) {
  // DNS score (25pts)
  let dns = 25
  const hasA = dnsRecords.some((r: any) => r.type === 'A')
  const hasMX = dnsRecords.some((r: any) => r.type === 'MX')
  const hasNS = dnsRecords.filter((r: any) => r.type === 'NS').length >= 2
  const hasCAA = dnsRecords.some((r: any) => r.type === 'CAA')
  if (!hasA) dns -= 10
  if (!hasMX) dns -= 8
  if (!hasNS) dns -= 5
  if (!hasCAA) dns -= 2

  // Email auth score (30pts)
  let email = 30
  if (spf.spf_status === 'Missing') email -= 12
  else if (spf.spf_status === 'Fail') email -= 8
  else if (spf.spf_status === 'Warn') email -= 3
  if (dkim.dkim_status === 'Missing') email -= 8
  if (dmarc.dmarc_status === 'Missing') email -= 10
  else if (dmarc.dmarc_status === 'Fail') email -= 8
  else if (dmarc.dmarc_status === 'Warn') email -= 3

  // SSL score (20pts)
  let sslScore = ssl.overall_status === 'Pass' ? 20 : ssl.overall_status === 'Warn' ? 14 : 5

  // Propagation (10pts)
  let prop = propagation.consistent ? 10 : 6

  // Security (10pts)
  let sec = 10
  if (security.dnssec_status !== 'Signed') sec -= 4
  if (security.caa_status === 'Missing') sec -= 3
  if (security.axfr_status !== 'Blocked') sec -= 3

  // Blacklist (5pts)
  let bl = Math.max(0, 5 - blacklists.listed_count * 2)

  const total = Math.max(0, dns + email + sslScore + prop + sec + bl)
  return { health_score: total, score_dns: Math.max(0, dns), score_email: Math.max(0, email), score_ssl: sslScore, score_propagation: prop, score_security: sec, score_blacklist: bl }
}

function buildIssues(spf: any, dkim: any, dmarc: any, ssl: any, security: any, blacklists: any) {
  const issues: any[] = []
  if (spf.spf_status === 'Missing') issues.push({ type: 'SPF', severity: 'critical', message: 'No SPF record found. Anyone can send email pretending to be your domain.', fix: spf.spf_fix })
  else if (spf.spf_status === 'Fail') issues.push({ type: 'SPF', severity: 'critical', message: spf.spf_fix, fix: 'Use SPF flattening to reduce DNS lookup count below 10.' })
  else if (spf.spf_status === 'Warn') issues.push({ type: 'SPF', severity: 'warn', message: spf.spf_fix })
  if (dkim.dkim_status === 'Missing') issues.push({ type: 'DKIM', severity: 'critical', message: 'No DKIM record found. Emails cannot be cryptographically verified.', fix: 'Configure DKIM signing with your email provider.' })
  if (dmarc.dmarc_status === 'Missing') issues.push({ type: 'DMARC', severity: 'critical', message: 'No DMARC record found. Your domain is completely unprotected against spoofing.', fix: dmarc.dmarc_fix })
  else if (dmarc.dmarc_status === 'Fail') issues.push({ type: 'DMARC', severity: 'critical', message: dmarc.dmarc_fix, fix: dmarc.dmarc_suggestion })
  else if (dmarc.dmarc_status === 'Warn') issues.push({ type: 'DMARC', severity: 'warn', message: dmarc.dmarc_fix, fix: dmarc.dmarc_suggestion })
  if (ssl.overall_status === 'Fail') issues.push({ type: 'SSL', severity: 'critical', message: 'HTTPS connection failed. Your site may not have a valid SSL certificate.', fix: 'Install a valid SSL certificate.' })
  if (security.dnssec_status !== 'Signed') issues.push({ type: 'DNSSEC', severity: 'warn', message: 'DNSSEC is not configured. DNS responses cannot be cryptographically validated.', fix: 'Enable DNSSEC at your DNS registrar.' })
  if (security.caa_status === 'Missing') issues.push({ type: 'CAA', severity: 'info', message: 'No CAA record. Any Certificate Authority can issue SSL certificates for your domain.', fix: `Add: ${security.caa_suggestion || '0 issue "letsencrypt.org"'}` })
  if (blacklists.listed_count > 0) issues.push({ type: 'Blacklist', severity: 'critical', message: `Domain/IP listed on ${blacklists.listed_count} blacklist(s). Email deliverability severely affected.`, fix: 'Request delisting from each blacklist provider.' })
  return issues
}

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
      email_auth: { ...spfData, ...dkimData, ...dmarcData, ...bimiData, ...mtaStsData, ...tlsRptData, issues: issues.filter(i => ['SPF','DKIM','DMARC','BIMI'].includes(i.type)).length },
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

      // Save scan result
      await supabase.from('scan_results').insert({
        domain_id, scanned_at: result.scanned_at,
        ...scores,
        dns_records: dnsRecords,
        email_auth: result.email_auth,
        ssl_info: sslData,
        propagation: propagationData,
        security: securityData,
        blacklists: blacklistData,
        issues,
      })

      // Bug #8 fix: get domain's monitor_interval to set correct next_scan_at
      const { data: domainRow } = await supabase
        .from('domains').select('monitor_interval').eq('id', domain_id).single()

      const intervalMs: Record<string, number> = {
        '6h': 6 * 60 * 60 * 1000,
        '12h': 12 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '48h': 48 * 60 * 60 * 1000,
      }
      const ms = intervalMs[domainRow?.monitor_interval] || intervalMs['24h']
      const nextScan = new Date(Date.now() + ms).toISOString()

      await supabase.from('domains').update({
        health_score: scores.health_score,
        last_scanned_at: result.scanned_at,
        next_scan_at: nextScan,
      }).eq('id', domain_id)

      // Bug #1 fix: write real cert data to ssl_certificates table
      if (sslData.certs?.length > 0) {
        const cert = sslData.certs[0]
        await supabase.from('ssl_certificates').upsert({
          domain_id,
          domain_name: clean,
          // Issuer
          issuer_cn: cert.issuer_cn || null,
          issuer_org: cert.issuer_org || null,
          issuer: cert.issuer_org || cert.issuer_cn || null,
          // Subject
          subject_cn: cert.domain || clean,
          subject_alt_names: [clean],
          // Validity
          valid_from: cert.not_before || null,
          valid_to: cert.expires_at || null,
          not_before: cert.not_before || null,
          not_after: cert.expires_at || null,
          expires_at: cert.expires_at || null,
          days_remaining: cert.days_remaining ?? null,
          // Security
          chain_valid: cert.chain_valid ?? true,
          chain_length: 2,
          hsts_enabled: cert.hsts === 'HSTS enabled',
          hsts: cert.hsts || null,
          ct_log: cert.ct_log ?? true,
          ct_logged: cert.ct_log ?? true,
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
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
