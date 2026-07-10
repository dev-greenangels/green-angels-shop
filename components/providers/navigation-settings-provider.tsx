'use client'

import { createContext, useContext } from 'react'

import { DEFAULT_NAVIGATION_SETTINGS } from '@/lib/settings/navigation'
import type { NavigationSettings } from '@/lib/settings/types'

const NavigationSettingsContext = createContext<NavigationSettings>(DEFAULT_NAVIGATION_SETTINGS)

export function NavigationSettingsProvider({
  navigation,
  children,
}: {
  navigation: NavigationSettings
  children: React.ReactNode
}) {
  return (
    <NavigationSettingsContext.Provider value={navigation}>
      {children}
    </NavigationSettingsContext.Provider>
  )
}

export function useNavigationSettings(): NavigationSettings {
  return useContext(NavigationSettingsContext)
}
