import type { CurrencyInfo } from '@/lib/commerce/types'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'

export function formatMoneyAmount(
  amount: number,
  currency: Pick<CurrencyInfo, 'code' | 'symbol' | 'decimals'>,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(intlLocaleForApp(locale), {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(amount)
  } catch {
    const formatted = amount.toLocaleString(intlLocaleForApp(locale), {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    })
    return `${formatted} ${currency.symbol}`
  }
}

export function formatPerUnitPrice(
  amount: number,
  currency: Pick<CurrencyInfo, 'code' | 'symbol' | 'decimals'>,
  locale: string,
  unitSymbol: string,
): string {
  return `${formatMoneyAmount(amount, currency, locale)}/${unitSymbol}`
}
