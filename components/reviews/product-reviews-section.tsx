'use client'

import { useCallback, useEffect, useState } from 'react'
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
  const [rating, setRating] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

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
    } finally {
      setLoading(false)
    }
  }, [productId, rating, page])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleRatingChange = (next: number | null) => {
    setRating(next)
    setPage(1)
  }

  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="font-serif text-2xl font-bold text-foreground">{t('productTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('productSubtitle', { name: productName })}</p>
      </div>

      <ReviewsStickyToolbar
        type="product"
        rating={rating}
        sort="newest"
        onTypeChange={() => undefined}
        onRatingChange={handleRatingChange}
        onSortChange={() => undefined}
        showTypeFilter={false}
        showSortFilter={false}
        leaveReviewAction={
          <ReviewLeaveFlow
            productId={productId}
            productName={productName}
            onSubmitted={() => {
              setPage(1)
              void reload()
            }}
          />
        }
      />

      {loading ? (
        <p className="mb-3 text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}

      <ReviewsList
        reviews={pageResult.items}
        showProductLink={false}
        emptyMessage={t('emptyProduct')}
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
