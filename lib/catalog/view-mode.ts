'use client'

import { useCallback, useEffect, useState } from 'react'

export type CatalogViewMode = 'grid' | 'list'

const STORAGE_KEY = 'green-angels-catalog-view-mode'

export function getStoredCatalogViewMode(): CatalogViewMode {
  if (typeof window === 'undefined') return 'grid'

  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'grid' || value === 'list') return value
  } catch {
    // ignore storage errors
  }

  return 'grid'
}

export function useCatalogViewMode() {
  const [viewMode, setViewModeState] = useState<CatalogViewMode>('grid')

  useEffect(() => {
    setViewModeState(getStoredCatalogViewMode())
  }, [])

  const setViewMode = useCallback((mode: CatalogViewMode) => {
    setViewModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore storage errors
    }
  }, [])

  return { viewMode, setViewMode }
}
