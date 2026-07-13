import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { parseReviewsPage } from '@/lib/reviews/fetch'
import type { ReviewFilters, ReviewsPageResult } from '@/lib/reviews/types'
import { EMPTY_REVIEWS_PAGE } from '@/lib/reviews/types'
import type { CatalogPhotosPage } from '@/lib/variant-photos/types'

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

export async function fetchHomeReviews(filters?: ReviewFilters): Promise<ReviewsPageResult> {
  try {
    const res = await fetchBackend(`/reviews${buildReviewQuery(filters)}`)
    if (!res.ok) return EMPTY_REVIEWS_PAGE
    const data = await readBackendJson(res)
    return parseReviewsPage(data)
  } catch {
    return EMPTY_REVIEWS_PAGE
  }
}

export async function fetchHomeFreshPhotos(limit: number): Promise<CatalogPhotosPage> {
  const empty: CatalogPhotosPage = {
    items: [],
    total: 0,
    page: 1,
    pageSize: limit,
    totalPages: 1,
  }

  try {
    const res = await fetchBackend(
      `/catalog/photos?page=1&pageSize=${Math.min(Math.max(limit, 1), 24)}`,
    )
    if (!res.ok) return empty
    const data = await readBackendJson<CatalogPhotosPage>(res)
    if (!data?.items?.length) return empty
    return {
      items: data.items,
      total: data.total ?? data.items.length,
      totalFileSizeBytes: data.totalFileSizeBytes,
      page: data.page ?? 1,
      pageSize: data.pageSize ?? limit,
      totalPages: data.totalPages ?? 1,
    }
  } catch {
    return empty
  }
}
