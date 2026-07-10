'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MIN_ITEMS = 4
const MAX_ITEMS = 50

function clampMaxItems(maxItems: number) {
  return Math.min(MAX_ITEMS, Math.max(MIN_ITEMS, Math.round(maxItems) || 12))
}

export const RECENTLY_VIEWED_STORAGE_VERSION = 1

type RecentlyViewedStore = {
  productIds: string[]
  recordView: (productId: string, maxItems?: number) => void
  trimToMaxItems: (maxItems: number) => void
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      recordView: (productId, maxItems = 12) => {
        const cap = clampMaxItems(maxItems)
        const ids = get().productIds.filter((id) => id !== productId)
        set({ productIds: [productId, ...ids].slice(0, cap) })
      },

      trimToMaxItems: (maxItems) => {
        const cap = clampMaxItems(maxItems)
        const ids = get().productIds
        if (ids.length <= cap) return
        set({ productIds: ids.slice(0, cap) })
      },
    }),
    {
      name: 'zeleni-yangoly-recently-viewed',
      version: RECENTLY_VIEWED_STORAGE_VERSION,
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
)

export function useRecentlyViewedIds() {
  return useRecentlyViewedStore((state) => state.productIds)
}

export function useRecordProductView() {
  return useRecentlyViewedStore((state) => state.recordView)
}

type RecentlyViewedSettingsLoader = () => Promise<{ enabled: boolean; maxItems: number }>

let loadSettingsForTracking: RecentlyViewedSettingsLoader = async () => ({
  enabled: true,
  maxItems: 12,
})

export function registerRecentlyViewedSettingsLoader(loader: RecentlyViewedSettingsLoader) {
  loadSettingsForTracking = loader
}

export function useTrackProductView(productId: string) {
  const recordView = useRecentlyViewedStore((state) => state.recordView)
  const trimToMaxItems = useRecentlyViewedStore((state) => state.trimToMaxItems)

  useEffect(() => {
    let cancelled = false

    void loadSettingsForTracking().then((settings) => {
      if (cancelled || !settings.enabled) return
      trimToMaxItems(settings.maxItems)
      recordView(productId, settings.maxItems)
    })

    return () => {
      cancelled = true
    }
  }, [productId, recordView, trimToMaxItems])
}
