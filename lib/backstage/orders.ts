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
  statusLabel?: string
  totalAmount: number
  currency: string
  customerFirstName: string
  customerLastName: string
  customerPatronymic: string | null
  customerPhone: string
  customerEmail: string | null
  itemCount: number
  trackingNumber?: string | null
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
  paymentStatus?: string | null
  comment: string | null
  trackingCarrier?: string | null
  npDocumentRef?: string | null
  trackingSyncedAt?: string | null
  shippedAt?: string | null
  cancellationReasonId?: string | null
  cancellationReasonName?: string | null
  cancellationSource?: string | null
  cancellationNote?: string | null
  cancelledAt?: string | null
  /** Correlation only: ext:GA:{uuid}. Not native ERP number. */
  externalErpId?: string | null
  erpSyncStatus?: string | null
  erpNativeId?: string | null
  erpNativeKod?: string | null
  erpSyncAttempts?: number
  erpLastErrorCode?: string | null
  erpLastErrorMessage?: string | null
  erpLastSyncAt?: string | null
  erpSyncedAt?: string | null
  buyerType?: string | null
  taxRegime?: string | null
  taxRatePercent?: number | null
  taxCountryCode?: string | null
  vatCountryCode?: string | null
  companyLegalName?: string | null
  companyIco?: string | null
  companyDic?: string | null
  companyVatId?: string | null
  companyStreet?: string | null
  companyCity?: string | null
  companyPostalCode?: string | null
  viesCheck?: {
    valid: boolean | null
    vatCountryCode: string
    vatNumber: string
    checkedAt: string
    viesRequestDate: string | null
    requestIdentifier: string | null
    registeredName: string | null
    registeredAddress: string | null
    source: string
  } | null
  items: BackstageOrderItem[]
}

export type BackstageOrdersFilters = {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}

export type PaginatedBackstageOrders = {
  items: BackstageOrderListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type PatchOrderPayload = {
  status?: OrderStatus
  cancellationReasonId?: string
  cancellationNote?: string | null
  trackingNumber?: string | null
  trackingCarrier?: string | null
  npDocumentRef?: string | null
}

export async function fetchBackstageOrders(
  params?: BackstageOrdersFilters,
): Promise<PaginatedBackstageOrders> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.status && params.status !== 'all') {
    query.set('status', params.status.toUpperCase())
  }
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))

  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/orders${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  if (Array.isArray(data)) {
    return {
      items: data as BackstageOrderListItem[],
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    }
  }
  return data as PaginatedBackstageOrders
}

export type BackstageOrdersSummary = {
  totalOrders: number
  totalRevenue: number
  currency: string
}

export async function fetchBackstageOrdersSummary(): Promise<BackstageOrdersSummary> {
  const res = await fetch('/api/backstage/orders/summary', {
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

export async function patchBackstageOrder(
  id: string,
  payload: PatchOrderPayload,
): Promise<BackstageOrderDetail | BackstageOrderListItem> {
  const res = await fetch(`/api/backstage/orders/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function patchBackstageOrderStatus(
  id: string,
  status: OrderStatus,
  options?: { cancellationReasonId?: string; cancellationNote?: string | null },
): Promise<BackstageOrderListItem> {
  return patchBackstageOrder(id, {
    status,
    cancellationReasonId: options?.cancellationReasonId,
    cancellationNote: options?.cancellationNote,
  }) as Promise<BackstageOrderListItem>
}

export async function syncBackstageOrderTracking(id: string): Promise<BackstageOrderDetail> {
  const res = await fetch(`/api/backstage/orders/${id}/sync-tracking`, {
    method: 'POST',
    credentials: 'include',
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
