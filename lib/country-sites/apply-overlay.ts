import type { AppLocale } from '@/lib/i18n/locales'
import type { CountrySiteCode } from '@/lib/country-sites/types'
import type { CountrySiteProfile, MarketSettings } from '@/lib/settings/market'
import {
  DEFAULT_COUNTRY_SITES,
  resolveCatalogTaxRatePercent,
  taxIncludedFromPriceBasis,
} from '@/lib/settings/market'

export type CountrySiteOverlay = {
  countryCode: CountrySiteCode
  profile: CountrySiteProfile
  availableLocales: AppLocale[]
  defaultLocale: AppLocale
  currency: 'EUR' | 'HUF'
  taxRatePercent: number
  taxIncluded: boolean
  eurToHufRate: number
  applyDestinationVatB2c: boolean
  sellerTaxRatePercent: number
}

/**
 * Apply SK country-site profile on top of market settings.
 * Returns null when not SK market or country unknown.
 *
 * Tax % comes from delivery catalog / seller fallback (same as shelf VAT),
 * not from the legacy per-domain taxRatePercent field.
 */
export function applyCountrySiteOverlay(
  market: MarketSettings,
  countryCode: CountrySiteCode | null | undefined,
): CountrySiteOverlay | null {
  if (market.region !== 'sk' || !countryCode) return null

  const profile =
    market.countrySites.find((s) => s.code === countryCode && s.enabled) ??
    DEFAULT_COUNTRY_SITES.find((s) => s.code === countryCode) ??
    null

  if (!profile) return null

  const fallback = market.sellerTaxRatePercent || profile.taxRatePercent
  const rateCountry = market.applyDestinationVatB2c ? countryCode : 'sk'

  // SK/AT always EUR; HU HUF only when payments flag is enabled.
  let currency: 'EUR' | 'HUF' = profile.currency
  if (countryCode === 'sk' || countryCode === 'at') currency = 'EUR'
  else if (countryCode === 'hu' && currency === 'HUF' && !market.huHufPaymentsEnabled) {
    currency = 'EUR'
  }

  return {
    countryCode,
    profile,
    availableLocales: profile.availableLocales,
    defaultLocale: profile.defaultLocale,
    currency,
    taxRatePercent: resolveCatalogTaxRatePercent(
      market.deliveryCountryCatalog,
      rateCountry,
      null,
      fallback,
    ),
    taxIncluded: taxIncludedFromPriceBasis(market.priceBasis),
    eurToHufRate: market.eurToHufRate,
    applyDestinationVatB2c: market.applyDestinationVatB2c,
    sellerTaxRatePercent: market.sellerTaxRatePercent,
  }
}
