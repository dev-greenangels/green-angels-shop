import { parseCountryHostMap } from '@/lib/country-sites/resolve-country-host'

export function normalizeHostname(host: string | null | undefined): string {
  return (host ?? '').split(',')[0]?.split(':')[0]?.toLowerCase().trim() ?? ''
}

export function hostnameFromSiteUrl(siteUrl: string | null | undefined): string {
  const raw = siteUrl?.trim() ?? ''
  if (!raw) return ''
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return normalizeHostname(url.host)
  } catch {
    return normalizeHostname(raw)
  }
}

export function protocolFromSiteUrl(siteUrl: string | null | undefined): 'http' | 'https' {
  const raw = siteUrl?.trim() ?? ''
  if (!raw) return 'https'
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return url.protocol === 'http:' ? 'http' : 'https'
  } catch {
    return 'https'
  }
}

export function collectAllowedHosts(input?: {
  countryHostsEnv?: string | null
  siteUrl?: string | null
}): Set<string> {
  const hosts = new Set<string>()
  const map = parseCountryHostMap(input?.countryHostsEnv ?? process.env.GA_COUNTRY_HOSTS)
  for (const host of map.keys()) hosts.add(host)
  const fromSite = hostnameFromSiteUrl(input?.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL)
  if (fromSite) hosts.add(fromSite)
  return hosts
}

export type PublicOriginResult = {
  origin: string
  host: string
  usedFallback: boolean
}

/**
 * Absolute origin for canonical / hreflang / JSON-LD.
 * Request Host is used only when it is in the GA_COUNTRY_HOSTS ∪ SITE_URL allowlist.
 */
export function resolvePublicOrigin(input?: {
  requestHost?: string | null
  requestProto?: string | null
  countryHostsEnv?: string | null
  siteUrl?: string | null
  nodeEnv?: string | null
}): PublicOriginResult {
  const siteUrl = input?.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV ?? 'development'
  const allowed = collectAllowedHosts({
    countryHostsEnv: input?.countryHostsEnv ?? process.env.GA_COUNTRY_HOSTS,
    siteUrl,
  })
  const requestHost = normalizeHostname(input?.requestHost)
  const fallbackHost = hostnameFromSiteUrl(siteUrl)
  const fallbackProto = protocolFromSiteUrl(siteUrl)

  const hostAllowed = Boolean(requestHost && allowed.has(requestHost))
  const host = hostAllowed ? requestHost : fallbackHost

  if (!host) {
    return { origin: '', host: '', usedFallback: true }
  }

  const forwarded = (input?.requestProto ?? '').split(',')[0]?.trim().toLowerCase()
  const proto: 'http' | 'https' =
    hostAllowed && (forwarded === 'http' || forwarded === 'https')
      ? forwarded
      : fallbackProto

  const origin = `${proto}://${host}`
  if (nodeEnv === 'production' && origin === 'http://localhost:3000') {
    return { origin: '', host: '', usedFallback: true }
  }

  return { origin, host, usedFallback: !hostAllowed }
}
