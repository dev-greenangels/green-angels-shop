import type { CreatedOrder } from '@/lib/orders/create-order'

const STORAGE_KEY = 'ga-stripe-checkout-pending'

export type StripePendingPayment = {
  orderNumber: string
  confirmationToken: string
  clientSecret: string
  publishableKey: string
  totalAmount: number
  currency: string
  paymentExpiresAt?: string | null
  items?: Array<{
    productName: string
    variantLabel?: string | null
    quantity: number
    lineTotal?: number
  }>
}

type StoredPending = {
  v: 1
  payments: StripePendingPayment[]
  index?: number
}

function isPendingPayment(value: unknown): value is StripePendingPayment {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.orderNumber === 'string' &&
    typeof row.confirmationToken === 'string' &&
    typeof row.clientSecret === 'string' &&
    typeof row.publishableKey === 'string' &&
    typeof row.totalAmount === 'number' &&
    typeof row.currency === 'string'
  )
}

export function stripePaymentsFromCreatedOrders(orders: CreatedOrder[]): StripePendingPayment[] {
  return orders.flatMap((order) => {
    const clientSecret = order.clientSecret?.trim() ?? ''
    const publishableKey = order.publishableKey?.trim() ?? ''
    if (!clientSecret || !publishableKey) return []
    return [
      {
        orderNumber: order.orderNumber,
        confirmationToken: order.confirmationToken ?? '',
        clientSecret,
        publishableKey,
        totalAmount: order.totalAmount,
        currency: order.currency,
        paymentExpiresAt: order.paymentExpiresAt ?? null,
        items: (order.items ?? []).map((item) => ({
          productName: item.productName,
          variantLabel: item.variantLabel ?? null,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      },
    ]
  })
}

export function saveStripePendingPayments(payments: StripePendingPayment[], index = 0): void {
  if (typeof window === 'undefined') return
  if (!payments.length) {
    clearStripePendingPayments()
    return
  }
  const payload: StoredPending = {
    v: 1,
    payments,
    index: Math.min(Math.max(0, index), payments.length - 1),
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function loadStripePendingPayments(): {
  payments: StripePendingPayment[]
  index: number
} | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredPending>
    if (parsed?.v !== 1 || !Array.isArray(parsed.payments)) return null
    const payments = parsed.payments.filter(isPendingPayment)
    if (!payments.length) return null
    const index =
      typeof parsed.index === 'number' && Number.isFinite(parsed.index)
        ? Math.min(Math.max(0, Math.floor(parsed.index)), payments.length - 1)
        : 0
    return { payments, index }
  } catch {
    return null
  }
}

export function clearStripePendingPayments(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}

export function stripeReturnQuery(payment: Pick<StripePendingPayment, 'orderNumber' | 'confirmationToken'>): string {
  const params = new URLSearchParams()
  params.set('stripe_return', '1')
  params.set('order', payment.orderNumber)
  if (payment.confirmationToken) {
    params.set('confirmation', payment.confirmationToken)
  }
  return params.toString()
}
