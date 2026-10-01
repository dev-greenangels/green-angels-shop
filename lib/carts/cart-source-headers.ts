import 'server-only'

import {
  isCountrySiteCode,
  type CountrySiteCode,
} from '@/lib/country-sites/types'
import {
  parseCountryHostMap,
  resolveCountryFromHost,
} from '@/lib/country-sites/resolve-country-host'
import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'

/** Nest trusted origin headers (must match backend cart-source-headers.ts). */
export const CART_SOURCE_HEADERS = {
  countrySite: 'x-ga-cart-country-site',
  sourceHost: 'x-ga-cart-source-host',
  locale: 'x-ga-cart-locale',
  currency: 'x-ga-cart-currency',
  /** Truncated browser User-Agent — Nest parses deviceClass/model; not stored raw. */
  userAgent: 'x-ga-cart-user-agent',
} as const

const MAX_UA_HEADER_LEN = 512

/** Client → BFF: actual next-intl page locale (not NEXT_LOCALE cookie). */
export const PAGE_LOCALE_HEADER = 'x-ga-page-locale'

const SUPPORTED = new Set<string>(SUPPORTED_LOCALES)

export function normalizeSourceHost(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  let host = raw.trim().toLowerCase()
  host = host.replace(/^https?:\/\//, '')
  host = host.split('/')[0]?.split('?')[0]?.split('#')[0] ?? ''
  host = host.split(',')[0]?.trim() ?? ''
  if (host.includes(':') && !host.startsWith('[')) {
    host = host.split(':')[0] ?? ''
  }
  if (host.startsWith('www.')) host = host.slice(4)
  if (!host || host.length > 253) return null
  return host
}

function knownStorefrontHosts(): Set<string> {
  const map = parseCountryHostMap(process.env.GA_COUNTRY_HOSTS)
  const known = new Set<string>()
  for (const host of map.keys()) {
    known.add(host)
    if (host.startsWith('www.')) known.add(host.slice(4))
    else known.add(`www.${host}`)
  }
  return known
}

function isKnownStorefrontHost(host: string | null, known: Set<string>): boolean {
  if (!host) return false
  return known.has(host) || known.has(`www.${host}`)
}

/**
 * Prefer real Host when it is a configured storefront.
 * Use XFH only when Host is not a known storefront (proxy/internal Host + public XFH).
 * Never let a browser XFH override a known Host to another storefront.
 */
export function resolveTrustedSourceHost(request: Request): string | null {
  const known = knownStorefrontHosts()
  const host = normalizeSourceHost(request.headers.get('host'))
  const xfh = normalizeSourceHost(
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim(),
  )

  if (isKnownStorefrontHost(host, known)) return host
  if (isKnownStorefrontHost(xfh, known)) return xfh
  // localhost / preview / unknown — keep Host; do not invent production origin from XFH
  return host
}

export function resolveCountrySiteFromHost(host: string | null): CountrySiteCode | null {
  if (!host) return null
  const map = parseCountryHostMap(process.env.GA_COUNTRY_HOSTS)
  // Host is www-stripped; map may list either form.
  return (
    resolveCountryFromHost(host, map) ??
    resolveCountryFromHost(`www.${host}`, map)
  )
}

export function resolvePageLocale(
  raw: string | null | undefined,
): AppLocale | null {
  const locale = raw?.trim().toLowerCase()
  if (!locale || !SUPPORTED.has(locale)) return null
  return locale as AppLocale
}

/**
 * Build Nest Cart origin headers.
 * - locale: page locale from client header (validated) — NOT NEXT_LOCALE cookie
 * - country/host: trusted Host / XFH allowlist — NOT browser x-ga-country
 * - currency: omitted so Nest fills from market.countrySites (same as storefront)
 */
export function buildCartSourceHeaders(
  request: Request,
  options?: { pageLocale?: string | null },
): Record<string, string> {
  const host = resolveTrustedSourceHost(request)
  const countrySite = resolveCountrySiteFromHost(host)
  const pageLocale =
    resolvePageLocale(options?.pageLocale) ??
    resolvePageLocale(request.headers.get(PAGE_LOCALE_HEADER))

  const headers: Record<string, string> = {}
  if (countrySite) headers[CART_SOURCE_HEADERS.countrySite] = countrySite
  if (host) headers[CART_SOURCE_HEADERS.sourceHost] = host
  if (pageLocale) headers[CART_SOURCE_HEADERS.locale] = pageLocale
  // Intentionally omit currency — Nest resolveCurrencyForCountrySite uses market.countrySites
  const ua = request.headers.get('user-agent')?.trim()
  if (ua) {
    headers[CART_SOURCE_HEADERS.userAgent] = ua.slice(0, MAX_UA_HEADER_LEN)
  }
  return headers
}
