/**
 * Storefront checkout result UX — resolved only from confirmed Order fields.
 * URL/query params must never imply PAYMENT_SUCCESS or ORDER_CANCELLED alone.
 */

export type CheckoutResultState =
  | 'ORDER_RECEIVED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_NOT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'ORDER_CANCELLED'

export type CheckoutResultOrderInput = {
  status: string
  paymentMethod: string
  paymentStatus: string | null | undefined
}

export type CheckoutResultChromeTone = 'positive' | 'neutral' | 'warning' | 'destructive'

const CARD_ONLINE = 'card-online'

export function isCardOnlinePaymentMethod(paymentMethod: string): boolean {
  return paymentMethod === CARD_ONLINE
}

export function isBankTransferPaymentMethod(paymentMethod: string): boolean {
  return paymentMethod === 'bank-transfer' || paymentMethod === 'bank-transfer-legal'
}

export function isCodPaymentMethod(paymentMethod: string): boolean {
  return paymentMethod === 'dobierka'
}

/**
 * Authoritative result state from Nest order confirmation (after sync if needed).
 * `payment=cancelled` and other query hints must not be passed here.
 */
export function resolveCheckoutResultState(order: CheckoutResultOrderInput): CheckoutResultState {
  if (order.status === 'CANCELLED') {
    return 'ORDER_CANCELLED'
  }

  if (!isCardOnlinePaymentMethod(order.paymentMethod)) {
    return 'ORDER_RECEIVED'
  }

  const paymentStatus = order.paymentStatus ?? null

  if (paymentStatus === 'success') {
    return 'PAYMENT_SUCCESS'
  }
  if (paymentStatus === 'processing') {
    return 'PAYMENT_PROCESSING'
  }
  if (
    paymentStatus === 'failure' ||
    paymentStatus === 'expired' ||
    paymentStatus === 'reversed'
  ) {
    return 'PAYMENT_FAILED'
  }

  // created | null | unknown — reserved unpaid card order
  return 'PAYMENT_NOT_COMPLETED'
}

/**
 * Query hint `payment=cancelled` is not Order cancellation.
 * It only nudges unpaid/abandoned card UX after backend confirmation.
 */
export function resolveCheckoutResultStateWithPaymentQueryHint(
  order: CheckoutResultOrderInput,
  paymentQueryHint: string | null | undefined,
): CheckoutResultState {
  const state = resolveCheckoutResultState(order)
  if (paymentQueryHint === 'cancelled' && state === 'ORDER_CANCELLED') {
    // Still only cancelled if Nest said so — hint ignored for cancellation.
    return state
  }
  if (paymentQueryHint === 'cancelled' && state === 'PAYMENT_SUCCESS') {
    // Never downgrade a confirmed paid order because of a stale query param.
    return state
  }
  if (
    paymentQueryHint === 'cancelled' &&
    (state === 'PAYMENT_NOT_COMPLETED' ||
      state === 'PAYMENT_FAILED' ||
      state === 'PAYMENT_PROCESSING')
  ) {
    return state === 'PAYMENT_PROCESSING' ? 'PAYMENT_NOT_COMPLETED' : state
  }
  return state
}

export function checkoutResultChromeTone(state: CheckoutResultState): CheckoutResultChromeTone {
  switch (state) {
    case 'PAYMENT_SUCCESS':
    case 'ORDER_RECEIVED':
      return 'positive'
    case 'PAYMENT_PROCESSING':
      return 'neutral'
    case 'PAYMENT_NOT_COMPLETED':
      return 'warning'
    case 'PAYMENT_FAILED':
    case 'ORDER_CANCELLED':
      return 'destructive'
  }
}

/** Multi-order (split) success: use the primary (first) confirmed order. */
export function resolvePrimaryCheckoutResultState(
  orders: CheckoutResultOrderInput[],
): CheckoutResultState | null {
  const primary = orders[0]
  if (!primary) return null
  return resolveCheckoutResultState(primary)
}
