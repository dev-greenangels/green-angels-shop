'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import {
  addFavorite,
  fetchFavoriteIds,
  mergeFavorites,
  removeFavorite,
} from '@/lib/favorites/api'

export const FAVORITES_STORAGE_VERSION = 1

type FavoritesStore = {
  productIds: string[]
  toggle: (productId: string, userId?: string) => Promise<void>
  setProductIds: (productIds: string[]) => void
  /** Keep only IDs that still exist in catalog; optionally sync removals to server. */
  pruneToExisting: (existingIds: string[], userId?: string) => Promise<string[]>
  loadFromServer: () => Promise<void>
  mergeGuestWithServer: (userId: string) => Promise<void>
  isFavorite: (productId: string) => boolean
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      isFavorite: (productId) => get().productIds.includes(productId),

      setProductIds: (productIds) => set({ productIds }),

      pruneToExisting: async (existingIds, userId) => {
        const existing = new Set(existingIds)
        const current = get().productIds
        const next = current.filter((id) => existing.has(id))
        const removed = current.filter((id) => !existing.has(id))
        if (!removed.length) return current

        set({ productIds: next })

        if (userId) {
          await Promise.allSettled(
            removed.map((productId) =>
              fetch(`/api/favorites/${encodeURIComponent(productId)}`, {
                method: 'DELETE',
                credentials: 'include',
              }),
            ),
          )
        }

        return next
      },

      loadFromServer: async () => {
        const ids = await fetchFavoriteIds()
        set({ productIds: ids })
      },

      mergeGuestWithServer: async (userId) => {
        if (!userId) return
        const localIds = get().productIds
        const merged = localIds.length ? await mergeFavorites(localIds) : await fetchFavoriteIds()
        set({ productIds: merged })
      },

      toggle: async (productId, userId) => {
        const current = get().productIds
        const isFavorite = current.includes(productId)
        const optimistic = isFavorite
          ? current.filter((id) => id !== productId)
          : [productId, ...current]

        set({ productIds: optimistic })

        if (!userId) return

        try {
          const next = isFavorite
            ? await removeFavorite(productId)
            : await addFavorite(productId)
          set({ productIds: next })
        } catch {
          set({ productIds: current })
          throw new Error(isFavorite ? 'Не вдалося прибрати з обраного.' : 'Не вдалося додати до обраного.')
        }
      },
    }),
    {
      name: 'zeleni-yangoly-favorites',
      version: FAVORITES_STORAGE_VERSION,
      partialize: (state) => ({ productIds: state.productIds }),
    },
  ),
)

export function useFavoriteIds() {
  return useFavoritesStore((state) => state.productIds)
}

export function useFavoritesCount() {
  return useFavoritesStore((state) => state.productIds.length)
}

export function useFavoriteActions() {
  return useFavoritesStore(
    useShallow((state) => ({
      toggle: state.toggle,
      isFavorite: state.isFavorite,
      loadFromServer: state.loadFromServer,
      mergeGuestWithServer: state.mergeGuestWithServer,
      pruneToExisting: state.pruneToExisting,
    })),
  )
}
