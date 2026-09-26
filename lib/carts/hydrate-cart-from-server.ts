import { fetchServerCart } from '@/lib/carts/api'
import { serverLinesToCartItems } from '@/lib/carts/types'
import { refreshCartItemPlants } from '@/lib/cart-refresh'
import { normalizeCartItems } from '@/lib/cart-normalize'
import { useCartStore } from '@/lib/cart-store'

/**
 * Authoritative Cart hydrate. Always pauses server sync so replaceItems
 * does not schedule a PUT echo.
 */
export async function hydrateCartFromServer(): Promise<void> {
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
