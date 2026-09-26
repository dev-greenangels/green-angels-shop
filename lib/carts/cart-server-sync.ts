/**
 * Debounced Cart PUT control + generation so cross-tab invalidation can
 * cancel pending sync and ignore obsolete in-flight completions.
 */

import { syncServerCart } from '@/lib/carts/api'
import { hydrateCartFromServer } from '@/lib/carts/hydrate-cart-from-server'
import type { CartItem } from '@/lib/types'

const CART_SYNC_DEBOUNCE_MS = 700

let syncEpoch = 0
let pendingTimer: ReturnType<typeof setTimeout> | null = null
let inFlight = 0

export function getCartServerSyncEpoch(): number {
  return syncEpoch
}

/** Cancels debounced PUT and invalidates in-flight sync completions. */
export function bumpCartServerSyncEpoch(): number {
  cancelPendingCartServerSync()
  syncEpoch += 1
  return syncEpoch
}

export function cancelPendingCartServerSync(): void {
  if (pendingTimer != null) {
    clearTimeout(pendingTimer)
    pendingTimer = null
  }
}

export function scheduleCartServerSync(
  items: CartItem[],
  options?: {
    isBlocked?: () => boolean
  },
): void {
  cancelPendingCartServerSync()
  const epochAtSchedule = syncEpoch
  const snapshot = items
  pendingTimer = setTimeout(() => {
    pendingTimer = null
    if (epochAtSchedule !== syncEpoch) return
    if (options?.isBlocked?.()) return
    void runCartServerSync(snapshot, epochAtSchedule)
  }, CART_SYNC_DEBOUNCE_MS)
}

async function runCartServerSync(items: CartItem[], epochAtStart: number): Promise<void> {
  if (epochAtStart !== syncEpoch) return
  inFlight += 1
  try {
    await syncServerCart(items)
  } catch {
    // Soft-fail: UI remains local; next hydrate/sync recovers.
  } finally {
    inFlight = Math.max(0, inFlight - 1)
    // In-flight stale PUT may have completed after a newer invalidation.
    // Re-assert server authority once.
    if (epochAtStart !== syncEpoch) {
      void hydrateCartFromServer().catch(() => {})
    }
  }
}

export function getCartServerSyncInFlightCount(): number {
  return inFlight
}

export { CART_SYNC_DEBOUNCE_MS }
