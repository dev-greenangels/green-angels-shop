'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ReviewSortOrder, ReviewTypeFilter } from '@/lib/reviews/types'
import { cn } from '@/lib/utils'

import { ReviewFiltersFields } from './review-filters-fields'

type ReviewFiltersProps = {
  type: ReviewTypeFilter
  rating: number | null
  sort: ReviewSortOrder
  onTypeChange: (type: ReviewTypeFilter) => void
  onRatingChange: (rating: number | null) => void
  onSortChange: (sort: ReviewSortOrder) => void
  showTypeFilter?: boolean
  showSortFilter?: boolean
  className?: string
}

export function hasActiveReviewFilters(
  type: ReviewTypeFilter,
  rating: number | null,
  sort: ReviewSortOrder,
  options?: { showTypeFilter?: boolean; showSortFilter?: boolean },
): boolean {
  if (options?.showTypeFilter !== false && type !== 'all') return true
  if (rating !== null) return true
  if (options?.showSortFilter !== false && sort !== 'newest') return true
  return false
}

export function ReviewFiltersBar({
  type,
  rating,
  sort,
  onTypeChange,
  onRatingChange,
  onSortChange,
  showTypeFilter = true,
  showSortFilter = true,
  className,
}: ReviewFiltersProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-background/70 p-3 shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      <ReviewFiltersFields
        type={type}
        rating={rating}
        sort={sort}
        onTypeChange={onTypeChange}
        onRatingChange={onRatingChange}
        onSortChange={onSortChange}
        showTypeFilter={showTypeFilter}
        showSortFilter={showSortFilter}
      />
    </div>
  )
}

export function ReviewFiltersSheet({
  type,
  rating,
  sort,
  onTypeChange,
  onRatingChange,
  onSortChange,
  showTypeFilter = true,
  showSortFilter = true,
  className,
}: ReviewFiltersProps) {
  const t = useTranslations('reviews')
  const [open, setOpen] = useState(false)
  const active = hasActiveReviewFilters(type, rating, sort, { showTypeFilter, showSortFilter })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className={cn('h-9 shrink-0 gap-1.5 px-3 text-sm', className)}>
          <Filter className="h-4 w-4 shrink-0" />
          <span>{t('filter')}</span>
          {active ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{t('filtersTitle')}</SheetTitle>
          <SheetDescription className="sr-only">{t('filtersDescription')}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 pb-4">
          <ReviewFiltersFields
            type={type}
            rating={rating}
            sort={sort}
            onTypeChange={onTypeChange}
            onRatingChange={onRatingChange}
            onSortChange={onSortChange}
            showTypeFilter={showTypeFilter}
            showSortFilter={showSortFilter}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
