'use client'

import type { ReactNode } from 'react'

import { ReviewFiltersBar, ReviewFiltersSheet } from '@/components/reviews/review-filters'
import type { ReviewSortOrder, ReviewTypeFilter } from '@/lib/reviews/types'
import {
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

type ReviewsStickyToolbarProps = {
  type: ReviewTypeFilter
  rating: number | null
  sort: ReviewSortOrder
  onTypeChange: (type: ReviewTypeFilter) => void
  onRatingChange: (rating: number | null) => void
  onSortChange: (sort: ReviewSortOrder) => void
  showTypeFilter?: boolean
  showSortFilter?: boolean
  leaveReviewAction: ReactNode
  hintText?: string
  className?: string
}

export function ReviewsStickyToolbar({
  type,
  rating,
  sort,
  onTypeChange,
  onRatingChange,
  onSortChange,
  showTypeFilter = true,
  showSortFilter = true,
  leaveReviewAction,
  hintText,
  className,
}: ReviewsStickyToolbarProps) {
  return (
    <div className={cn(siteStickyToolbarOuterClassName, 'mb-4', className)}>
      <div className={cn(siteStickyToolbarInnerClassName, 'items-stretch gap-2 lg:hidden')}>
        <ReviewFiltersSheet
          type={type}
          rating={rating}
          sort={sort}
          onTypeChange={onTypeChange}
          onRatingChange={onRatingChange}
          onSortChange={onSortChange}
          showTypeFilter={showTypeFilter}
          showSortFilter={showSortFilter}
        />
        <div className="min-w-0 flex-1 [&_button]:w-full">{leaveReviewAction}</div>
      </div>

      <div className={cn(siteStickyToolbarInnerClassName, 'hidden flex-col items-stretch gap-2 lg:flex')}>
        <div className="flex items-center justify-between gap-4">
          {hintText ? <p className="text-sm text-muted-foreground">{hintText}</p> : <span />}
          {leaveReviewAction}
        </div>
        <ReviewFiltersBar
          type={type}
          rating={rating}
          sort={sort}
          onTypeChange={onTypeChange}
          onRatingChange={onRatingChange}
          onSortChange={onSortChange}
          showTypeFilter={showTypeFilter}
          showSortFilter={showSortFilter}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </div>
  )
}
