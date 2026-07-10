'use client'

import { useLocale } from 'next-intl'
import { useCallback } from 'react'

import { formatMoneyAmount, formatPerUnitPrice } from '@/lib/commerce/format'
import { useCommerceSettings, useDefaultCurrency, useUnitSymbol } from '@/components/providers/commerce-provider'

export function useFormatPrice() {
  const locale = useLocale()
  const currency = useDefaultCurrency()
  return useCallback(
    (amount: number) => formatMoneyAmount(amount, currency, locale),
    [currency, locale],
  )
}

export function useFormatPerUnitPrice(unitSymbol?: string | null) {
  const locale = useLocale()
  const currency = useDefaultCurrency()
  const resolvedUnit = useUnitSymbol(unitSymbol)
  return useCallback(
    (amount: number) => formatPerUnitPrice(amount, currency, locale, resolvedUnit),
    [currency, locale, resolvedUnit],
  )
}

export function useCommerceLists() {
  const { currencies, units } = useCommerceSettings()
  return { currencies, units }
}
