'use client'

import { createContext, useContext } from 'react'

import type { VatDisplayPolicy } from '@/lib/pricing/vat-price'
import { DEFAULT_MARKET_SETTINGS } from '@/lib/settings/market'

const DEFAULT_VAT_DISPLAY_POLICY: VatDisplayPolicy = {
  priceBasis: DEFAULT_MARKET_SETTINGS.priceBasis,
  storefrontPrimaryPrice: DEFAULT_MARKET_SETTINGS.storefrontPrimaryPrice,
  storefrontShowExVatSecondary: DEFAULT_MARKET_SETTINGS.storefrontShowExVatSecondary,
  taxRatePercent: 0,
}

const VatDisplayContext = createContext<VatDisplayPolicy>(DEFAULT_VAT_DISPLAY_POLICY)

export function VatDisplayProvider({
  value,
  children,
}: {
  value: VatDisplayPolicy
  children: React.ReactNode
}) {
  return <VatDisplayContext.Provider value={value}>{children}</VatDisplayContext.Provider>
}

export function useVatDisplayPolicy(): VatDisplayPolicy {
  return useContext(VatDisplayContext)
}
