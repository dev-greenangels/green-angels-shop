import type { OrderStatus } from '@/lib/backstage/order-status'

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export type BackstageOrderListItem = {
  id: string
  orderNumber: string
  status: OrderStatus
  totalAmount: number
  currency: string
  customerFirstName: string
  customerLastName: string
  customerPatronymic: string | null
  customerPhone: string
  customerEmail: string | null
  itemCount: number
  createdAt: string
}

export type BackstageOrderItem = {
  id: string
  quantity: number
  priceAtPurchase: number
  lineTotal: number
  productVariantId: string
  productName: string
  productSlug: string
  variantLabel: string | null
  sku: string | null
}

export type BackstageOrderDetail = BackstageOrderListItem & {
  receiverFirstName: string
  receiverLastName: string
  receiverPatronymic: string | null
  receiverPhone: string
  deliveryMethod: string
  deliveryCity: string | null
  deliveryBranch: string | null
  deliveryStreet: string | null
  deliveryHouseNumber: string | null
  paymentMethod: string
  comment: string | null
  items: BackstageOrderItem[]
}

export type BackstageOrdersFilters = {
  search?: string
  status?: string
}

export async function fetchBackstageOrders(
  params?: BackstageOrdersFilters,
): Promise<BackstageOrderListItem[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.status && params.status !== 'all') {
    query.set('status', params.status.toUpperCase())
  }

  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/orders${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchBackstageOrder(id: string): Promise<BackstageOrderDetail> {
  const res = await fetch(`/api/backstage/orders/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function patchBackstageOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<BackstageOrderListItem> {
  const res = await fetch(`/api/backstage/orders/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteBackstageOrder(id: string): Promise<{ ok: true }> {
  const res = await fetch(`/api/backstage/orders/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
