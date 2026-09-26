import { syncServerCart } from '@/lib/carts/api'
import { publishCartCrossTabInvalidate } from '@/lib/carts/cart-cross-tab'
import { bumpCartServerSyncEpoch } from '@/lib/carts/cart-server-sync'
import { bumpCheckoutDraftPersistEpoch } from '@/lib/carts/checkout-draft-persist-control'
import { useCartStore } from '@/lib/cart-store'

/**
 * Clears guest/user cart in local UI after order create.
 * Nest already empties the server Cart after successful CreateOrder;
 * syncServerCart([]) remains a soft idempotent belt-and-suspenders.
 * Publishes cross-tab invalidation so other tabs re-GET the server Cart.
 */
export async function clearCartAfterCheckout(): Promise<void> {
  const store = useCartStore.getState()
  bumpCartServerSyncEpoch()
  bumpCheckoutDraftPersistEpoch()
  store.setServerSyncPaused(true)
  try {
    store.clearCart()
    await syncServerCart([]).catch(() => {
      // Soft-fail: local cart is already empty; server should already be clear.
    })
    publishCartCrossTabInvalidate('order-completed')
  } finally {
    store.setServerSyncPaused(false)
  }
}
