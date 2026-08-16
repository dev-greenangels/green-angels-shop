'use client'

import { useLocale } from 'next-intl'
import { useCallback } from 'react'

import { useCountrySiteOverlay } from '@/components/providers/country-site-provider'
import { useVatDisplayPolicy } from '@/components/providers/vat-display-provider'
import {
  formatMoneyAmount,
  formatMoneyAmountWithEurParen,
  formatPerUnitPriceWithEurParen,
} from '@/lib/commerce/format'
import { convertEurToHuf } from '@/lib/country-sites/currency'
import { useCommerceSettings, useDefaultCurrency, useUnitSymbol } from '@/components/providers/commerce-provider'
import { toExVatUnitPrice, toShelfUnitPrice } from '@/lib/pricing/vat-price'

export type FormatPriceMode = 'shelf' | 'raw'

function applyFx(
  amount: number,
  currencyCode: string,
  overlay: ReturnType<typeof useCountrySiteOverlay>,
): number {
  if (overlay?.currency === 'HUF' && currencyCode === 'HUF') {
    return convertEurToHuf(amount, overlay.eurToHufRate)
  }
  return amount
}

function formatPrimary(
  eurAmount: number,
  currency: ReturnType<typeof useDefaultCurrency>,
  locale: string,
  overlay: ReturnType<typeof useCountrySiteOverlay>,
): string {
  const value = applyFx(eurAmount, currency.code, overlay)
  return formatMoneyAmountWithEurParen(value, currency, eurAmount, locale)
}

export function useFormatPrice(mode: FormatPriceMode = 'shelf') {
  const locale = useLocale()
  const currency = useDefaultCurrency()
  const overlay = useCountrySiteOverlay()
  const vat = useVatDisplayPolicy()

  return useCallback(
    (amount: number) => {
      const shelf =
        mode === 'shelf'
          ? toShelfUnitPrice(amount, {
              priceBasis: vat.priceBasis,
              primary: vat.storefrontPrimaryPrice,
              ratePercent: vat.taxRatePercent,
            })
          : amount
      return formatPrimary(shelf, currency, locale, overlay)
    },
    [currency, locale, mode, overlay, vat],
  )
}

export function useFormatPerUnitPrice(
  unitSymbol?: string | null,
  mode: FormatPriceMode = 'shelf',
) {
  const locale = useLocale()
  const currency = useDefaultCurrency()
  const resolvedUnit = useUnitSymbol(unitSymbol)
  const overlay = useCountrySiteOverlay()
  const vat = useVatDisplayPolicy()

  return useCallback(
    (amount: number) => {
      const shelf =
        mode === 'shelf'
          ? toShelfUnitPrice(amount, {
              priceBasis: vat.priceBasis,
              primary: vat.storefrontPrimaryPrice,
              ratePercent: vat.taxRatePercent,
            })
          : amount
      const value = applyFx(shelf, currency.code, overlay)
      return formatPerUnitPriceWithEurParen(value, currency, shelf, locale, resolvedUnit)
    },
    [currency, locale, mode, overlay, resolvedUnit, vat],
  )
}

/** Primary + optional secondary (ex-VAT) amounts after shelf conversion + FX. */
export function useShelfPriceParts() {
  const vat = useVatDisplayPolicy()
  const currency = useDefaultCurrency()
  const overlay = useCountrySiteOverlay()
  const locale = useLocale()

  return useCallback(
    (storedAmount: number) => {
      const primaryShelf = toShelfUnitPrice(storedAmount, {
        priceBasis: vat.priceBasis,
        primary: vat.storefrontPrimaryPrice,
        ratePercent: vat.taxRatePercent,
      })
      const primaryFx = applyFx(primaryShelf, currency.code, overlay)
      const primaryFormatted = formatMoneyAmountWithEurParen(
        primaryFx,
        currency,
        primaryShelf,
        locale,
      )

      let secondaryFormatted: string | null = null
      if (vat.storefrontShowExVatSecondary) {
        const exVat = toExVatUnitPrice(storedAmount, {
          priceBasis: vat.priceBasis,
          ratePercent: vat.taxRatePercent,
        })
        const exFx = applyFx(exVat, currency.code, overlay)
        // Only show secondary when it differs from primary (no EUR paren on ex-VAT line)
        if (Math.abs(exFx - primaryFx) > 0.001) {
          secondaryFormatted = formatMoneyAmount(exFx, currency, locale)
        }
      }

      return {
        primaryFormatted,
        secondaryFormatted,
        showExVatSecondary: Boolean(secondaryFormatted),
      }
    },
    [currency, locale, overlay, vat],
  )
}

export function useCommerceLists() {
  const { currencies, units } = useCommerceSettings()
  return { currencies, units }
}
