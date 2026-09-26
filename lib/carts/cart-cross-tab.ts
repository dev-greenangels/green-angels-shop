/**
 * Lightweight same-origin cross-tab Cart invalidation.
 * Does NOT store cart items / PII — only a signal to re-GET the server Cart.
 */

export const CART_CROSS_TAB_STORAGE_KEY = 'ga-cart-cross-tab'

export type CartCrossTabReason = 'order-completed' | 'cart-merge'

export type CartCrossTabEventV1 = {
  v: 1
  type: 'invalidate'
  at: number
  reason: CartCrossTabReason
}

export type CartCrossTabEvent = CartCrossTabEventV1

export function parseCartCrossTabEvent(raw: string | null | undefined): CartCrossTabEvent | null {
  if (!raw || typeof raw !== 'string') return null
  try {
    const data = JSON.parse(raw) as Partial<CartCrossTabEventV1>
    if (data?.v !== 1) return null
    if (data.type !== 'invalidate') return null
    if (typeof data.at !== 'number' || !Number.isFinite(data.at)) return null
    if (data.reason !== 'order-completed' && data.reason !== 'cart-merge') return null
    return {
      v: 1,
      type: 'invalidate',
      at: data.at,
      reason: data.reason,
    }
  } catch {
    return null
  }
}

/**
 * Publish invalidation for other same-origin tabs (`storage` event).
 * Same-tab writers do not receive `storage` — they already update locally.
 */
export function publishCartCrossTabInvalidate(reason: CartCrossTabReason): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  const event: CartCrossTabEventV1 = {
    v: 1,
    type: 'invalidate',
    at: Date.now(),
    reason,
  }
  const serialized = JSON.stringify(event)
  try {
    // Force a storage event even if payload text collides within the same ms.
    window.localStorage.removeItem(CART_CROSS_TAB_STORAGE_KEY)
    window.localStorage.setItem(CART_CROSS_TAB_STORAGE_KEY, serialized)
  } catch {
    // Private mode / quota — cross-tab sync soft-fails; server remains authoritative.
  }
}
