'use client'

import { useLocale } from 'next-intl'
import { createContext, useContext } from 'react'

import { DEFAULT_COMMERCE_SETTINGS } from '@/lib/commerce/defaults'
import type { CurrencyInfo, PublicCommerceSettings, UnitOfMeasureInfo } from '@/lib/commerce/types'
import { resolveUnitDisplaySymbol } from '@/lib/commerce/unit-display-symbol'

const CommerceContext = createContext<PublicCommerceSettings>(DEFAULT_COMMERCE_SETTINGS)

export function CommerceProvider({
  value,
  children,
}: {
  value: PublicCommerceSettings
  children: React.ReactNode
}) {
  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
}

export function useCommerceSettings() {
  return useContext(CommerceContext)
}

export function useDefaultCurrency(): CurrencyInfo {
  return useCommerceSettings().defaultCurrency
}

export function useDefaultSalesUnit(): UnitOfMeasureInfo {
  return useCommerceSettings().defaultSalesUnit
}

/** Locale-aware customer-facing unit symbol (internal unit identity unchanged). */
export function useUnitSymbol(unitSymbol?: string | null): string {
  const locale = useLocale()
  const { defaultSalesUnit } = useCommerceSettings()
  return resolveUnitDisplaySymbol(unitSymbol?.trim() || defaultSalesUnit.symbol, locale)
}
