import type { AppLocale } from '@/i18n/routing'
import { parseCountryHostMap } from '@/lib/country-sites/resolve-country-host'
import { COUNTRY_SITE_CODES, type CountrySiteCode } from '@/lib/country-sites/types'
import { protocolFromSiteUrl } from '@/lib/seo/public-origin'

/** Prefer apex host when both www and apex appear in GA_COUNTRY_HOSTS. */
export function collectCountryPublicOrigins(input?: {
  countryHostsEnv?: string | null
  siteUrl?: string | null
}): Map<CountrySiteCode, string> {
  const map = parseCountryHostMap(input?.countryHostsEnv ?? process.env.GA_COUNTRY_HOSTS)
  const proto = protocolFromSiteUrl(input?.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL)
  const hostsByCode = new Map<CountrySiteCode, string[]>()

  for (const [host, code] of map.entries()) {
    const list = hostsByCode.get(code) ?? []
    list.push(host)
    hostsByCode.set(code, list)
  }

  const origins = new Map<CountrySiteCode, string>()
  for (const code of COUNTRY_SITE_CODES) {
    const hosts = hostsByCode.get(code)
    if (!hosts?.length) continue
    const apex = hosts.find((host) => !host.startsWith('www.')) ?? hosts[0]
    origins.set(code, `${proto}://${apex}`)
  }

  return origins
}

export function originForCountrySite(
  code: CountrySiteCode,
  input?: { countryHostsEnv?: string | null; siteUrl?: string | null },
): string | null {
  return collectCountryPublicOrigins(input).get(code) ?? null
}
