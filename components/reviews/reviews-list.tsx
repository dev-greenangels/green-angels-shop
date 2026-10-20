'use client'

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { useMarketRegion } from '@/components/providers/market-region-provider'
import { VariantSizeLabel } from '@/components/product/variant-size-label'
import { ReviewDeliveryCountry } from '@/components/reviews/review-delivery-country'
import { ReviewImageLightbox } from '@/components/reviews/review-image-lightbox'
import { ReviewStoreReply } from '@/components/reviews/review-store-reply'
import { StarRating } from '@/components/reviews/star-rating'
import { Card, CardContent } from '@/components/ui/card'
import { groupReviewsForDisplay } from '@/lib/reviews/group'
import type { ReviewListItem } from '@/lib/reviews/types'
import {
  formatReviewDate,
  getReviewImages,
  getReviewImageThumbs,
  formatPurchasedVariantLabelsLine,
  getReviewVerificationBadgeKey,
} from '@/lib/reviews/utils'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

function ReviewTextBody({ text, className }: { text: string; className?: string }) {
  const trimmed = text.trim()
  if (!trimmed) return null
  return (
    <div
      className={cn(
        'rounded-md border border-border/30 bg-muted/15 px-2.5 py-2 sm:px-3 sm:py-2.5',
        className,
      )}
    >
      <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {trimmed}
      </p>
    </div>
  )
}

/** Backstage / legacy helper — skips empty text so rating-only rows stay compact. */
export function ReviewTextPanel({
  review,
  className,
  children,
}: {
  review: ReviewListItem
  className?: string
  children?: ReactNode
}) {
  const trimmed = review.text.trim()
  if (!trimmed && !children) return null
  return (
    <div
      className={cn(
        'rounded-md border border-border/30 bg-muted/15 px-2.5 py-2 sm:px-3 sm:py-2.5',
        className,
      )}
    >
      {trimmed ? (
        <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {trimmed}
        </p>
      ) : null}
      {children}
    </div>
  )
}

function PurchasedSizeChips({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {labels.map((label) => (
        <VariantSizeLabel
          key={label}
          label={label}
          iconName="Container"
          iconClassName="h-3.5 w-3.5"
          className="text-xs font-medium text-muted-foreground"
        />
      ))}
    </span>
  )
}

function ReviewMetaHeader({
  authorName,
  dateLabel,
  verificationBadgeKey,
  deliveryCountryCode,
  orderSubmission,
}: {
  authorName: string
  dateLabel: string
  verificationBadgeKey: 'verifiedPurchase' | 'verifiedCustomer' | null
  deliveryCountryCode?: string | null
  orderSubmission?: boolean
}) {
  const t = useTranslations('reviews')

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-medium leading-tight text-foreground">{authorName}</p>
          <ReviewDeliveryCountry code={deliveryCountryCode} />
          {verificationBadgeKey ? (
            <span className="text-xs font-medium leading-none text-primary">
              ✓ {t(verificationBadgeKey)}
            </span>
          ) : null}
        </div>
        {orderSubmission ? (
          <p className="text-xs text-muted-foreground">{t('orderSubmissionLabel')}</p>
        ) : null}
      </div>
      <time className="shrink-0 text-xs leading-snug text-muted-foreground">{dateLabel}</time>
    </div>
  )
}

function ProductNameLink({
  review,
  className,
}: {
  review: ReviewListItem
  className?: string
}) {
  const t = useTranslations('reviews')
  const name = review.productName?.trim() || t('productFallback')

  if (review.productSlug) {
    return (
      <Link
        href={`/product/${review.productSlug}`}
        className={cn('font-medium text-primary hover:underline', className)}
      >
        {name}
      </Link>
    )
  }

  return <span className={cn('font-medium text-foreground', className)}>{name}</span>
}

function ProductRatingRow({ review }: { review: ReviewListItem }) {
  const t = useTranslations('reviews')
  const variants =
    review.verificationType === 'VERIFIED_PURCHASE'
      ? formatPurchasedVariantLabelsLine(review.purchasedVariantLabels)
      : null
  const images = getReviewImages(review)
  const thumbs = getReviewImageThumbs(review)
  const text = review.text.trim()

  return (
    <li className="space-y-1.5 border-t border-border/25 pt-2.5 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <ProductNameLink review={review} className="min-w-0 break-words" />
          {variants ? <PurchasedSizeChips labels={variants.labels} /> : null}
        </div>
        <StarRating rating={review.rating} showValue size="sm" className="shrink-0" />
      </div>
      {text ? <ReviewTextBody text={text} /> : null}
      {images.length > 0 ? (
        <ReviewImageLightbox
          images={images}
          thumbs={thumbs}
          alt={t('photoFrom', { name: review.authorName })}
        />
      ) : null}
      {review.storeReply ? <ReviewStoreReply reply={review.storeReply} /> : null}
    </li>
  )
}

/** Single review card (STORE / PRODUCT filters, PDP, legacy standalone). */
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
  const thumbs = getReviewImageThumbs(review)
  const dateLabel = formatReviewDate(review.createdAt, locale, marketRegion)
  const verificationBadgeKey = getReviewVerificationBadgeKey(review.verificationType)
  const purchasedVariants =
    review.productId && review.verificationType === 'VERIFIED_PURCHASE'
      ? formatPurchasedVariantLabelsLine(review.purchasedVariantLabels)
      : null
  const isProduct = Boolean(review.productId)
  const text = review.text.trim()

  return (
    <Card className="gap-0 overflow-hidden border-border/60 bg-background/80 py-0 shadow-sm">
      <CardContent className="space-y-2 px-3 py-2.5 sm:px-3.5 sm:py-3">
        <ReviewMetaHeader
          authorName={review.authorName}
          dateLabel={dateLabel}
          verificationBadgeKey={verificationBadgeKey}
          deliveryCountryCode={review.deliveryCountryCode}
        />

        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3">
          {showProductLink && isProduct ? (
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <ProductNameLink review={review} className="min-w-0 break-words" />
              {purchasedVariants ? (
                <PurchasedSizeChips labels={purchasedVariants.labels} />
              ) : null}
            </div>
          ) : showProductLink && !isProduct ? (
            <p className="text-sm font-semibold text-foreground">{t('storeReviewLabel')}</p>
          ) : purchasedVariants ? (
            <PurchasedSizeChips labels={purchasedVariants.labels} />
          ) : (
            <span className="min-w-0 flex-1" />
          )}
          <StarRating rating={review.rating} showValue size="sm" className="shrink-0" />
        </div>

        <ReviewTextBody text={text} />

        {images.length > 0 ? (
          <ReviewImageLightbox
            images={images}
            thumbs={thumbs}
            alt={t('photoFrom', { name: review.authorName })}
          />
        ) : null}

        {review.storeReply ? <ReviewStoreReply reply={review.storeReply} /> : null}
      </CardContent>
    </Card>
  )
}

/** Unified Concept A card for one order submission (store + products). */
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
  const storeThumbs = store ? getReviewImageThumbs(store) : []
  const storeText = store?.text.trim() ?? ''
  const deliveryCountryCode =
    primary.deliveryCountryCode ??
    store?.deliveryCountryCode ??
    products.find((p) => p.deliveryCountryCode)?.deliveryCountryCode ??
    null

  return (
    <Card className="gap-0 overflow-hidden border-border/60 bg-background/80 py-0 shadow-sm">
      <CardContent className="mx-auto w-full max-w-2xl space-y-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3">
        <ReviewMetaHeader
          authorName={primary.authorName}
          dateLabel={dateLabel}
          verificationBadgeKey={verificationBadgeKey}
          deliveryCountryCode={deliveryCountryCode}
          orderSubmission
        />

        {store ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="text-sm font-semibold text-foreground">{t('storeReviewLabel')}</p>
              <StarRating rating={store.rating} showValue size="sm" />
            </div>
            <ReviewTextBody text={storeText} />
            {storeImages.length > 0 ? (
              <ReviewImageLightbox
                images={storeImages}
                thumbs={storeThumbs}
                alt={t('photoFrom', { name: store.authorName })}
              />
            ) : null}
            {store.storeReply ? <ReviewStoreReply reply={store.storeReply} /> : null}
          </div>
        ) : null}

        {products.length > 0 ? (
          <div className="space-y-1.5">
            {store ? (
              <p className="text-sm font-semibold text-foreground">{t('productReviewsLabel')}</p>
            ) : null}
            <ul className="space-y-0">
              {products.map((product) => (
                <ProductRatingRow key={product.id} review={product} />
              ))}
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
  /** Collapse same-order store + product reviews into one card (ALL filter). */
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
    () =>
      groupByOrder
        ? groupReviewsForDisplay(reviews)
        : reviews.map((review) => ({ kind: 'single' as const, review })),
    [groupByOrder, reviews],
  )

  if (reviews.length === 0) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
          {resolvedEmpty}
        </p>
        {emptyAction ? <div className="flex justify-center">{emptyAction}</div> : null}
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
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
