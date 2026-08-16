'use client'

import { createContext, useContext } from 'react'

import type { CountrySiteOverlay } from '@/lib/country-sites/apply-overlay'

const CountrySiteContext = createContext<CountrySiteOverlay | null>(null)

export function CountrySiteProvider({
  value,
  children,
}: {
  value: CountrySiteOverlay | null
  children: React.ReactNode
}) {
  return <CountrySiteContext.Provider value={value}>{children}</CountrySiteContext.Provider>
}

export function useCountrySiteOverlay(): CountrySiteOverlay | null {
  return useContext(CountrySiteContext)
}
