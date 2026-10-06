'use client'

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { useMarketRegion } from '@/components/providers/market-region-provider'
import { VariantSizeLabel } from '@/components/product/variant-size-label'
import { ReviewImageLightbox } from '@/components/reviews/review-image-lightbox'
import { ReviewStoreReply } from '@/components/reviews/review-store-reply'
import { StarRating } from '@/components/reviews/star-rating'
import { Card, CardContent } from '@/components/ui/card'
import { groupReviewsForDisplay } from '@/lib/reviews/group'
import type { ReviewListItem } from '@/lib/reviews/types'
import { formatReviewDate, getReviewImages, formatPurchasedVariantLabelsLine, getReviewVerificationBadgeKey } from '@/lib/reviews/utils'
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
  const locale = useLocale()
  const marketRegion = useMarketRegion()
  const images = getReviewImages(review)
  const hasImages = images.length > 0
  const dateLabel = formatReviewDate(review.createdAt, locale, marketRegion)
  const hasStoreReply = Boolean(review.storeReply)
  const hasProduct = Boolean(review.productSlug && review.productName)
  const showProduct = showProductLink && hasProduct
  const verificationBadgeKey = getReviewVerificationBadgeKey(review.verificationType)
  const purchasedVariants =
    review.productId && review.verificationType === 'VERIFIED_PURCHASE'
      ? formatPurchasedVariantLabelsLine(review.purchasedVariantLabels)
      : null

  return (
    <Card className="gap-0 overflow-hidden border-border/80 bg-background/80 py-0 shadow-sm">
      <CardContent className="px-3 py-2.5 sm:px-3.5 sm:py-3">
        <div className="grid gap-2 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] md:items-stretch">
          {/* Ліва колонка: імʼя, зірки, фото (desktop) */}
          <div className="flex flex-col gap-1 md:min-h-0">
            <div className="flex items-start justify-between gap-2 md:block">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium leading-tight text-foreground">{review.authorName}</p>
                {verificationBadgeKey ? (
                  <p className="text-xs font-medium leading-snug text-primary">
                    ✓ {t(verificationBadgeKey)}
                  </p>
                ) : null}
                {purchasedVariants ? (
                  <p className="text-xs leading-snug text-muted-foreground">
                    {purchasedVariants.mode === 'one'
                      ? t('purchasedVariant', { label: purchasedVariants.labels[0] })
                      : t('purchasedVariants', { labels: purchasedVariants.joined })}
                  </p>
                ) : null}
              </div>
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

function OrderReviewGroupCard({
  store,
  products,
  primary,
}: {
  store: ReviewListItem | null
  products: ReviewListItem[]
  primary: ReviewListItem
}) {
  const t = useTranslations('reviews')
  const locale = useLocale()
  const marketRegion = useMarketRegion()
  const dateLabel = formatReviewDate(primary.createdAt, locale, marketRegion)
  const verificationBadgeKey = getReviewVerificationBadgeKey(primary.verificationType)
  const storeImages = store ? getReviewImages(store) : []

  return (
    <Card className="gap-0 overflow-hidden border-border/80 bg-background/80 py-0 shadow-sm">
      <CardContent className="space-y-3 px-3 py-3 sm:px-3.5 sm:py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium leading-tight text-foreground">{primary.authorName}</p>
            {verificationBadgeKey ? (
              <p className="text-xs font-medium leading-snug text-primary">
                ✓ {t(verificationBadgeKey)}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">{t('orderSubmissionLabel')}</p>
          </div>
          <p className="shrink-0 text-xs leading-snug text-muted-foreground">{dateLabel}</p>
        </div>

        {store ? (
          <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{t('storeReviewLabel')}</p>
              <StarRating rating={store.rating} showValue size="sm" />
            </div>
            {store.text.trim() ? <ReviewTextPanel review={store} /> : null}
            {storeImages.length > 0 ? (
              <ReviewImageLightbox
                images={storeImages}
                alt={t('photoFrom', { name: store.authorName })}
              />
            ) : null}
            {store.storeReply ? (
              <ReviewStoreReply reply={store.storeReply} className="mt-1" />
            ) : null}
          </div>
        ) : null}

        {products.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">{t('productReviewsLabel')}</p>
            <ul className="space-y-2">
              {products.map((product) => {
                const variants =
                  product.verificationType === 'VERIFIED_PURCHASE'
                    ? formatPurchasedVariantLabelsLine(product.purchasedVariantLabels)
                    : null
                return (
                  <li
                    key={product.id}
                    className="rounded-lg border border-border/40 bg-muted/15 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        {product.productSlug && product.productName ? (
                          <Link
                            href={`/product/${product.productSlug}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {product.productName}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground">
                            {product.productName ?? t('productFallback')}
                          </span>
                        )}
                        {variants?.labels.map((label) => (
                          <VariantSizeLabel
                            key={label}
                            label={label}
                            iconName="Container"
                            className="text-xs font-medium text-muted-foreground"
                          />
                        ))}
                      </div>
                      <StarRating rating={product.rating} showValue size="sm" />
                    </div>
                    {product.text.trim() ? (
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {product.text}
                      </p>
                    ) : null}
                    {product.storeReply ? (
                      <ReviewStoreReply reply={product.storeReply} className="mt-2" />
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

type ReviewsListProps = {
  reviews: ReviewListItem[]
  showProductLink?: boolean
  /** Collapse same-order store + product reviews into one card (main /reviews page). */
  groupByOrder?: boolean
  emptyMessage?: string
  /** Shown under the empty state (e.g. leave-review CTA on product page). */
  emptyAction?: ReactNode
}

export function ReviewsList({
  reviews,
  showProductLink = true,
  groupByOrder = showProductLink,
  emptyMessage,
  emptyAction,
}: ReviewsListProps) {
  const t = useTranslations('reviews')
  const resolvedEmpty = emptyMessage ?? t('emptyPublished')
  const displayItems = useMemo(
    () => (groupByOrder ? groupReviewsForDisplay(reviews) : reviews.map((review) => ({ kind: 'single' as const, review }))),
    [groupByOrder, reviews],
  )

  if (reviews.length === 0) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
          {resolvedEmpty}
        </p>
        {emptyAction ? (
          <div className="flex justify-center">{emptyAction}</div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {displayItems.map((item) =>
        item.kind === 'order' ? (
          <OrderReviewGroupCard
            key={item.groupId}
            store={item.store}
            products={item.products}
            primary={item.primary}
          />
        ) : (
          <ReviewCard key={item.review.id} review={item.review} showProductLink={showProductLink} />
        ),
      )}
    </div>
  )
}
