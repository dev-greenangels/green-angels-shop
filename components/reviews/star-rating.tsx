'use client'

import { Star } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

type StarRatingProps = {
  rating: number
  size?: 'sm' | 'md'
  interactive?: boolean
  onChange?: (rating: number) => void
  showValue?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
} as const

const valueSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
} as const

export function StarRating({
  rating,
  size = 'sm',
  interactive = false,
  onChange,
  showValue = false,
  className,
}: StarRatingProps) {
  const t = useTranslations('reviews')
  const iconClass = sizeClasses[size]
  const displayRating = interactive && rating === 0 ? '—' : String(rating)

  const stars = (
    <>
      {Array.from({ length: 5 }).map((_, index) => {
        const value = index + 1
        const filled = rating > 0 && value <= rating

        if (interactive) {
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={t('stars', { count: value })}
              className="rounded-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => onChange?.(value)}
            >
              <Star
                className={cn(
                  iconClass,
                  filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/35',
                )}
              />
            </button>
          )
        }

        return (
          <Star
            key={index}
            className={cn(
              iconClass,
              filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
            )}
          />
        )
      })}
    </>
  )

  if (interactive) {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <div className="flex gap-1" role="radiogroup" aria-label={t('ratingLabel')}>
          {stars}
        </div>
        {showValue ? (
          <span className={cn('min-w-[1.25rem] font-semibold tabular-nums text-foreground', valueSizeClasses[size])}>
            {displayRating}
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-label={t('ratingOfFive', { rating })}>
      <div className="flex gap-0.5">{stars}</div>
      {showValue ? (
        <span className={cn('font-semibold tabular-nums text-foreground', valueSizeClasses[size])}>
          {rating}
        </span>
      ) : null}
    </div>
  )
}
