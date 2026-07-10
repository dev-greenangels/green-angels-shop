'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { ReviewImageLightbox } from '@/components/reviews/review-image-lightbox'
import { ReviewStoreReply } from '@/components/reviews/review-store-reply'
import { StarRating } from '@/components/reviews/star-rating'
import { Card, CardContent } from '@/components/ui/card'
import type { ReviewListItem } from '@/lib/reviews/types'
import { formatReviewDate, getReviewImages } from '@/lib/reviews/utils'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/** Фон лише під текстом коментаря клієнта */
export function ReviewTextPanel({
  review,
  className,
  children,
}: {
  review: ReviewListItem
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'min-h-0 rounded-lg border border-border/50 bg-muted/25 px-3 py-2.5 sm:px-3.5 sm:py-3',
        className,
      )}
    >
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{review.text}</p>
      {children}
    </div>
  )
}

function ReviewProductLink({
  review,
  className,
}: {
  review: ReviewListItem
  className?: string
}) {
  const t = useTranslations('reviews')

  if (!review.productSlug || !review.productName) return null

  return (
    <p className={cn('min-w-0 text-sm leading-snug md:text-base', className)}>
      <span className="font-semibold text-foreground">{t('productLabel')} </span>
      <Link
        href={`/product/${review.productSlug}`}
        className="font-semibold text-primary hover:underline"
      >
        {review.productName}
      </Link>
    </p>
  )
}

function ReviewCard({
  review,
  showProductLink,
}: {
  review: ReviewListItem
  showProductLink: boolean
}) {
  const t = useTranslations('reviews')
  const images = getReviewImages(review)
  const hasImages = images.length > 0
  const dateLabel = formatReviewDate(review.createdAt)
  const hasStoreReply = Boolean(review.storeReply)
  const hasProduct = Boolean(review.productSlug && review.productName)
  const showProduct = showProductLink && hasProduct

  return (
    <Card className="gap-0 overflow-hidden border-border/80 bg-background/80 py-0 shadow-sm">
      <CardContent className="px-3 py-2.5 sm:px-3.5 sm:py-3">
        <div className="grid gap-2 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] md:items-stretch">
          {/* Ліва колонка: імʼя, зірки, фото (desktop) */}
          <div className="flex flex-col gap-1 md:min-h-0">
            <div className="flex items-start justify-between gap-2 md:block">
              <p className="text-sm font-medium leading-tight text-foreground">{review.authorName}</p>
              {!showProduct ? (
                <p className="shrink-0 text-xs leading-snug text-muted-foreground md:hidden">{dateLabel}</p>
              ) : null}
            </div>
            {showProduct ? (
              <div className="flex items-start justify-between gap-3 md:hidden">
                <ReviewProductLink review={review} className="flex-1" />
                <p className="shrink-0 text-right text-xs leading-snug text-muted-foreground">{dateLabel}</p>
              </div>
            ) : null}
            <StarRating rating={review.rating} showValue size="sm" />
            {hasImages ? (
              <ReviewImageLightbox
                images={images}
                alt={t('photoFrom', { name: review.authorName })}
                className="mt-1 hidden flex-nowrap md:flex"
              />
            ) : null}
          </div>

          {/* Права колонка */}
          <div className="flex min-h-0 flex-col md:min-h-0">
            <div className="mb-1.5 hidden shrink-0 items-start justify-between gap-4 md:flex">
              {showProduct ? (
                <ReviewProductLink review={review} className="flex-1 pr-2" />
              ) : (
                <span className="flex-1" />
              )}
              <p className="shrink-0 text-right text-xs leading-snug text-muted-foreground">{dateLabel}</p>
            </div>

            {/* Фон коментаря розтягується на вільну висоту рядка, без відповіді всередині */}
            <ReviewTextPanel review={review} className="min-h-[3.5rem] md:min-h-0 md:flex-1" />

            {hasStoreReply && review.storeReply ? (
              <ReviewStoreReply reply={review.storeReply} className="mt-2 shrink-0" />
            ) : null}

            {hasImages ? (
              <ReviewImageLightbox
                images={images}
                alt={t('photoFrom', { name: review.authorName })}
                className="mt-2 shrink-0 md:hidden"
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type ReviewsListProps = {
  reviews: ReviewListItem[]
  showProductLink?: boolean
  emptyMessage?: string
}

export function ReviewsList({
  reviews,
  showProductLink = true,
  emptyMessage,
}: ReviewsListProps) {
  const t = useTranslations('reviews')
  const resolvedEmpty = emptyMessage ?? t('emptyPublished')
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
        {resolvedEmpty}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} showProductLink={showProductLink} />
      ))}
    </div>
  )
}
