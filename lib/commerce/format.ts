import type { CurrencyInfo } from '@/lib/commerce/types'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'

const EUR_CURRENCY = { code: 'EUR', symbol: '€', decimals: 2 } as const

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

/** Digits only — for compact filter steppers where symbol is shown in the section title. */
export function formatMoneyAmountDigits(
  amount: number,
  decimals: number,
  locale: string,
): string {
  return new Intl.NumberFormat(intlLocaleForApp(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

/**
 * When display currency is not EUR, append the EUR amount in parentheses.
 * `eurAmount` must be the pre-FX amount already in EUR.
 */
export function formatMoneyAmountWithEurParen(
  displayAmount: number,
  displayCurrency: Pick<CurrencyInfo, 'code' | 'symbol' | 'decimals'>,
  eurAmount: number,
  locale: string,
): string {
  const primary = formatMoneyAmount(displayAmount, displayCurrency, locale)
  if (displayCurrency.code.toUpperCase() === 'EUR') return primary
  const eur = formatMoneyAmount(eurAmount, EUR_CURRENCY, locale)
  return `${primary} (${eur})`
}

export function formatPerUnitPrice(
  amount: number,
  currency: Pick<CurrencyInfo, 'code' | 'symbol' | 'decimals'>,
  locale: string,
  unitSymbol: string,
): string {
  return `${formatMoneyAmount(amount, currency, locale)}/${unitSymbol}`
}

export function formatPerUnitPriceWithEurParen(
  displayAmount: number,
  displayCurrency: Pick<CurrencyInfo, 'code' | 'symbol' | 'decimals'>,
  eurAmount: number,
  locale: string,
  unitSymbol: string,
): string {
  return `${formatMoneyAmountWithEurParen(displayAmount, displayCurrency, eurAmount, locale)}/${unitSymbol}`
}
