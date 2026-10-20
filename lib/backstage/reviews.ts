import type { ReviewFilters, ReviewListItem, ReviewStatus } from '@/lib/reviews/types'

export const REVIEWS_PENDING_COUNT_EVENT = 'ga:reviews-pending-count-refresh'

function buildReviewQuery(filters?: ReviewFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters.rating) params.set('rating', String(filters.rating))
  if (filters.productId) params.set('productId', filters.productId)
  const query = params.toString()
  return query ? `?${query}` : ''
}

function notifyReviewsPendingCountChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REVIEWS_PENDING_COUNT_EVENT))
  }
}

export async function fetchBackstageReviews(filters?: ReviewFilters): Promise<ReviewListItem[]> {
  const res = await fetch(`/api/backstage/reviews${buildReviewQuery(filters)}`, { cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося завантажити відгуки.',
    )
  }
  return Array.isArray(data) ? data : []
}

export async function fetchReviewsPendingCount(): Promise<number> {
  const res = await fetch('/api/backstage/reviews/pending-count', {
    credentials: 'include',
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося завантажити лічильник відгуків.',
    )
  }
  return typeof data.count === 'number' && data.count >= 0 ? data.count : 0
}

export async function updateBackstageReviewStatus(
  id: string,
  status: ReviewStatus,
): Promise<ReviewListItem> {
  const res = await fetch(`/api/backstage/reviews/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося оновити статус відгуку.',
    )
  }
  notifyReviewsPendingCountChanged()
  return data as ReviewListItem
}

export async function updateBackstageOrderReviewsStatus(
  orderId: string,
  status: ReviewStatus,
): Promise<{ updated: number; orderId: string; status: ReviewStatus }> {
  const res = await fetch(
    `/api/backstage/orders/${encodeURIComponent(orderId)}/reviews/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      credentials: 'include',
    },
  )
  const data = (await res.json().catch(() => ({}))) as {
    updated?: number
    orderId?: string
    status?: ReviewStatus
    error?: string
  }
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося оновити статус відгуків замовлення.',
    )
  }
  notifyReviewsPendingCountChanged()
  return {
    updated: typeof data.updated === 'number' ? data.updated : 0,
    orderId: data.orderId ?? orderId,
    status: data.status ?? status,
  }
}

export async function updateBackstageReviewReply(
  id: string,
  payload: { authorName: string; text: string | null },
): Promise<ReviewListItem> {
  const res = await fetch(`/api/backstage/reviews/${encodeURIComponent(id)}/reply`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося оновити відповідь.',
    )
  }
  return data as ReviewListItem
}

export async function deleteBackstageReview(id: string): Promise<void> {
  const res = await fetch(`/api/backstage/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося видалити відгук.',
    )
  }
  notifyReviewsPendingCountChanged()
}

/** Staff: keep a subset of existing review images (remove unwanted photos). */
export async function updateBackstageReviewImages(
  id: string,
  images: string[],
): Promise<ReviewListItem> {
  const res = await fetch(`/api/backstage/reviews/${encodeURIComponent(id)}/images`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Не вдалося оновити фото відгуку.',
    )
  }
  return data as ReviewListItem
}
