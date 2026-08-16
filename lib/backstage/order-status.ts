export const SYSTEM_ORDER_STATUSES = [
  'PENDING',
  'AWAITING_PAYMENT',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const

export type SystemOrderStatus = (typeof SYSTEM_ORDER_STATUSES)[number]
export type OrderStatus = string

/** @deprecated Prefer fetchOrderStatuses(); kept as fallback seed order */
export const ORDER_STATUSES = SYSTEM_ORDER_STATUSES

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Очікує',
  AWAITING_PAYMENT: 'Очікує оплату',
  PROCESSING: 'В обробці',
  SHIPPED: 'Відправлено',
  DELIVERED: 'Доставлено',
  CANCELLED: 'Скасовано',
}

export const ORDER_STATUS_COLOR_KEYS = [
  'yellow',
  'orange',
  'blue',
  'purple',
  'green',
  'red',
  'gray',
] as const

export type OrderStatusColorKey = (typeof ORDER_STATUS_COLOR_KEYS)[number]

export const ORDER_STATUS_COLOR_CLASSES: Record<string, string> = {
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-muted text-muted-foreground',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: ORDER_STATUS_COLOR_CLASSES.yellow,
  AWAITING_PAYMENT: ORDER_STATUS_COLOR_CLASSES.orange,
  PROCESSING: ORDER_STATUS_COLOR_CLASSES.blue,
  SHIPPED: ORDER_STATUS_COLOR_CLASSES.purple,
  DELIVERED: ORDER_STATUS_COLOR_CLASSES.green,
  CANCELLED: ORDER_STATUS_COLOR_CLASSES.red,
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
  return status.trim().toUpperCase() || 'PENDING'
}

export function orderStatusBadgeClass(status: string, colorKey?: string | null): string {
  if (colorKey && ORDER_STATUS_COLOR_CLASSES[colorKey]) {
    return ORDER_STATUS_COLOR_CLASSES[colorKey]
  }
  return ORDER_STATUS_COLORS[normalizeOrderStatus(status)] ?? ORDER_STATUS_COLOR_CLASSES.gray
}

export function orderStatusLabel(status: string, labelFromApi?: string | null): string {
  if (labelFromApi?.trim()) return labelFromApi.trim()
  const code = normalizeOrderStatus(status)
  return ORDER_STATUS_LABELS[code] ?? code
}
