import type {
  CreateReviewPayload,
  ReviewFilters,
  ReviewListItem,
  ReviewsPageResult,
} from '@/lib/reviews/types'
import { EMPTY_REVIEWS_PAGE } from '@/lib/reviews/types'

function buildReviewQuery(filters?: ReviewFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.type && filters.type !== 'all') params.set('type', filters.type)
  if (filters.rating) params.set('rating', String(filters.rating))
  if (filters.productId) params.set('productId', filters.productId)
  if (filters.status) params.set('status', filters.status)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
  if (filters.sort) params.set('sort', filters.sort)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function parseReviewsPage(data: unknown): ReviewsPageResult {
  if (
    data &&
    typeof data === 'object' &&
    'items' in data &&
    Array.isArray((data as ReviewsPageResult).items)
  ) {
    const page = data as ReviewsPageResult
    return {
      items: page.items,
      total: page.total ?? page.items.length,
      page: page.page ?? 1,
      pageSize: page.pageSize ?? page.items.length,
      totalPages: page.totalPages ?? 1,
    }
  }

  if (Array.isArray(data)) {
    return {
      items: data as ReviewListItem[],
      total: data.length,
      page: 1,
      pageSize: data.length || 10,
      totalPages: 1,
    }
  }

  return EMPTY_REVIEWS_PAGE
}

export async function fetchPublishedReviews(filters?: ReviewFilters): Promise<ReviewsPageResult> {
  const res = await fetch(`/api/catalog/reviews${buildReviewQuery(filters)}`, { cache: 'no-store' })
  if (!res.ok) return EMPTY_REVIEWS_PAGE
  const data = await res.json()
  return parseReviewsPage(data)
}

export async function submitReview(payload: CreateReviewPayload): Promise<ReviewListItem> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = (await res.json().catch(() => ({}))) as ReviewListItem & { error?: string; message?: string | string[] }
  if (!res.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : typeof data.message === 'string'
            ? data.message
            : 'Не вдалося надіслати відгук.'
    throw new Error(message)
  }
  return data
}

export async function uploadReviewImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.set('file', file)

  const res = await fetch('/api/reviews/upload', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? 'Не вдалося завантажити зображення.')
  }
  return data.url
}
