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
  totalAmount: number
  currency: string
  itemCount: number
  deliveryMethod: string
  deliveryCity: string | null
  createdAt: string
}

export type AccountReviewItem = {
  id: string
  rating: number
  text: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  productName: string | null
  productSlug: string | null
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

export type UpdateAccountProfilePayload = {
  firstName?: string
  lastName?: string
  patronymic?: string
  email?: string
  phone?: string
  deliveryDefaults?: AccountDeliveryDefaults
}

function extractError(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const record = data as Record<string, unknown>
  if (typeof record.message === 'string') return record.message
  if (Array.isArray(record.message)) return record.message.join(', ')
  if (typeof record.error === 'string') return record.error
  return fallback
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
  if (!res.ok) throw new Error(extractError(data, 'Помилка запиту.'))
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

export function fetchAccountOrders() {
  return accountFetch<AccountOrderListItem[]>('/orders')
}

export function fetchAccountReviews() {
  return accountFetch<AccountReviewItem[]>('/reviews')
}

export function fetchAccountStockNotifications() {
  return accountFetch<AccountStockNotificationItem[]>('/stock-notifications')
}

export function removeAccountStockNotification(id: string) {
  return accountFetch<{ ok: true }>(`/stock-notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
