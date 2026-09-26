/**
 * Pending checkoutDraft PATCH cancellation for cross-tab invalidation.
 */

let draftEpoch = 0
let pendingTimer: ReturnType<typeof setTimeout> | null = null

export function getCheckoutDraftPersistEpoch(): number {
  return draftEpoch
}

export function bumpCheckoutDraftPersistEpoch(): number {
  cancelPendingCheckoutDraftPersist()
  draftEpoch += 1
  return draftEpoch
}

export function cancelPendingCheckoutDraftPersist(): void {
  if (pendingTimer != null) {
    clearTimeout(pendingTimer)
    pendingTimer = null
  }
}

export function scheduleCheckoutDraftPersist(
  delayMs: number,
  run: () => void | Promise<void>,
): void {
  cancelPendingCheckoutDraftPersist()
  const epochAtSchedule = draftEpoch
  pendingTimer = setTimeout(() => {
    pendingTimer = null
    if (epochAtSchedule !== draftEpoch) return
    void run()
  }, delayMs)
}
