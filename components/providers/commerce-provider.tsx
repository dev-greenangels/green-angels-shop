'use client'

import { createContext, useContext } from 'react'

import { DEFAULT_COMMERCE_SETTINGS } from '@/lib/commerce/defaults'
import type { CurrencyInfo, PublicCommerceSettings, UnitOfMeasureInfo } from '@/lib/commerce/types'

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

export function useUnitSymbol(unitSymbol?: string | null): string {
  const { defaultSalesUnit } = useCommerceSettings()
  return unitSymbol?.trim() || defaultSalesUnit.symbol
}
