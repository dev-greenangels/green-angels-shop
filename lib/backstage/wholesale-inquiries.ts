export type WholesaleInquiryStatus = 'NEW' | 'IN_PROGRESS' | 'CLOSED'

export type WholesaleInquiryListItem = {
  id: string
  status: WholesaleInquiryStatus
  locale: string
  marketRegion: string
  fullName: string
  companyName: string
  phone: string
  email: string
  city: string
  website: string | null
  message: string | null
  companyIco: string | null
  companyVatId: string | null
  consentAt: string | null
  createdAt: string
}

export type WholesaleInquiryPage = {
  items: WholesaleInquiryListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
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

export async function fetchBackstageWholesaleInquiries(input?: {
  status?: WholesaleInquiryStatus | 'ALL'
  page?: number
}): Promise<WholesaleInquiryPage> {
  const params = new URLSearchParams()
  if (input?.status && input.status !== 'ALL') params.set('status', input.status)
  if (input?.page) params.set('page', String(input.page))
  const query = params.toString()
  const res = await fetch(`/api/backstage/wholesale-inquiries${query ? `?${query}` : ''}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageWholesaleInquiryStatus(
  id: string,
  status: WholesaleInquiryStatus,
): Promise<WholesaleInquiryListItem> {
  const res = await fetch(`/api/backstage/wholesale-inquiries/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ga:wholesale-new-count-refresh'))
  }
  return res.json()
}

export async function fetchWholesaleInquiriesNewCount(): Promise<number> {
  const res = await fetch('/api/backstage/wholesale-inquiries/new-count', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { count?: unknown }
  return typeof data.count === 'number' && data.count >= 0 ? data.count : 0
}
