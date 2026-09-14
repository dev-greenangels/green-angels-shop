export const CHECKOUT_DELIVERY_METHODS = [
  'nova-poshta-branch',
  'nova-poshta-address',
  'pickup',
  'packeta-box',
  'packeta-courier',
  'gls-courier',
] as const

export const CHECKOUT_PAYMENT_METHODS = [
  'card-online',
  'bank-transfer',
  'bank-transfer-legal',
  'dobierka',
  'pay-on-pickup',
] as const

export type CheckoutDeliveryMethodSlug = (typeof CHECKOUT_DELIVERY_METHODS)[number]
export type CheckoutPaymentMethodSlug = (typeof CHECKOUT_PAYMENT_METHODS)[number]

export const SELF_PICKUP_DELIVERY_METHOD = 'pickup' as const
export const PAY_ON_PICKUP_PAYMENT_METHOD = 'pay-on-pickup' as const
export const DOBIERKA_PAYMENT_METHOD = 'dobierka' as const

export const TOGGLEABLE_PAYMENT_METHODS: CheckoutPaymentMethodSlug[] =
  CHECKOUT_PAYMENT_METHODS.filter((m) => m !== PAY_ON_PICKUP_PAYMENT_METHOD)

export function isPayOnPickupPaymentMethod(paymentMethod: string): boolean {
  return paymentMethod.trim() === PAY_ON_PICKUP_PAYMENT_METHOD
}

export function isDobierkaPaymentMethod(paymentMethod: string): boolean {
  return paymentMethod.trim() === DOBIERKA_PAYMENT_METHOD
}

export function isSelfPickupDeliveryMethod(deliveryMethod: string): boolean {
  return deliveryMethod.trim() === SELF_PICKUP_DELIVERY_METHOD
}

export function isPayOnPickupAvailable(input: {
  allowPayOnPickup: boolean
  deliveryMethod: string
}): boolean {
  return (
    input.allowPayOnPickup === true &&
    isSelfPickupDeliveryMethod(input.deliveryMethod)
  )
}

export const DEFAULT_ENABLED_DELIVERY_METHODS: CheckoutDeliveryMethodSlug[] = [
  'nova-poshta-branch',
  'nova-poshta-address',
  'pickup',
]

export const DEFAULT_ENABLED_PAYMENT_METHODS: CheckoutPaymentMethodSlug[] = [
  'card-online',
  'bank-transfer',
  'bank-transfer-legal',
]

export const DELIVERY_METHOD_BACKSTAGE_LABELS: Record<CheckoutDeliveryMethodSlug, string> = {
  'nova-poshta-branch': 'Нова Пошта (відділення)',
  'nova-poshta-address': 'Нова Пошта (адресна доставка)',
  pickup: 'Самовивіз',
  'packeta-box': 'Packeta (Zásilkovna) — výdejní místo',
  'packeta-courier': 'Packeta — kurýr',
  'gls-courier': 'GLS — kurýr',
}

export const PAYMENT_METHOD_BACKSTAGE_LABELS: Record<CheckoutPaymentMethodSlug, string> = {
  'card-online': 'Оплата карткою онлайн',
  'bank-transfer': 'Банківський переказ (фіз. особа)',
  'bank-transfer-legal': 'Банківський переказ (юр. особа)',
  dobierka: 'Dobierka (платіж при доставці)',
  'pay-on-pickup': 'Оплата при отриманні (самовивіз)',
}

export const PACKETA_PICKUP_POINT_METHODS: CheckoutDeliveryMethodSlug[] = ['packeta-box']

export const COURIER_ADDRESS_METHODS: CheckoutDeliveryMethodSlug[] = [
  'packeta-courier',
  'gls-courier',
  'nova-poshta-address',
]
