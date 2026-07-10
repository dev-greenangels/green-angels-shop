'use client'

import { useEffect, useRef } from 'react'

import { useSession } from '@/components/providers/session-provider'
import { useFavoritesStore } from '@/lib/favorites-store'

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession()
  const mergeGuestWithServer = useFavoritesStore((state) => state.mergeGuestWithServer)
  const previousUserId = useRef<string | undefined>(undefined)

  useEffect(() => {
    const userId = user?.id
    if (!userId) {
      previousUserId.current = undefined
      return
    }

    if (previousUserId.current === userId) return
    previousUserId.current = userId

    void mergeGuestWithServer(userId).catch(() => {
      // Залишаємо локальний список, якщо синхронізація не вдалась.
    })
  }, [user?.id, mergeGuestWithServer])

  return children
}
