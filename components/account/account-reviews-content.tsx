'use client'

import { useCallback, useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import {
  AccountPageEmpty,
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { AccountListPagination } from '@/components/account/account-list-pagination'
import { StarRating } from '@/components/reviews/star-rating'
import { ReviewStoreReply } from '@/components/reviews/review-store-reply'
import { fetchAccountReviews, type AccountReviewItem } from '@/lib/account/api'
import { productHrefFromPlant } from '@/lib/catalog/paths'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<AccountReviewItem['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}
const PAGE_SIZE = 20

export function AccountReviewsContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [reviews, setReviews] = useState<AccountReviewItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    void fetchAccountReviews({ page, pageSize: PAGE_SIZE })
      .then((data) => {
        setReviews(data.items)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('loadError')))
      .finally(() => setLoading(false))
  }, [page, t])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <AccountPageLoading />
  }

  if (error) {
    return <AccountPageError message={error} onRetry={load} />
  }

  if (!reviews.length) {
    return (
      <AccountPageEmpty
        icon={MessageSquare}
        title={t('reviewsEmptyTitle')}
        body={t('reviewsEmptyBody')}
      />
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
            <div className="min-w-0 flex-1">
              {review.productSlug ? (
                <Link
                  href={productHrefFromPlant({
                    slug: review.productSlug,
                    category: review.productCategorySlug,
                  })}
                  className="pressable break-words font-medium text-primary hover:underline"
                >
                  {review.productName ?? tc('productFallback')}
                </Link>
              ) : (
                <p className="break-words font-medium text-foreground">
                  {review.productName ?? tc('productFallback')}
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(review.createdAt, locale, 'dateLong')}
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
          <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">{review.text}</p>
          {review.storeReply ? (
            <ReviewStoreReply reply={review.storeReply} className="mt-4" />
          ) : null}
        </article>
      ))}
      <AccountListPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
        onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
      />
    </div>
  )
}
