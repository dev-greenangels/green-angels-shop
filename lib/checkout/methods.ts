export const CHECKOUT_DELIVERY_METHODS = [
  'nova-poshta-branch',
  'nova-poshta-address',
  'pickup',
] as const

export const CHECKOUT_PAYMENT_METHODS = [
  'card-online',
  'bank-transfer',
  'bank-transfer-legal',
] as const

export type CheckoutDeliveryMethodSlug = (typeof CHECKOUT_DELIVERY_METHODS)[number]
export type CheckoutPaymentMethodSlug = (typeof CHECKOUT_PAYMENT_METHODS)[number]

export const DEFAULT_ENABLED_DELIVERY_METHODS: CheckoutDeliveryMethodSlug[] = [
  ...CHECKOUT_DELIVERY_METHODS,
]

export const DEFAULT_ENABLED_PAYMENT_METHODS: CheckoutPaymentMethodSlug[] = [
  ...CHECKOUT_PAYMENT_METHODS,
]

export const DELIVERY_METHOD_BACKSTAGE_LABELS: Record<CheckoutDeliveryMethodSlug, string> = {
  'nova-poshta-branch': 'Нова Пошта (відділення)',
  'nova-poshta-address': 'Нова Пошта (адресна доставка)',
  pickup: 'Самовивіз',
}

export const PAYMENT_METHOD_BACKSTAGE_LABELS: Record<CheckoutPaymentMethodSlug, string> = {
  'card-online': 'Оплата карткою онлайн',
  'bank-transfer': 'Банківський переказ (фіз. особа)',
  'bank-transfer-legal': 'Банківський переказ (юр. особа)',
}
