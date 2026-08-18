'use client'

import { createContext, useContext } from 'react'

import type { MarketRegion } from '@/lib/settings/market'

const MarketRegionContext = createContext<MarketRegion>('ua')

export function MarketRegionProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: MarketRegion
}) {
  return <MarketRegionContext.Provider value={value}>{children}</MarketRegionContext.Provider>
}

export function useMarketRegion(): MarketRegion {
  return useContext(MarketRegionContext)
}
