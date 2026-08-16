import { syncServerCart } from '@/lib/carts/api'
import { useCartStore } from '@/lib/cart-store'

/**
 * Clears guest/user cart locally and on the server.
 * Needed after order create: otherwise CartProvider re-hydrates old server cart
 * (especially after full-page Mono redirect) and /checkout shows paid items again.
 */
export async function clearCartAfterCheckout(): Promise<void> {
  const store = useCartStore.getState()
  store.setServerSyncPaused(true)
  try {
    store.clearCart()
    await syncServerCart([]).catch(() => {
      // Soft-fail: local cart is already empty; next hydrate may still restore if sync fails.
    })
  } finally {
    store.setServerSyncPaused(false)
  }
}
