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
 * Presentment-only money format. HU HUF mode must not show a secondary EUR amount
 * in parentheses (owner lock). `eurAmount` is kept for call-site compatibility.
 */
export function formatMoneyAmountWithEurParen(
  displayAmount: number,
  displayCurrency: Pick<CurrencyInfo, 'code' | 'symbol' | 'decimals'>,
  _eurAmount: number,
  locale: string,
): string {
  return formatMoneyAmount(displayAmount, displayCurrency, locale)
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
