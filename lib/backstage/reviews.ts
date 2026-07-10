import type { ReviewFilters, ReviewListItem, ReviewStatus } from '@/lib/reviews/types'

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
  return data as ReviewListItem
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
}
