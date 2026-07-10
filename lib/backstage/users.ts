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

export type BackstageUserDetail = BackstageUserListItem & {
  orders: BackstageUserOrderSummary[]
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
