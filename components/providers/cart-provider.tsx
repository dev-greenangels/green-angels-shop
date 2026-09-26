'use client'

import { useSession } from '@/components/providers/session-provider'
import { CartMergeDialog } from '@/components/cart/cart-merge-dialog'
import { UrlLocaleIntlProvider } from '@/components/localization/url-locale-intl-provider'
import {
  applyCartMerge,
  fetchCartMergePreview,
} from '@/lib/carts/api'
import {
  CART_CROSS_TAB_STORAGE_KEY,
  parseCartCrossTabEvent,
  publishCartCrossTabInvalidate,
} from '@/lib/carts/cart-cross-tab'
import { bumpCheckoutDraftPersistEpoch } from '@/lib/carts/checkout-draft-persist-control'
import { hydrateCartFromServer } from '@/lib/carts/hydrate-cart-from-server'
import {
  bumpCartServerSyncEpoch,
  cancelPendingCartServerSync,
  scheduleCartServerSync,
} from '@/lib/carts/cart-server-sync'
import { useCartStore } from '@/lib/cart-store'
import type { CartMergePreview } from '@/lib/carts/types'
import { useEffect, useRef, useState } from 'react'

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
    publishCartCrossTabInvalidate('cart-merge')
  }

  await hydrateCartFromServer()
}

/**
 * Cross-tab invalidate: cancel pending writes, then GET authoritative Cart.
 * Never blind-clear — server may already hold a legitimate new cart.
 */
async function handleCartCrossTabInvalidate(at: number, lastProcessedAt: { current: number }) {
  if (at <= lastProcessedAt.current) return
  lastProcessedAt.current = at

  // Cancel debounced PUT + invalidate in-flight sync completions before GET.
  bumpCartServerSyncEpoch()
  bumpCheckoutDraftPersistEpoch()
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
  const lastCrossTabAtRef = useRef(0)

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

      scheduleCartServerSync(state.items, {
        isBlocked: () => !isAuthenticatedRef.current && skipGuestServerSyncRef.current,
      })
    })

    return () => {
      unsubscribe()
      cancelPendingCartServerSync()
    }
  }, [])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return
      if (event.key !== CART_CROSS_TAB_STORAGE_KEY) return
      if (event.newValue == null) return
      const parsed = parseCartCrossTabEvent(event.newValue)
      if (!parsed) return
      void handleCartCrossTabInvalidate(parsed.at, lastCrossTabAtRef)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const userId = user?.id

    if (!userId) {
      const wasLoggedIn = previousUserIdRef.current !== undefined
      previousUserIdRef.current = undefined

      if (wasLoggedIn) {
        skipGuestServerSyncRef.current = true
        guestHydratedRef.current = false
        cancelPendingCartServerSync()
        bumpCartServerSyncEpoch()
        const store = useCartStore.getState()
        store.setServerSyncPaused(true)
        store.replaceItems([])
        store.setServerSyncPaused(false)
        // No cross-tab logout broadcast — other tabs may still be authenticated via cookie.
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
        cancelPendingCartServerSync()
        bumpCartServerSyncEpoch()
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
      publishCartCrossTabInvalidate('cart-merge')
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
