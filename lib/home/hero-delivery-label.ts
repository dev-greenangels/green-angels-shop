import type { CountrySiteCode } from '@/lib/country-sites/types'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import type { MarketSettings } from '@/lib/settings/market'
import { allowedDeliveryCountriesForHost } from '@/lib/settings/market'

/**
 * Delivery country codes for the home hero highlight.
 * SK multi-domain: all countries allowed for the current host (settings), not only the host itself.
 */
export function resolveHeroDeliveryCountryCodes(
  market: MarketSettings,
  hostCountry: CountrySiteCode | null | undefined,
): string[] {
  if (market.region !== 'sk') return ['ua']
  if (!hostCountry) return []
  return allowedDeliveryCountriesForHost(market, hostCountry)
}

/** @deprecated Prefer resolveHeroDeliveryCountryCodes — kept for older imports. */
export function resolveHeroDeliveryCountryCode(
  market: MarketSettings,
  hostCountry: CountrySiteCode | null | undefined,
): string {
  const codes = resolveHeroDeliveryCountryCodes(market, hostCountry)
  if (codes.length === 0) return hostCountry || 'sk'
  if (hostCountry && codes.includes(hostCountry)) return hostCountry
  return codes[0]!
}

/** Locale-aware conjunction list for country names (e.g. "Slovakia and Czechia"). */
export function formatHeroDeliveryCountryList(
  countryNames: string[],
  locale: string,
): string {
  const names = countryNames.map((n) => n.trim()).filter(Boolean)
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]!
  try {
    return new Intl.ListFormat(intlLocaleForApp(locale), {
      style: 'long',
      type: 'conjunction',
    }).format(names)
  } catch {
    return names.join(', ')
  }
}
