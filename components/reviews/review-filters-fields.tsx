'use client'

import type { ReactNode } from 'react'
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
    <div className={cn('min-w-0 space-y-1.5', className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
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
}: {
  type: ReviewTypeFilter
  rating: number | null
  sort: ReviewSortOrder
  onTypeChange: (type: ReviewTypeFilter) => void
  onRatingChange: (rating: number | null) => void
  onSortChange: (sort: ReviewSortOrder) => void
  showTypeFilter?: boolean
  showSortFilter?: boolean
}) {
  const t = useTranslations('reviews')

  const typeOptions: Array<{ value: ReviewTypeFilter; label: string }> = [
    { value: 'all', label: t('types.all') },
    { value: 'store', label: t('types.store') },
    { value: 'product', label: t('types.product') },
  ]

  const ratingOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: t('ratings.all') },
    { value: '5', label: t('ratings.5') },
    { value: '4', label: t('ratings.4') },
    { value: '3', label: t('ratings.3') },
    { value: '2', label: t('ratings.2') },
    { value: '1', label: t('ratings.1') },
  ]

  const sortOptions: Array<{ value: ReviewSortOrder; label: string }> = [
    { value: 'newest', label: t('sort.newest') },
    { value: 'oldest', label: t('sort.oldest') },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {showTypeFilter ? (
        <FilterField label={t('filterType')}>
          <Select value={type} onValueChange={(value) => onTypeChange(value as ReviewTypeFilter)}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      ) : null}

      <FilterField label={t('filterRating')}>
        <Select
          value={rating === null ? 'all' : String(rating)}
          onValueChange={(value) => onRatingChange(value === 'all' ? null : Number(value))}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ratingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      {showSortFilter ? (
        <FilterField label={t('filterSort')}>
          <Select value={sort} onValueChange={(value) => onSortChange(value as ReviewSortOrder)}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
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
