import type { CreateOrderPayload } from '@/lib/checkout/build-order-payload'

export type CreatedOrder = {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
  confirmationToken: string
  paymentPageUrl?: string
  /** Stripe Checkout Session client_secret (Payment Element). */
  clientSecret?: string
  /** Stripe publishable key when clientSecret is present. */
  publishableKey?: string
}

export type CreateOrderOptions = {
  idempotencyKey?: string
}

export type CreateOrdersOptions = {
  idempotencyKeys?: Array<string | undefined>
}

function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const record = data as Record<string, unknown>
  if (typeof record.message === 'string') return record.message
  if (Array.isArray(record.message)) return record.message.join(', ')
  if (typeof record.error === 'string') return record.error
  return fallback
}

export async function createOrder(
  payload: CreateOrderPayload,
  options?: CreateOrderOptions,
): Promise<CreatedOrder> {
  const idempotencyKey = options?.idempotencyKey ?? newIdempotencyKey()

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, 'Не вдалося оформити замовлення.'))
  }

  return data as CreatedOrder
}

export async function createOrders(
  payloads: CreateOrderPayload[],
  options?: CreateOrdersOptions,
): Promise<CreatedOrder[]> {
  const orders: CreatedOrder[] = []
  for (let index = 0; index < payloads.length; index += 1) {
    orders.push(
      await createOrder(payloads[index], {
        idempotencyKey: options?.idempotencyKeys?.[index],
      }),
    )
  }
  return orders
}

export function checkoutSuccessSearch(
  orders: Array<{ orderNumber: string; confirmationToken?: string }>,
): string {
  return orders
    .map((order) => {
      const parts = [`order=${encodeURIComponent(order.orderNumber)}`]
      if (order.confirmationToken) {
        parts.push(`confirmation=${encodeURIComponent(order.confirmationToken)}`)
      }
      return parts.join('&')
    })
    .join('&')
}
