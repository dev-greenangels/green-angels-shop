'use client'

import type { ReactNode } from 'react'

import {
  ReviewFiltersBar,
  ReviewFiltersSheet,
  ReviewFiltersToolbarPanel,
  REVIEW_FILTERS_PANEL_ID,
} from '@/components/reviews/review-filters'
import {
  StickyToolbarPanel,
  StickyToolbarRow,
  StickyToolbarShell,
} from '@/components/layout/sticky-toolbar-shell'
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
  className,
}: ReviewsStickyToolbarProps) {
  return (
    <>
      <StickyToolbarShell className={cn('mb-4 lg:hidden', className)}>
        <StickyToolbarRow className="items-stretch gap-2 px-3 py-2.5 sm:px-4">
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
        </StickyToolbarRow>
        <StickyToolbarPanel id={REVIEW_FILTERS_PANEL_ID}>
          <ReviewFiltersToolbarPanel
            type={type}
            rating={rating}
            sort={sort}
            onTypeChange={onTypeChange}
            onRatingChange={onRatingChange}
            onSortChange={onSortChange}
            showTypeFilter={showTypeFilter}
            showSortFilter={showSortFilter}
          />
        </StickyToolbarPanel>
      </StickyToolbarShell>

      <div className={cn(siteStickyToolbarOuterClassName, 'mb-4 hidden lg:block', className)}>
        <div className={cn(siteStickyToolbarInnerClassName, 'items-end gap-3 py-2.5')}>
          <div className="min-w-0 flex-1">
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
          <div className="flex shrink-0 flex-col justify-end gap-1 self-stretch">
            <p className="invisible text-[11px] font-medium leading-none sm:text-xs" aria-hidden>
              .
            </p>
            {leaveReviewAction}
          </div>
        </div>
      </div>
    </>
  )
}
