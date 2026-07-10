import type { CreateOrderPayload } from '@/lib/checkout/build-order-payload'

export type CreatedOrder = {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
  paymentPageUrl?: string
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const record = data as Record<string, unknown>
  if (typeof record.message === 'string') return record.message
  if (Array.isArray(record.message)) return record.message.join(', ')
  if (typeof record.error === 'string') return record.error
  return fallback
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreatedOrder> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, 'Не вдалося оформити замовлення.'))
  }

  return data as CreatedOrder
}

export async function createOrders(payloads: CreateOrderPayload[]): Promise<CreatedOrder[]> {
  const orders: CreatedOrder[] = []
  for (const payload of payloads) {
    orders.push(await createOrder(payload))
  }
  return orders
}
