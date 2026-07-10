export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Очікує',
  PROCESSING: 'В обробці',
  SHIPPED: 'Відправлено',
  DELIVERED: 'Доставлено',
  CANCELLED: 'Скасовано',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  'nova-poshta-branch': 'Нова Пошта (відділення)',
  'nova-poshta-address': 'Нова Пошта (адреса)',
  pickup: 'Самовивіз',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  'card-online': 'Оплата онлайн',
  'bank-transfer': 'Банківський переказ для фіз. осіб',
  'bank-transfer-legal': 'Банківський переказ для юр. осіб',
}

export function normalizeOrderStatus(status: string): OrderStatus {
  const upper = status.toUpperCase() as OrderStatus
  return ORDER_STATUSES.includes(upper) ? upper : 'PENDING'
}
