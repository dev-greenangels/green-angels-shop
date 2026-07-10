'use client'

import { createContext, useContext } from 'react'

import { DEFAULT_LOCALIZATION_SETTINGS, type LocalizationSettings } from '@/lib/i18n/locales'

const LocalizationSettingsContext = createContext<LocalizationSettings>(DEFAULT_LOCALIZATION_SETTINGS)

export function LocalizationSettingsProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: LocalizationSettings
}) {
  return (
    <LocalizationSettingsContext.Provider value={value}>
      {children}
    </LocalizationSettingsContext.Provider>
  )
}

export function useLocalizationSettings() {
  return useContext(LocalizationSettingsContext)
}
