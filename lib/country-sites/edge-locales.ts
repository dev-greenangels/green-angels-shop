import type { AppLocale } from '@/i18n/routing'
import type { CountrySiteCode } from '@/lib/country-sites/types'

/**
 * Static allowlists for Edge (`proxy.ts`) — no Nest round-trip.
 * Runtime switcher / hreflang use Backoffice `countrySites.availableLocales`.
 * Keep these lists aligned with `DEFAULT_COUNTRY_SITES` defaults.
 */
export const COUNTRY_LOCALES: Record<CountrySiteCode, readonly AppLocale[]> = {
  sk: ['sk', 'en', 'cs'],
  hu: ['hu', 'en'],
  at: ['de', 'en'],
}

export function defaultLocaleForCountry(code: CountrySiteCode): AppLocale {
  if (code === 'hu') return 'hu'
  if (code === 'at') return 'de'
  return 'sk'
}
