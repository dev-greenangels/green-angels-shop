'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

import { ReviewLeaveFlow } from '@/components/reviews/review-leave-flow'
import { ReviewsList } from '@/components/reviews/reviews-list'
import { ReviewsPagination } from '@/components/reviews/reviews-pagination'
import { ReviewsStickyToolbar } from '@/components/reviews/reviews-sticky-toolbar'
import { fetchPublishedReviews } from '@/lib/reviews/fetch'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import { PRODUCT_REVIEWS_PAGE_SIZE } from '@/lib/reviews/types'

type ProductReviewsSectionProps = {
  productId: string
  productName: string
  initialPage: ReviewsPageResult
}

export function ProductReviewsSection({
  productId,
  productName,
  initialPage,
}: ProductReviewsSectionProps) {
  const t = useTranslations('reviews')
  const [pageResult, setPageResult] = useState(initialPage)
  /** Unfiltered product total — rating filter must not hide the toolbar/CTA logic. */
  const [totalUnfiltered, setTotalUnfiltered] = useState(initialPage.total)
  const [rating, setRating] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPublishedReviews({
        productId,
        rating: rating ?? undefined,
        page,
        pageSize: PRODUCT_REVIEWS_PAGE_SIZE,
        sort: 'newest',
      })
      setPageResult(data)
      if (rating == null) {
        setTotalUnfiltered(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [productId, rating, page, refreshToken])

  const skipInitialFetchRef = useRef(true)

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false
      return
    }
    void reload()
  }, [reload])

  const handleRatingChange = (next: number | null) => {
    setRating(next)
    setPage(1)
  }

  const handleReviewSubmitted = () => {
    setRating(null)
    setPage(1)
    setRefreshToken((n) => n + 1)
  }

  const leaveReviewAction = (
    <ReviewLeaveFlow
      productId={productId}
      productName={productName}
      onSubmitted={handleReviewSubmitted}
    />
  )

  const showFiltersToolbar = totalUnfiltered > PRODUCT_REVIEWS_PAGE_SIZE
  const isEmpty = totalUnfiltered === 0

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-2xl font-bold text-foreground">{t('productTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('productSubtitle', { name: productName })}
          </p>
        </div>
        {!isEmpty && !showFiltersToolbar ? (
          <div className="shrink-0">{leaveReviewAction}</div>
        ) : null}
      </div>

      {showFiltersToolbar ? (
        <ReviewsStickyToolbar
          type="product"
          rating={rating}
          sort="newest"
          onTypeChange={() => undefined}
          onRatingChange={handleRatingChange}
          onSortChange={() => undefined}
          showTypeFilter={false}
          showSortFilter={false}
          leaveReviewAction={leaveReviewAction}
        />
      ) : null}

      {loading ? (
        <p className="mb-3 text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}

      <ReviewsList
        reviews={pageResult.items}
        showProductLink={false}
        emptyMessage={t('emptyProduct')}
        emptyAction={isEmpty ? leaveReviewAction : undefined}
      />

      <ReviewsPagination
        page={pageResult.page}
        totalPages={pageResult.totalPages}
        total={pageResult.total}
        disabled={loading}
        onPageChange={setPage}
        className="mt-4"
      />
    </section>
  )
}
