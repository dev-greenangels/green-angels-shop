'use client'

import { useEffect, useRef } from 'react'

import { useSession } from '@/components/providers/session-provider'
import { useFavoritesStore } from '@/lib/favorites-store'
import type { CatalogProductListItem } from '@/lib/catalog/types'

function parseCatalogProductsPayload(data: unknown): CatalogProductListItem[] {
  if (Array.isArray(data)) return data as CatalogProductListItem[]
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: CatalogProductListItem[] }).items
  }
  return []
}

/** Drop local favorite IDs that no longer exist (or are unpublished) in the catalog. */
async function reconcileLocalFavorites(userId?: string): Promise<void> {
  const ids = useFavoritesStore.getState().productIds
  if (!ids.length) return

  try {
    const res = await fetch(`/api/catalog/products?ids=${encodeURIComponent(ids.join(','))}`, {
      cache: 'no-store',
    })
    if (!res.ok) return
    const rows = parseCatalogProductsPayload(await res.json())
    const existingIds = rows.map((row) => row.id).filter(Boolean)
    await useFavoritesStore.getState().pruneToExisting(existingIds, userId)
  } catch {
    // Keep local list if catalog is temporarily unreachable.
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession()
  const mergeGuestWithServer = useFavoritesStore((state) => state.mergeGuestWithServer)
  const previousUserId = useRef<string | undefined>(undefined)
  const reconciledGuest = useRef(false)

  useEffect(() => {
    const run = () => {
      const userId = user?.id
      if (!userId) {
        previousUserId.current = undefined
        if (reconciledGuest.current) return
        reconciledGuest.current = true
        void reconcileLocalFavorites(undefined)
        return
      }

      if (previousUserId.current === userId) return
      previousUserId.current = userId

      void mergeGuestWithServer(userId)
        .catch(() => {
          // Залишаємо локальний список, якщо синхронізація не вдалась.
        })
        .finally(() => {
          void reconcileLocalFavorites(userId)
        })
    }

    const unsub = useFavoritesStore.persist.onFinishHydration(run)
    if (useFavoritesStore.persist.hasHydrated()) {
      run()
    }
    return unsub
  }, [user?.id, mergeGuestWithServer])

  return children
}
