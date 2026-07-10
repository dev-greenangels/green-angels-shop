'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { StarRating } from '@/components/reviews/star-rating'
import { fetchAccountReviews, type AccountReviewItem } from '@/lib/account/api'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<AccountReviewItem['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'sk' ? 'sk-SK' : 'uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AccountReviewsContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [reviews, setReviews] = useState<AccountReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchAccountReviews()
      .then(setReviews)
      .catch((e) => setError(e instanceof Error ? e.message : t('loadError')))
      .finally(() => setLoading(false))
  }, [t])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tc('loading')}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!reviews.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-foreground">{t('reviewsEmptyTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('reviewsEmptyBody')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article
          key={review.id}
          className="rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {review.productSlug ? (
                <Link
                  href={`/product/${review.productSlug}`}
                  className="pressable font-medium text-primary hover:underline"
                >
                  {review.productName ?? tc('productFallback')}
                </Link>
              ) : (
                <p className="font-medium text-foreground">
                  {review.productName ?? tc('productFallback')}
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(review.createdAt, locale)}
              </p>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                STATUS_COLORS[review.status],
              )}
            >
              {t(`reviewStatus.${review.status}`)}
            </span>
          </div>
          <div className="mt-3">
            <StarRating rating={review.rating} size="sm" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.text}</p>
        </article>
      ))}
    </div>
  )
}
