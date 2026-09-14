import type {
  CheckoutDeliveryMethodSlug,
  CheckoutPaymentMethodSlug,
} from './methods'
import {
  DOBIERKA_PAYMENT_METHOD,
  isPayOnPickupAvailable,
  isSelfPickupDeliveryMethod,
  PAY_ON_PICKUP_PAYMENT_METHOD,
  SELF_PICKUP_DELIVERY_METHOD,
  TOGGLEABLE_PAYMENT_METHODS,
} from './methods'

/**
 * Visible checkout payment methods for the current delivery + settings.
 *
 * - `dobierka` = carrier COD — never available for self-pickup.
 * - `pay-on-pickup` = nursery pay on pickup — only when allowPayOnPickup ∧ pickup.
 * - `allowPayOnPickup` does not unlock dobierka.
 */
export function resolveVisiblePaymentMethods(input: {
  enabledPaymentMethods: CheckoutPaymentMethodSlug[] | undefined
  hideLegalBankTransfer: boolean
  allowPayOnPickup: boolean
  deliveryMethod: string
}): CheckoutPaymentMethodSlug[] {
  const enabled = input.enabledPaymentMethods
  const isPickup = isSelfPickupDeliveryMethod(input.deliveryMethod)

  const base = TOGGLEABLE_PAYMENT_METHODS.filter((method) => {
    if (isPickup && method === DOBIERKA_PAYMENT_METHOD) return false
    if (input.hideLegalBankTransfer && method === 'bank-transfer-legal') return false
    if (!enabled?.length) return true
    if (method === 'bank-transfer' && input.hideLegalBankTransfer) {
      return enabled.includes('bank-transfer') || enabled.includes('bank-transfer-legal')
    }
    return enabled.includes(method)
  })

  if (
    isPayOnPickupAvailable({
      allowPayOnPickup: input.allowPayOnPickup,
      deliveryMethod: input.deliveryMethod,
    })
  ) {
    return [...base, PAY_ON_PICKUP_PAYMENT_METHOD]
  }
  return base
}

export function isPaymentMethodCurrentlyAllowed(
  method: string,
  input: {
    enabledPaymentMethods: CheckoutPaymentMethodSlug[] | undefined
    hideLegalBankTransfer: boolean
    allowPayOnPickup: boolean
    deliveryMethod: string
  },
): boolean {
  return resolveVisiblePaymentMethods(input).includes(method as CheckoutPaymentMethodSlug)
}

/**
 * Payment methods to list on Shipping & Payment page.
 * Union of checkout-visible methods across enabled delivery contexts
 * (carrier + pickup when both exist) — same filters as checkout, no duplicated rules.
 */
export function resolveShippingPagePaymentMethods(input: {
  enabledPaymentMethods: CheckoutPaymentMethodSlug[] | undefined
  hideLegalBankTransfer: boolean
  allowPayOnPickup: boolean
  enabledDeliveryMethods: CheckoutDeliveryMethodSlug[]
}): CheckoutPaymentMethodSlug[] {
  const delivery = input.enabledDeliveryMethods
  const hasPickup = delivery.some((m) => isSelfPickupDeliveryMethod(m))
  const carrier = delivery.find((m) => !isSelfPickupDeliveryMethod(m))

  const contexts: string[] = []
  if (carrier) contexts.push(carrier)
  if (hasPickup) contexts.push(SELF_PICKUP_DELIVERY_METHOD)
  if (contexts.length === 0) {
    // No delivery methods enabled — still evaluate prepaid filters against a
    // non-pickup context so card/bank visibility matches checkout lists.
    contexts.push('gls-courier')
  }

  const seen = new Set<CheckoutPaymentMethodSlug>()
  const out: CheckoutPaymentMethodSlug[] = []
  for (const deliveryMethod of contexts) {
    for (const method of resolveVisiblePaymentMethods({
      enabledPaymentMethods: input.enabledPaymentMethods,
      hideLegalBankTransfer: input.hideLegalBankTransfer,
      allowPayOnPickup: input.allowPayOnPickup,
      deliveryMethod,
    })) {
      if (seen.has(method)) continue
      seen.add(method)
      out.push(method)
    }
  }
  return out
}
