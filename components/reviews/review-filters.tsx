'use client'

import { Filter, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  StickyToolbarPanel,
  StickyToolbarRow,
  useStickyToolbar,
} from '@/components/layout/sticky-toolbar-shell'
import type { ReviewSortOrder, ReviewTypeFilter } from '@/lib/reviews/types'
import { cn } from '@/lib/utils'

import { ReviewFiltersFields } from './review-filters-fields'

export const REVIEW_FILTERS_PANEL_ID = 'review-filters'

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
        'rounded-xl border border-border/70 bg-background/70 p-2.5 shadow-sm backdrop-blur-sm',
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
        layout="row"
      />
    </div>
  )
}

/** Mobile filter trigger — expands inside StickyToolbarShell. */
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
  const tc = useTranslations('common')
  const { isOpen, togglePanel } = useStickyToolbar()
  const open = isOpen(REVIEW_FILTERS_PANEL_ID)
  const active = hasActiveReviewFilters(type, rating, sort, { showTypeFilter, showSortFilter })

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'h-9 shrink-0 gap-1.5 px-3 text-sm',
        open && 'border-primary/40 bg-primary/10 text-primary',
        className,
      )}
      aria-expanded={open}
      onClick={() => togglePanel(REVIEW_FILTERS_PANEL_ID)}
    >
      {open ? <X className="h-4 w-4 shrink-0" /> : <Filter className="h-4 w-4 shrink-0" />}
      <span>{open ? tc('close') : t('filter')}</span>
      {!open && active ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
    </Button>
  )
}

export function ReviewFiltersToolbarPanel({
  type,
  rating,
  sort,
  onTypeChange,
  onRatingChange,
  onSortChange,
  showTypeFilter = true,
  showSortFilter = true,
}: ReviewFiltersProps) {
  const t = useTranslations('reviews')

  return (
    <div>
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground">{t('filtersTitle')}</p>
      <ReviewFiltersFields
        type={type}
        rating={rating}
        sort={sort}
        onTypeChange={onTypeChange}
        onRatingChange={onRatingChange}
        onSortChange={onSortChange}
        showTypeFilter={showTypeFilter}
        showSortFilter={showSortFilter}
        layout="stack"
      />
    </div>
  )
}
