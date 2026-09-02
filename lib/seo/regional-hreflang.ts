import type { AppLocale } from '@/i18n/routing'
import { isAppLocale } from '@/i18n/routing'
import type { CountrySiteCode } from '@/lib/country-sites/types'
import { localePath } from '@/lib/locale-path'
import type { CountrySiteProfile } from '@/lib/settings/market'

import { collectCountryPublicOrigins } from './market-hosts'
import { normalizeIndexablePath } from './page-alternates'

/** Regional hreflang tokens for SK multi-domain deploy (HOST = market). */
export const REGIONAL_HREFLANG: Record<
  CountrySiteCode,
  Partial<Record<AppLocale, string>>
> = {
  sk: { sk: 'sk-SK', en: 'en-SK', cs: 'cs-SK' },
  at: { de: 'de-AT', en: 'en-AT' },
  hu: { hu: 'hu-HU', en: 'en-HU' },
}

export function regionalHreflang(
  countryCode: CountrySiteCode,
  locale: AppLocale,
): string | null {
  return REGIONAL_HREFLANG[countryCode]?.[locale] ?? null
}

export function buildSkRegionalAlternates(input: {
  origin: string
  locale: AppLocale
  pathname: string
  countryCode: CountrySiteCode | null
  enabledCountrySites: CountrySiteProfile[]
  countryHostsEnv?: string | null
  siteUrl?: string | null
}): { canonical: string; languages: Record<string, string> } | null {
  const origin = input.origin.replace(/\/$/, '')
  if (!origin || !isAppLocale(input.locale)) return null

  const pathname = normalizeIndexablePath(input.pathname)
  const canonical = `${origin}${localePath(pathname, input.locale)}`
  const origins = collectCountryPublicOrigins({
    countryHostsEnv: input.countryHostsEnv,
    siteUrl: input.siteUrl,
  })

  const languages: Record<string, string> = {}

  for (const site of input.enabledCountrySites) {
    if (!site.enabled) continue
    const siteOrigin = origins.get(site.code)
    if (!siteOrigin) continue

    for (const locale of site.availableLocales) {
      if (!isAppLocale(locale)) continue
      const hreflang = regionalHreflang(site.code, locale)
      if (!hreflang) continue
      languages[hreflang] = `${siteOrigin.replace(/\/$/, '')}${localePath(pathname, locale)}`
    }
  }

  if (input.countryCode) {
    const selfTag = regionalHreflang(input.countryCode, input.locale)
    if (selfTag) languages[selfTag] = canonical
  }

  return { canonical, languages }
}
