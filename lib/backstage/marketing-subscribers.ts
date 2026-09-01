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

export type MarketingSubscriberStatus = 'active' | 'withdrawn'

export type MarketingSubscriberListItem = {
  subscriberKey: string
  userId: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  source: string | null
  status: MarketingSubscriberStatus
  subscribedAt: string | null
  unsubscribedAt: string | null
  isRegistered: boolean
}

export type MarketingSubscribersPage = {
  items: MarketingSubscriberListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type MarketingSubscribersFilters = {
  q?: string
  status?: 'active' | 'withdrawn' | 'all'
  sortBy?: 'subscribedAt' | 'email' | 'lastName' | 'status' | 'source'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function fetchBackstageMarketingSubscribers(
  params?: MarketingSubscribersFilters,
): Promise<MarketingSubscribersPage> {
  const query = new URLSearchParams()
  if (params?.q) query.set('q', params.q)
  if (params?.status && params.status !== 'all') query.set('status', params.status)
  if (params?.sortBy) query.set('sortBy', params.sortBy)
  if (params?.sortDir) query.set('sortDir', params.sortDir)
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))

  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/marketing-subscribers${suffix}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function downloadBackstageMarketingSubscribersExport(
  params: MarketingSubscribersFilters & { format: 'csv' | 'xlsx' },
): Promise<void> {
  const query = new URLSearchParams()
  query.set('format', params.format)
  if (params.q) query.set('q', params.q)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortDir) query.set('sortDir', params.sortDir)

  const res = await fetch(`/api/backstage/marketing-subscribers/export?${query}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename =
    match?.[1] ??
    (params.format === 'xlsx'
      ? 'marketing-subscribers.xlsx'
      : 'marketing-subscribers.csv')

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function marketingSourceLabel(source: string | null | undefined): string {
  switch (source) {
    case 'CHECKOUT':
      return 'Оформлення замовлення'
    case 'LOGIN':
      return 'Вхід / реєстрація'
    case 'REVIEW':
      return 'Відгук'
    case 'CONTACT_NEWSLETTER':
      return 'Форма контактів'
    case 'UNSUBSCRIBE_LINK':
      return 'Посилання відписки'
    default:
      return source?.trim() || '—'
  }
}
