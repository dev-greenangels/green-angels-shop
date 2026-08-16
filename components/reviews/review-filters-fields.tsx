'use client'

import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ReviewSortOrder, ReviewTypeFilter } from '@/lib/reviews/types'
import { cn } from '@/lib/utils'

function FilterField({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 space-y-1', className)}>
      <p className="text-[11px] font-medium leading-none text-muted-foreground sm:text-xs">{label}</p>
      {children}
    </div>
  )
}

function ChipButton({
  active,
  onClick,
  children,
  className,
  'aria-label': ariaLabel,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  className?: string
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-0.5 rounded-full border px-2 text-[11px] font-medium transition-colors sm:h-7 sm:px-2.5 sm:text-xs',
        active
          ? 'border-primary bg-primary-gradient text-primary-foreground shadow-sm'
          : 'border-border/80 bg-background text-foreground hover:border-primary/40 hover:bg-muted/60',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function ReviewFiltersFields({
  type,
  rating,
  sort,
  onTypeChange,
  onRatingChange,
  onSortChange,
  showTypeFilter = true,
  showSortFilter = true,
  layout = 'stack',
}: {
  type: ReviewTypeFilter
  rating: number | null
  sort: ReviewSortOrder
  onTypeChange: (type: ReviewTypeFilter) => void
  onRatingChange: (rating: number | null) => void
  onSortChange: (sort: ReviewSortOrder) => void
  showTypeFilter?: boolean
  showSortFilter?: boolean
  /** `row` — компактний один рядок (десктоп sticky). `stack` — колонка (мобільний sheet). */
  layout?: 'stack' | 'row'
}) {
  const t = useTranslations('reviews')
  const isRow = layout === 'row'

  const typeOptions: Array<{ value: ReviewTypeFilter; label: string }> = [
    { value: 'all', label: t('types.all') },
    { value: 'store', label: t('types.store') },
    { value: 'product', label: t('types.product') },
  ]

  const ratingOptions: Array<{ value: number | null; label: string; stars?: number }> = [
    { value: null, label: t('ratings.all') },
    { value: 5, label: '5', stars: 5 },
    { value: 4, label: '4', stars: 4 },
    { value: 3, label: '3', stars: 3 },
    { value: 2, label: '2', stars: 2 },
    { value: 1, label: '1', stars: 1 },
  ]

  const sortOptions: Array<{ value: ReviewSortOrder; label: string }> = [
    { value: 'newest', label: t('sort.newest') },
    { value: 'oldest', label: t('sort.oldest') },
    { value: 'rating_desc', label: t('sort.rating_desc') },
    { value: 'rating_asc', label: t('sort.rating_asc') },
  ]

  return (
    <div
      className={cn(
        isRow
          ? 'flex flex-nowrap items-end gap-3 xl:gap-4'
          : 'flex flex-col gap-4 px-1',
      )}
    >
      {showTypeFilter ? (
        <FilterField label={t('filterType')} className={isRow ? 'shrink-0' : undefined}>
          <div className={cn('flex gap-1.5', isRow ? 'flex-nowrap' : 'flex-wrap gap-2')}>
            {typeOptions.map((option) => (
              <ChipButton
                key={option.value}
                active={type === option.value}
                onClick={() => onTypeChange(option.value)}
              >
                {option.label}
              </ChipButton>
            ))}
          </div>
        </FilterField>
      ) : null}

      <FilterField label={t('filterRating')} className={isRow ? 'min-w-0 shrink' : undefined}>
        <div className={cn('flex gap-1.5', isRow ? 'flex-nowrap' : 'flex-wrap gap-2')}>
          {ratingOptions.map((option) => (
            <ChipButton
              key={String(option.value)}
              active={rating === option.value}
              aria-label={
                option.stars ? t('ratings.nStars', { count: option.stars }) : option.label
              }
              onClick={() => onRatingChange(option.value)}
              className={option.stars ? 'px-1.5 sm:px-2' : undefined}
            >
              {option.stars ? (
                <>
                  <span className="tabular-nums">{option.label}</span>
                  <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                </>
              ) : (
                option.label
              )}
            </ChipButton>
          ))}
        </div>
      </FilterField>

      {showSortFilter ? (
        <FilterField
          label={t('filterSort')}
          className={isRow ? 'w-[13.5rem] shrink-0' : 'w-full'}
        >
          <Select value={sort} onValueChange={(value) => onSortChange(value as ReviewSortOrder)}>
            <SelectTrigger size="sm" className="h-7 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      ) : null}
    </div>
  )
}
