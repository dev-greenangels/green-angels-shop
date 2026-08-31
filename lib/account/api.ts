export type AccountDeliveryDefaults = {
  city?: string
  branch?: string
  street?: string
  houseNumber?: string
  method?: 'nova-poshta-branch' | 'nova-poshta-address' | 'pickup'
}

export type AccountProfile = {
  id: string
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  patronymic: string | null
  emailVerified: boolean
  phoneVerified: boolean
  deliveryDefaults: AccountDeliveryDefaults | null
}

export type AccountDashboardStats = {
  ordersCount: number
  favoritesCount: number
  reviewsCount: number
  notificationsCount: number
}

export type AccountOrderListItem = {
  id: string
  orderNumber: string
  status: string
  statusLabel?: string
  totalAmount: number
  currency: string
  itemCount: number
  deliveryMethod: string
  deliveryCity: string | null
  trackingNumber?: string | null
  trackingCarrier?: string | null
  createdAt: string
}

export type AccountOrderDetailItem = {
  id: string
  quantity: number
  priceAtPurchase: number
  lineTotal: number
  productName: string
  productSlug: string
  variantLabel: string | null
  sku: string | null
}

export type AccountOrderDetail = AccountOrderListItem & {
  productsSubtotal: number | null
  deliveryAmount: number | null
  packagingAmount: number | null
  taxAmount: number | null
  codFeeAmount: number | null
  customerFirstName: string
  customerLastName: string
  customerPatronymic: string | null
  customerPhone: string
  customerEmail: string | null
  receiverFirstName: string
  receiverLastName: string
  receiverPatronymic: string | null
  receiverPhone: string
  deliveryBranch: string | null
  deliveryStreet: string | null
  deliveryHouseNumber: string | null
  paymentMethod: string
  paymentStatus: string | null
  comment: string | null
  shippedAt: string | null
  deliveredAt: string | null
  withdrawalActionVisible: boolean
  cancelledAt: string | null
  items: AccountOrderDetailItem[]
}

export type AccountReviewItem = {
  id: string
  rating: number
  text: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  productName: string | null
  productSlug: string | null
  productCategorySlug: string | null
  storeReply: { authorName: string; text: string; createdAt: string } | null
  createdAt: string
}

export type AccountStockNotificationItem = {
  id: string
  productId: string
  productName: string
  productSlug: string
  email: string | null
  phone: string | null
  notifiedAt: string | null
  createdAt: string
}

export type AccountListPage<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type AccountExportData = {
  exportedAt: string
  profile: AccountProfile
  orders: AccountOrderListItem[]
  reviews: AccountReviewItem[]
}

export type UpdateAccountProfilePayload = {
  firstName?: string
  lastName?: string
  patronymic?: string
  deliveryDefaults?: AccountDeliveryDefaults
}

export type AccountListQuery = {
  page?: number
  pageSize?: number
}

function extractError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const record = data as Record<string, unknown>
  if (typeof record.message === 'string') return record.message
  if (Array.isArray(record.message)) return record.message.join(', ')
  if (record.message && typeof record.message === 'object' && !Array.isArray(record.message)) {
    const nested = record.message as Record<string, unknown>
    if (typeof nested.message === 'string') return nested.message
  }
  if (typeof record.error === 'string') return record.error
  return fallback
}

export function extractAccountErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  if (typeof record.code === 'string') return record.code
  if (record.message && typeof record.message === 'object' && !Array.isArray(record.message)) {
    const nested = record.message as Record<string, unknown>
    if (typeof nested.code === 'string') return nested.code
  }
  return null
}

async function accountFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/account${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(extractError(data, 'Помилка запиту.')) as Error & {
      code?: string
      status?: number
    }
    err.code = extractAccountErrorCode(data) ?? undefined
    err.status = res.status
    throw err
  }
  return data as T
}

export function fetchAccountDashboard() {
  return accountFetch<AccountDashboardStats>('/dashboard')
}

export function fetchAccountProfile() {
  return accountFetch<AccountProfile>('/profile')
}

export function updateAccountProfile(payload: UpdateAccountProfilePayload) {
  return accountFetch<AccountProfile>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function startEmailContact(email: string) {
  return accountFetch<{ ok: true; pending?: boolean; alreadyOwned?: boolean }>(
    '/contacts/email/start',
    { method: 'POST', body: JSON.stringify({ email }) },
  )
}

export function confirmEmailContact(verificationToken: string) {
  return accountFetch<AccountProfile>('/contacts/email/confirm', {
    method: 'POST',
    body: JSON.stringify({ verificationToken }),
  })
}

export function startPhoneContact(phone: string) {
  return accountFetch<{ ok: true; pending?: boolean; alreadyOwned?: boolean }>(
    '/contacts/phone/start',
    { method: 'POST', body: JSON.stringify({ phone }) },
  )
}

export function confirmPhoneContact(verificationToken: string) {
  return accountFetch<AccountProfile>('/contacts/phone/confirm', {
    method: 'POST',
    body: JSON.stringify({ verificationToken }),
  })
}

export function clearPhoneContact() {
  return accountFetch<AccountProfile>('/contacts/phone/clear', {
    method: 'POST',
    body: '{}',
  })
}

export function fetchAccountOrders(params?: AccountListQuery) {
  return fetchAccountListPage<AccountOrderListItem>('/orders', params)
}

export function fetchAccountOrder(orderId: string) {
  return accountFetch<AccountOrderDetail>(`/orders/${encodeURIComponent(orderId)}`)
}

export function fetchAccountReviews(params?: AccountListQuery) {
  return fetchAccountListPage<AccountReviewItem>('/reviews', params)
}

export function fetchAccountStockNotifications(params?: AccountListQuery) {
  return fetchAccountListPage<AccountStockNotificationItem>('/stock-notifications', params)
}

export function removeAccountStockNotification(id: string) {
  return accountFetch<{ ok: true }>(`/stock-notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function fetchAccountExport() {
  return accountFetch<AccountExportData>('/export')
}

export function deleteAccount(confirm: string) {
  return accountFetch<{ ok: true }>('/delete', {
    method: 'POST',
    body: JSON.stringify({ confirm }),
  })
}

export function claimGuestOrder(_payload: {
  orderNumber: string
  phone?: string
  email?: string
}): Promise<AccountOrderListItem> {
  // BATCH 3A: backend rejects weak claim; keep helper only for compatibility callers.
  return accountFetch<AccountOrderListItem>('/orders/claim', {
    method: 'POST',
    body: JSON.stringify(_payload),
  })
}

/** Verified purchaser contacts only — no contact overrides in the body. */
export function attachOrphanOrder(orderId: string) {
  return accountFetch<AccountOrderListItem>(
    `/orders/${encodeURIComponent(orderId)}/attach`,
    { method: 'POST' },
  )
}

function buildQuery(params?: AccountListQuery): string {
  const query = new URLSearchParams()
  if (params?.page != null) query.set('page', String(params.page))
  if (params?.pageSize != null) query.set('pageSize', String(params.pageSize))
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

async function fetchAccountListPage<T>(
  path: '/orders' | '/reviews' | '/stock-notifications',
  params?: AccountListQuery,
): Promise<AccountListPage<T>> {
  const data = await accountFetch<AccountListPage<T> | T[]>(`${path}${buildQuery(params)}`)
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: data.length ? 1 : 0,
    }
  }
  return data
}
