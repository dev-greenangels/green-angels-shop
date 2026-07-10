'use client'

import { createContext, useContext, useMemo } from 'react'

import {
  getCategoryCardsGridClassName,
  getProductCardsGridClassName,
} from '@/lib/catalog/grid-columns'
import { DEFAULT_CATALOG_SETTINGS } from '@/lib/settings/defaults'
import { normalizeCatalogPageSettings } from '@/lib/settings/catalog.normalize'
import type { CatalogPageSettings } from '@/lib/settings/types'

type CatalogSettingsState = {
  catalog: CatalogPageSettings
  productGridClassName: string
  categoryGridClassName: string
}

const CatalogSettingsContext = createContext<CatalogSettingsState>({
  catalog: DEFAULT_CATALOG_SETTINGS,
  productGridClassName: getProductCardsGridClassName(),
  categoryGridClassName: getCategoryCardsGridClassName(),
})

export function CatalogSettingsProvider({
  catalog,
  children,
}: {
  catalog: CatalogPageSettings
  children: React.ReactNode
}) {
  const normalized = useMemo(() => normalizeCatalogPageSettings(catalog), [catalog])
  const value = useMemo(
    () => ({
      catalog: normalized,
      productGridClassName: getProductCardsGridClassName(normalized.productGridColumns),
      categoryGridClassName: getCategoryCardsGridClassName(normalized.categoryGridColumns),
    }),
    [normalized],
  )

  return (
    <CatalogSettingsContext.Provider value={value}>{children}</CatalogSettingsContext.Provider>
  )
}

export function useCatalogSettings(): CatalogPageSettings {
  return useContext(CatalogSettingsContext).catalog
}

export function useProductGridClassName(): string {
  return useContext(CatalogSettingsContext).productGridClassName
}

export function useCategoryGridClassName(): string {
  return useContext(CatalogSettingsContext).categoryGridClassName
}
