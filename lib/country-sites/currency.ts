import type { CountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import type { CurrencyInfo, PublicCommerceSettings } from '@/lib/commerce/types'
import type { LocalizationSettings } from '@/lib/i18n/locales'

export const HUF_CURRENCY: CurrencyInfo = {
  code: 'HUF',
  symbol: 'Ft',
  decimals: 0,
  name: 'Hungarian forint',
  isoNumericCode: 348,
  isActive: true,
  sortOrder: 5,
  translations: [
    { locale: 'uk', name: 'Форинт' },
    { locale: 'en', name: 'Hungarian forint' },
    { locale: 'sk', name: 'Maďarský forint' },
    { locale: 'hu', name: 'Magyar forint' },
    { locale: 'de', name: 'Ungarischer Forint' },
  ],
}

export const EUR_CURRENCY_FALLBACK: CurrencyInfo = {
  code: 'EUR',
  symbol: '€',
  decimals: 2,
  name: 'Euro',
  isoNumericCode: 978,
  isActive: true,
  sortOrder: 2,
  translations: [
    { locale: 'uk', name: 'Євро' },
    { locale: 'en', name: 'Euro' },
    { locale: 'sk', name: 'Euro' },
    { locale: 'hu', name: 'Euró' },
    { locale: 'de', name: 'Euro' },
  ],
}

export function convertEurToHuf(amountEur: number, rate: number): number {
  const r = rate > 0 ? rate : 400
  return Math.round(amountEur * r)
}

export function applyLocalizationOverlay(
  localization: LocalizationSettings,
  overlay: CountrySiteOverlay | null,
): LocalizationSettings {
  if (!overlay) return localization
  return {
    ...localization,
    availableLocales: overlay.availableLocales,
    showLanguageSwitcher: localization.showLanguageSwitcher,
    showFaqInFooter: localization.showFaqInFooter,
  }
}

export function applyCommerceCurrencyOverlay(
  commerce: PublicCommerceSettings,
  overlay: CountrySiteOverlay | null,
): PublicCommerceSettings {
  if (!overlay) return commerce

  if (overlay.currency === 'HUF') {
    const huf =
      commerce.currencies.find((c) => c.code === 'HUF') ?? HUF_CURRENCY
    return {
      ...commerce,
      defaultCurrency: huf,
      currencies: commerce.currencies.some((c) => c.code === 'HUF')
        ? commerce.currencies
        : [...commerce.currencies, huf],
    }
  }

  const eur =
    commerce.currencies.find((c) => c.code === 'EUR') ??
    (commerce.defaultCurrency.code === 'EUR' ? commerce.defaultCurrency : EUR_CURRENCY_FALLBACK)

  return {
    ...commerce,
    defaultCurrency: eur,
  }
}
