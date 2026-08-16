export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ReviewTypeFilter = 'all' | 'store' | 'product'

export type ReviewSortOrder = 'newest' | 'oldest' | 'rating_desc' | 'rating_asc'

export type ReviewStoreReply = {
  authorName: string
  text: string
  createdAt: string
}

export type ReviewListItem = {
  id: string
  authorName: string
  email: string | null
  phone: string | null
  text: string
  image: string | null
  images?: string[]
  rating: number
  productId: string | null
  productName: string | null
  productSlug: string | null
  status: ReviewStatus
  storeReply?: ReviewStoreReply | null
  legacyId: string | null
  legacySource: string | null
  importedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ReviewsPageResult = {
  items: ReviewListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ReviewFilters = {
  type?: ReviewTypeFilter
  rating?: number
  productId?: string
  status?: ReviewStatus
  page?: number
  pageSize?: number
  sort?: ReviewSortOrder
}

export type CreateReviewPayload = {
  authorName: string
  email?: string
  phone?: string
  text: string
  image?: string
  images?: string[]
  rating: number
  productId?: string
}

export const REVIEWS_PAGE_SIZE = 10
export const PRODUCT_REVIEWS_PAGE_SIZE = 10

export const EMPTY_REVIEWS_PAGE: ReviewsPageResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: REVIEWS_PAGE_SIZE,
  totalPages: 1,
}
