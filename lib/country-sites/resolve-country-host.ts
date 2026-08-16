import {
  COUNTRY_SITE_CODES,
  isCountrySiteCode,
  type CountrySiteCode,
} from '@/lib/country-sites/types'

/**
 * Parse `GA_COUNTRY_HOSTS` env:
 * `green-angels.sk:sk,www.green-angels.sk:sk,green-angels.hu:hu,...`
 */
export function parseCountryHostMap(raw: string | undefined | null): Map<string, CountrySiteCode> {
  const map = new Map<string, CountrySiteCode>()
  if (!raw?.trim()) return map

  for (const part of raw.split(',')) {
    const trimmed = part.trim().toLowerCase()
    if (!trimmed) continue
    const colon = trimmed.lastIndexOf(':')
    if (colon <= 0) continue
    const host = trimmed.slice(0, colon).trim()
    const code = trimmed.slice(colon + 1).trim()
    if (!host || !isCountrySiteCode(code)) continue
    map.set(host, code)
  }
  return map
}

export function resolveCountryFromHost(
  hostname: string,
  hostMap: Map<string, CountrySiteCode> = parseCountryHostMap(process.env.GA_COUNTRY_HOSTS),
): CountrySiteCode | null {
  const host = hostname.split(':')[0]?.toLowerCase().trim() ?? ''
  if (!host) return null
  return hostMap.get(host) ?? null
}

/** When MARKET/SK deploy has a host map but preview host is unmapped, fall back to sk. */
export function resolveCountryFromHostWithFallback(
  hostname: string,
  options?: { fallbackWhenMapPresent?: CountrySiteCode | null },
): CountrySiteCode | null {
  const hostMap = parseCountryHostMap(process.env.GA_COUNTRY_HOSTS)
  const resolved = resolveCountryFromHost(hostname, hostMap)
  if (resolved) return resolved
  if (hostMap.size > 0) {
    return options?.fallbackWhenMapPresent ?? 'sk'
  }
  return null
}

export { defaultLocaleForCountry } from '@/lib/country-sites/edge-locales'

export { COUNTRY_SITE_CODES }
