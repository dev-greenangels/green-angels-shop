'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { ReviewLeaveFlow } from '@/components/reviews/review-leave-flow'
import { ReviewsList } from '@/components/reviews/reviews-list'
import { ReviewsPagination } from '@/components/reviews/reviews-pagination'
import { ReviewsStickyToolbar } from '@/components/reviews/reviews-sticky-toolbar'
import { fetchPublishedReviews } from '@/lib/reviews/fetch'
import type { ReviewSortOrder, ReviewsPageResult, ReviewTypeFilter } from '@/lib/reviews/types'
import { REVIEWS_PAGE_SIZE } from '@/lib/reviews/types'

type ReviewsPageContentProps = {
  initialPage: ReviewsPageResult
}

export function ReviewsPageContent({ initialPage }: ReviewsPageContentProps) {
  const t = useTranslations('reviews')
  const [pageResult, setPageResult] = useState(initialPage)
  const [type, setType] = useState<ReviewTypeFilter>('all')
  const [rating, setRating] = useState<number | null>(null)
  const [sort, setSort] = useState<ReviewSortOrder>('newest')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPublishedReviews({
        type,
        rating: rating ?? undefined,
        sort,
        page,
        pageSize: REVIEWS_PAGE_SIZE,
      })
      setPageResult(data)
    } finally {
      setLoading(false)
    }
  }, [type, rating, sort, page])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleTypeChange = (next: ReviewTypeFilter) => {
    setType(next)
    setPage(1)
  }

  const handleRatingChange = (next: number | null) => {
    setRating(next)
    setPage(1)
  }

  const handleSortChange = (next: ReviewSortOrder) => {
    setSort(next)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <ReviewsStickyToolbar
        type={type}
        rating={rating}
        sort={sort}
        onTypeChange={handleTypeChange}
        onRatingChange={handleRatingChange}
        onSortChange={handleSortChange}
        hintText={t('moderationHint')}
        leaveReviewAction={<ReviewLeaveFlow onSubmitted={() => void reload()} />}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      ) : null}

      <ReviewsList reviews={pageResult.items} />

      <ReviewsPagination
        page={pageResult.page}
        totalPages={pageResult.totalPages}
        total={pageResult.total}
        disabled={loading}
        onPageChange={setPage}
      />
    </div>
  )
}
