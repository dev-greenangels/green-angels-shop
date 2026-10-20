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

export type BackstageUserSegment = 'customers' | 'staff'

export type BackstageUserRole =
  | 'GUEST'
  | 'USER'
  | 'WHOLESALER'
  | 'ADMIN'
  | 'MANAGER'

export type BackstageUserListItem = {
  id: string
  firstName: string | null
  lastName: string | null
  patronymic: string | null
  phone: string | null
  email: string | null
  role: BackstageUserRole
  orderCount: number
  createdAt: string
  marketingSubscribed: boolean
  marketingSubscribedAt: string | null
}

export type BackstageUsersFilters = {
  segment?: BackstageUserSegment
  search?: string
}

export type CreateStaffPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
  patronymic?: string
  role: 'ADMIN' | 'MANAGER'
}

export type UpdateUserPayload = {
  firstName?: string
  lastName?: string
  patronymic?: string | null
  email?: string
  phone?: string | null
  password?: string
  role?: BackstageUserRole
  /** Flexi adresar.kod — COMPANY Sales Prices. Null/'' clears. */
  flexiFirmaKod?: string | null
  /** Flexi cenikova-skupina.kod — GROUP Sales Prices. Null/'' clears. */
  flexiSkupCenKod?: string | null
}

export type BackstageUserOrderItem = {
  id: string
  productName: string
  variantLabel: string | null
  quantity: number
  priceAtPurchase: number
  lineTotal: number
}

export type BackstageUserOrderSummary = {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  itemCount: number
  createdAt: string
  trackingNumber?: string | null
  receiverFirstName: string
  receiverLastName: string
  receiverPatronymic: string | null
  receiverPhone: string
  deliveryMethod: string
  deliveryCity: string | null
  deliveryBranch: string | null
  deliveryStreet: string | null
  deliveryHouseNumber: string | null
  items: BackstageUserOrderItem[]
}

export type BackstageUserSalesPriceAccess = {
  company: boolean
  group: boolean
  groupKod: string | null
  groupFromMarketDefault: boolean
  allFallback: boolean
}

export type BackstageUserDetail = BackstageUserListItem & {
  orders: BackstageUserOrderSummary[]
  groupIds: string[]
  marketingSource: string | null
  marketingUnsubscribedAt: string | null
  flexiFirmaKod: string | null
  flexiSkupCenKod: string | null
  salesPricesWholesalerGroupKod: string | null
  salesPriceAccess: BackstageUserSalesPriceAccess
}

export type FlexiPriceDictionaries = {
  priceGroups: Array<{ code: string; name: string; flexiId: string }>
  firmaKods: string[]
  salesPricesWholesalerGroupKod: string | null
}

export async function fetchFlexiPriceDictionaries(): Promise<FlexiPriceDictionaries> {
  const res = await fetch('/api/backstage/sales-prices/dictionaries', { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as FlexiPriceDictionaries
}

export async function createBackstageStaffMember(
  payload: CreateStaffPayload,
): Promise<BackstageUserListItem> {
  const res = await fetch('/api/backstage/users/staff', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchBackstageUsersCount(
  segment: BackstageUserSegment = 'customers',
): Promise<number> {
  const query = new URLSearchParams({ segment })
  const res = await fetch(`/api/backstage/users/count?${query}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { total?: number }
  return typeof data.total === 'number' ? data.total : 0
}

export async function fetchBackstageUsers(
  params?: BackstageUsersFilters,
): Promise<BackstageUserListItem[]> {
  const query = new URLSearchParams()
  if (params?.segment) query.set('segment', params.segment)
  if (params?.search) query.set('search', params.search)

  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/users${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchBackstageUser(id: string): Promise<BackstageUserDetail> {
  const res = await fetch(`/api/backstage/users/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<BackstageUserDetail> {
  const res = await fetch(`/api/backstage/users/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageUserGroups(
  id: string,
  groupIds: string[],
): Promise<BackstageUserDetail> {
  const res = await fetch(`/api/backstage/users/${id}/groups`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupIds }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteBackstageUser(
  id: string,
  deleteOrders: boolean,
): Promise<{ ok: true }> {
  const res = await fetch(`/api/backstage/users/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleteOrders }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export type BackstageUserCommunication = {
  id: string
  orderId: string | null
  orderNumber: string | null
  audience: string
  type: string
  source: string
  status: string
  toEmail: string | null
  subjectSnapshot: string | null
  hasAttachment: boolean
  errorMessage: string | null
  providerMessageId: string | null
  sentAt: string | null
  createdAt: string
}

export async function fetchBackstageUserCommunications(
  id: string,
  params?: { page?: number; pageSize?: number },
): Promise<{
  items: BackstageUserCommunication[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const query = new URLSearchParams()
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))
  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/users/${id}/communications${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
