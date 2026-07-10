import type { CurrencyInfo } from '@/lib/commerce/types'
import { DEFAULT_CURRENCY } from '@/lib/commerce/defaults'
import { formatMoneyAmount } from '@/lib/commerce/format'

export function intlLocaleForApp(locale: string): string {
  if (locale === 'en') return 'en-GB'
  if (locale === 'sk') return 'sk-SK'
  return 'uk-UA'
}

export function formatPrice(
  amount: number,
  locale: string = 'uk',
  currency: Pick<CurrencyInfo, 'code' | 'symbol' | 'decimals'> = DEFAULT_CURRENCY,
): string {
  return formatMoneyAmount(amount, currency, locale)
}

export function formatNumberForLocale(value: number, locale: string): string {
  return value.toLocaleString(intlLocaleForApp(locale))
}

/** @deprecated Use formatPrice with commerce currency */
export function formatPriceForLocale(amount: number, locale: string = 'uk'): string {
  return formatPrice(amount, locale, DEFAULT_CURRENCY)
}

/** @deprecated Use commerce provider default currency */
export function currencySymbolForLocale(_locale: string): string {
  return DEFAULT_CURRENCY.symbol
}
