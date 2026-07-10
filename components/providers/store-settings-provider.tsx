'use client'

import { createContext, useContext } from 'react'

import { UNAVAILABLE_STORE_SETTINGS } from '@/lib/settings/defaults'
import type { StoreContactSettings } from '@/lib/settings/types'

type StoreSettingsState = {
  store: StoreContactSettings
  unavailable: boolean
}

const StoreSettingsContext = createContext<StoreSettingsState>({
  store: UNAVAILABLE_STORE_SETTINGS,
  unavailable: false,
})

export function StoreSettingsProvider({
  store,
  unavailable = false,
  children,
}: {
  store: StoreContactSettings
  unavailable?: boolean
  children: React.ReactNode
}) {
  return (
    <StoreSettingsContext.Provider value={{ store, unavailable }}>
      {children}
    </StoreSettingsContext.Provider>
  )
}

export function useStoreSettings(): StoreContactSettings {
  return useContext(StoreSettingsContext).store
}

export function useStoreSettingsUnavailable(): boolean {
  return useContext(StoreSettingsContext).unavailable
}
