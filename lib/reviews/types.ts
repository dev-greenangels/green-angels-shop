export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ReviewTypeFilter = 'all' | 'store' | 'product'

export type ReviewSortOrder = 'newest' | 'oldest' | 'rating_desc' | 'rating_asc'

export type ReviewStoreReply = {
  authorName: string
  text: string
  createdAt: string
}

export type ReviewVerificationType = 'NONE' | 'VERIFIED_CUSTOMER' | 'VERIFIED_PURCHASE'

export type ReviewListItem = {
  id: string
  authorName: string
  /** Present on backstage responses only; omitted from public catalog reviews. */
  email?: string | null
  phone?: string | null
  text: string
  image: string | null
  images?: string[]
  rating: number
  productId: string | null
  productName: string | null
  productSlug: string | null
  status: ReviewStatus
  verificationType?: ReviewVerificationType
  purchasedVariantLabels?: string[]
  storeReply?: ReviewStoreReply | null
  /** Shared by reviews from the same order submission (public + backstage). */
  submissionGroupId?: string | null
  /**
   * ISO 3166-1 alpha-2 delivery destination from linked Order (public).
   * Null/omit when unknown — hide country badge.
   */
  deliveryCountryCode?: string | null
  /** Backstage / import fields — not returned by public GET /reviews. */
  legacyId?: string | null
  legacySource?: string | null
  importedAt?: string | null
  /** Backstage audit only — never on public DTO. */
  orderId?: string | null
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

export type ReviewGroupBy = 'submission'

export type ReviewFilters = {
  type?: ReviewTypeFilter
  rating?: number
  productId?: string
  status?: ReviewStatus
  page?: number
  pageSize?: number
  sort?: ReviewSortOrder
  /** Storefront locale for localized productName. */
  locale?: string
  /**
   * When `submission`, Nest paginates by order submission groups.
   * `total` / `pageSize` count cards (groups), not raw Review rows.
   */
  groupBy?: ReviewGroupBy
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

export type ReviewRequestProduct = {
  productId: string
  productName: string
  productSlug: string | null
  imageUrl: string | null
  purchasedVariantLabels: string[]
  alreadyReviewed: boolean
  existingRating: number | null
}

export type ReviewRequestResolve = {
  orderNumber: string
  locale: string
  authorNameDefault: string
  store: {
    alreadyReviewed: boolean
    existingRating: number | null
  }
  products: ReviewRequestProduct[]
  completedAt: string | null
  expiresAt: string
}

export type SubmitOrderReviewByTokenPayload = {
  authorName: string
  store?: { rating: number; text?: string; images?: string[] }
  products?: Array<{
    productId: string
    rating: number
    text?: string
  }>
}

export type SubmitOrderReviewByTokenResult = {
  createdStore: boolean
  createdProductIds: string[]
  skippedStore: boolean
  skippedProductIds: string[]
  completedAt: string | null
  fullyCompleted: boolean
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
