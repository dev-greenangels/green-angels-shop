'use client'

import { useSession } from '@/components/providers/session-provider'
import { CartMergeDialog } from '@/components/cart/cart-merge-dialog'
import { UrlLocaleIntlProvider } from '@/components/localization/url-locale-intl-provider'
import {
  applyCartMerge,
  fetchCartMergePreview,
  fetchServerCart,
  syncServerCart,
} from '@/lib/carts/api'
import { serverLinesToCartItems } from '@/lib/carts/types'
import { refreshCartItemPlants } from '@/lib/cart-refresh'
import { normalizeCartItems } from '@/lib/cart-normalize'
import { useCartStore } from '@/lib/cart-store'
import type { CartMergePreview } from '@/lib/carts/types'
import { useEffect, useRef, useState } from 'react'

async function hydrateCartFromServer() {
  const store = useCartStore.getState()
  store.setServerSyncPaused(true)
  try {
    const lines = await fetchServerCart()
    const partial = serverLinesToCartItems(lines)
    const refreshed = partial.length ? await refreshCartItemPlants(partial) : []
    store.replaceItems(normalizeCartItems(refreshed))
  } finally {
    store.setServerSyncPaused(false)
    store.setHasHydratedFromServer(true)
  }
}

async function resolveAuthenticatedCart(
  setMergePreview: (preview: CartMergePreview) => void,
  setMergeOpen: (open: boolean) => void,
) {
  const preview = await fetchCartMergePreview()
  if (!preview) {
    await hydrateCartFromServer()
    return
  }

  if (preview.hasConflict) {
    setMergePreview(preview)
    setMergeOpen(true)
    return
  }

  if (preview.guestItems.length > 0 && preview.userItems.length === 0) {
    await applyCartMerge('keep_guest')
  }

  await hydrateCartFromServer()
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession()
  const [mergePreview, setMergePreview] = useState<CartMergePreview | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeLoading, setMergeLoading] = useState(false)
  const previousUserIdRef = useRef<string | undefined>(undefined)
  const guestHydratedRef = useRef(false)
  const skipGuestServerSyncRef = useRef(false)
  const isAuthenticatedRef = useRef(false)
  const syncTimerRef = useRef<number | null>(null)

  useEffect(() => {
    isAuthenticatedRef.current = Boolean(user?.id)
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = useCartStore.subscribe((state, prev) => {
      if (state.serverSyncPaused || state.items === prev.items) return

      if (!isAuthenticatedRef.current && skipGuestServerSyncRef.current && state.items.length > 0) {
        skipGuestServerSyncRef.current = false
      }

      if (!isAuthenticatedRef.current && skipGuestServerSyncRef.current) return

      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current)
      }

      syncTimerRef.current = window.setTimeout(() => {
        if (!isAuthenticatedRef.current && skipGuestServerSyncRef.current) return
        void syncServerCart(state.items).catch(() => {})
      }, 700)
    })

    return () => {
      unsubscribe()
      if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const userId = user?.id

    if (!userId) {
      const wasLoggedIn = previousUserIdRef.current !== undefined
      previousUserIdRef.current = undefined

      if (wasLoggedIn) {
        skipGuestServerSyncRef.current = true
        guestHydratedRef.current = false
        if (syncTimerRef.current) {
          window.clearTimeout(syncTimerRef.current)
          syncTimerRef.current = null
        }
        const store = useCartStore.getState()
        store.setServerSyncPaused(true)
        store.replaceItems([])
        store.setServerSyncPaused(false)
        return
      }

      skipGuestServerSyncRef.current = false

      if (!guestHydratedRef.current) {
        guestHydratedRef.current = true
        void hydrateCartFromServer()
      }
      return
    }

    skipGuestServerSyncRef.current = false
    guestHydratedRef.current = false

    if (previousUserIdRef.current === userId) return
    previousUserIdRef.current = userId

    void (async () => {
      const store = useCartStore.getState()
      store.setServerSyncPaused(true)
      try {
        if (syncTimerRef.current) {
          window.clearTimeout(syncTimerRef.current)
          syncTimerRef.current = null
        }

        await resolveAuthenticatedCart(setMergePreview, setMergeOpen)
      } finally {
        store.setServerSyncPaused(false)
      }
    })()
  }, [user?.id])

  const handleMergeChoice = async (
    strategy: 'merge' | 'keep_guest' | 'keep_user' | 'clear',
  ) => {
    setMergeLoading(true)
    try {
      await applyCartMerge(strategy)
      await hydrateCartFromServer()
      setMergeOpen(false)
      setMergePreview(null)
    } finally {
      setMergeLoading(false)
    }
  }

  return (
    <>
      {children}
      <UrlLocaleIntlProvider>
        <CartMergeDialog
          open={mergeOpen}
          preview={mergePreview}
          loading={mergeLoading}
          onChoose={handleMergeChoice}
        />
      </UrlLocaleIntlProvider>
    </>
  )
}
