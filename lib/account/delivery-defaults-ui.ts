import {
  CHECKOUT_DELIVERY_METHODS,
  COURIER_ADDRESS_METHODS,
  PACKETA_PICKUP_POINT_METHODS,
  type CheckoutDeliveryMethodSlug,
} from '@/lib/checkout/methods'

const BRANCH_METHODS = new Set<string>([
  'nova-poshta-branch',
  ...PACKETA_PICKUP_POINT_METHODS,
])

const COURIER_METHODS = new Set<string>(COURIER_ADDRESS_METHODS)

export function isCheckoutDeliveryMethod(
  value: string,
): value is CheckoutDeliveryMethodSlug {
  return (CHECKOUT_DELIVERY_METHODS as readonly string[]).includes(value)
}

export function isBranchDeliveryMethod(method: string): boolean {
  return BRANCH_METHODS.has(method)
}

export function isCourierDeliveryMethod(method: string): boolean {
  return COURIER_METHODS.has(method)
}

export function isPickupDeliveryMethod(method: string): boolean {
  return method === 'pickup'
}

/** SK multi-country courier needs postal + country; UA courier uses city/street/house. */
export function needsSkCourierExtras(method: string, marketRegion: 'ua' | 'sk'): boolean {
  return marketRegion === 'sk' && isCourierDeliveryMethod(method)
}
