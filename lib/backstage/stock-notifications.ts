export type StockNotificationListItem = {
  id: string
  productId: string
  productName: string
  productSlug: string
  categorySlug: string
  name: string
  email: string | null
  phone: string | null
  locale: string
  countrySiteCode: string | null
  consentAt: string | null
  notifiedAt: string | null
  createdAt: string
}

export type StockNotificationPage = {
  items: StockNotificationListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type StockNotificationStatusFilter = 'all' | 'pending' | 'notified'
export type StockNotificationChannelFilter = 'all' | 'email' | 'phone'

export type StockJobItem = {
  id: string | undefined
  name: string
  state: string
  attemptsMade: number
  timestamp: number
  failedReason: string | null
}

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

export async function fetchBackstageStockNotifications(input?: {
  status?: StockNotificationStatusFilter
  channel?: StockNotificationChannelFilter
  q?: string
  page?: number
}): Promise<StockNotificationPage> {
  const params = new URLSearchParams()
  if (input?.status && input.status !== 'all') params.set('status', input.status)
  if (input?.channel && input.channel !== 'all') params.set('channel', input.channel)
  if (input?.q?.trim()) params.set('q', input.q.trim())
  if (input?.page) params.set('page', String(input.page))
  const query = params.toString()
  const res = await fetch(`/api/backstage/stock-notifications${query ? `?${query}` : ''}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchStockNotificationsPendingCount(): Promise<number> {
  const res = await fetch('/api/backstage/stock-notifications/pending-count', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { count?: unknown }
  return typeof data.count === 'number' && data.count >= 0 ? data.count : 0
}

export async function sendBackstageStockNotifications(ids: string[]) {
  const res = await fetch('/api/backstage/stock-notifications/send', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ ok: true; queued: number }>
}

export async function deleteBackstageStockNotification(id: string) {
  const res = await fetch(`/api/backstage/stock-notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ ok: true }>
}

export async function deleteBackstageStockNotifications(ids: string[]) {
  const res = await fetch('/api/backstage/stock-notifications/delete-many', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ ok: true; deleted: number }>
}

export async function fetchStockNotificationJobs() {
  const res = await fetch('/api/backstage/stock-notifications/jobs', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{
    counts: Record<string, number>
    items: StockJobItem[]
  }>
}

export async function retryStockNotificationJobs() {
  const res = await fetch('/api/backstage/stock-notifications/jobs/retry-failed', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ ok: true; count: number }>
}

export async function drainStockNotificationJobs() {
  const res = await fetch('/api/backstage/stock-notifications/jobs/drain', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json() as Promise<{ ok: true; removed: number }>
}
