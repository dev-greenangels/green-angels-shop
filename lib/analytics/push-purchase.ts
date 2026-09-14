import {
  resolveCheckoutResultState,
  type CheckoutResultOrderInput,
} from '@/lib/checkout/checkout-result-state'

/** sessionStorage key prefix — one entry per transaction_id within the tab session. */
export const GTM_PURCHASE_SESSION_PREFIX = 'ga-gtm-purchase:'

export type PurchaseTrackingOrder = CheckoutResultOrderInput & {
  orderNumber: string
  totalAmount: number
  currency: string
}

export type PurchaseDataLayerPayload = {
  event: 'purchase'
  transaction_id: string
  value: number
  currency: string
}

type DataLayerWindow = Window & {
  dataLayer?: unknown[]
}

/**
 * Gating for Google Ads / GTM purchase conversion.
 * Stripe: PAYMENT_SUCCESS or paymentStatus === 'success' (never cancelled/unpaid states).
 * Bank transfer / COD / pay-on-pickup: ORDER_RECEIVED.
 */
export function shouldFirePurchaseEvent(order: PurchaseTrackingOrder): boolean {
  const transactionId = order.orderNumber?.trim()
  if (!transactionId) return false

  const state = resolveCheckoutResultState(order)

  if (
    state === 'ORDER_CANCELLED' ||
    state === 'PAYMENT_NOT_COMPLETED' ||
    state === 'PAYMENT_FAILED' ||
    state === 'PAYMENT_PROCESSING'
  ) {
    return false
  }

  if (state === 'PAYMENT_SUCCESS' || order.paymentStatus === 'success') {
    return true
  }

  return state === 'ORDER_RECEIVED'
}

export function buildPurchasePayload(order: PurchaseTrackingOrder): PurchaseDataLayerPayload {
  return {
    event: 'purchase',
    transaction_id: order.orderNumber.trim(),
    value: order.totalAmount,
    currency: order.currency,
  }
}

export function gtmPurchaseSessionKey(transactionId: string): string {
  return `${GTM_PURCHASE_SESSION_PREFIX}${transactionId.trim()}`
}

function hasPurchaseBeenFired(transactionId: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.sessionStorage.getItem(gtmPurchaseSessionKey(transactionId)) === '1'
  } catch {
    return false
  }
}

function markPurchaseFired(transactionId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(gtmPurchaseSessionKey(transactionId), '1')
  } catch {
    // Private mode / quota — Ads transaction_id dedupe remains the safety net.
  }
}

/**
 * Client-only: push a minimal non-PII purchase event once per transaction_id per tab session.
 * Returns true when a push was performed.
 */
export function pushPurchaseEventIfEligible(order: PurchaseTrackingOrder): boolean {
  if (typeof window === 'undefined') return false
  if (!shouldFirePurchaseEvent(order)) return false

  const payload = buildPurchasePayload(order)
  if (hasPurchaseBeenFired(payload.transaction_id)) return false

  const w = window as DataLayerWindow
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push(payload)
  markPurchaseFired(payload.transaction_id)
  return true
}

/** Split checkout: one gated push per verified order. */
export function pushPurchaseEventsForOrders(orders: PurchaseTrackingOrder[]): void {
  for (const order of orders) {
    pushPurchaseEventIfEligible(order)
  }
}
