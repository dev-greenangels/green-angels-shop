'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, Loader2, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { ReviewBackstageReplyPanel } from '@/components/reviews/review-backstage-reply-panel'
import { ReviewFiltersBar } from '@/components/reviews/review-filters'
import { ReviewTextPanel } from '@/components/reviews/reviews-list'
import { StarRating } from '@/components/reviews/star-rating'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  deleteBackstageReview,
  fetchBackstageReviews,
  updateBackstageOrderReviewsStatus,
  updateBackstageReviewStatus,
} from '@/lib/backstage/reviews'
import { groupReviewsForDisplay } from '@/lib/reviews/group'
import type { ReviewListItem, ReviewStatus, ReviewTypeFilter } from '@/lib/reviews/types'
import { getReviewImages } from '@/lib/reviews/utils'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { cn } from '@/lib/utils'
import Link from 'next/link'

function statusVariant(status: ReviewStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'APPROVED':
      return 'default'
    case 'REJECTED':
      return 'destructive'
    default:
      return 'secondary'
  }
}

function BackstageReviewImages({ review }: { review: ReviewListItem }) {
  const tAria = useTranslations('aria')
  const images = getReviewImages(review)
  if (images.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((src, index) => (
        <div
          key={`${review.id}-${index}`}
          className="relative h-24 w-24 overflow-hidden rounded-lg border"
        >
          <Image
            src={src}
            alt={tAria('reviewPhoto', { n: index + 1 })}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}

function BackstageReviewHeader({
  review,
  statusLabel,
  locale,
  updatingId,
  onApprove,
  onReject,
  onDelete,
  compact = false,
}: {
  review: ReviewListItem
  statusLabel: (status: ReviewStatus) => string
  locale: string
  updatingId: string | null
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
  compact?: boolean
}) {
  const tPages = useTranslations('pages.reviews')
  const tActions = useTranslations('actions')
  const tStatus = useTranslations('status')

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {!compact ? <p className="font-medium">{review.authorName}</p> : null}
          <Badge variant={statusVariant(review.status)}>{statusLabel(review.status)}</Badge>
          <Badge variant="outline">
            {review.productId ? tStatus('aboutProduct') : tStatus('aboutStore')}
          </Badge>
        </div>
        <StarRating rating={review.rating} showValue />
        {review.productName && review.productSlug ? (
          <p className="text-sm text-muted-foreground">
            {tStatus('productLabel')}{' '}
            <Link
              href={`/product/${review.productSlug}`}
              prefetch={false}
              className="font-medium text-primary hover:underline"
              target="_blank"
            >
              {review.productName}
            </Link>
          </p>
        ) : null}
        {!compact ? (
          <p className="text-sm text-muted-foreground">
            {[review.email, review.phone].filter(Boolean).join(' · ')}
          </p>
        ) : null}
        {review.verificationType && review.verificationType !== 'NONE' ? (
          <p className="text-xs text-muted-foreground">
            {review.verificationType}
            {review.purchasedVariantLabels?.length
              ? ` · ${review.purchasedVariantLabels.join(', ')}`
              : ''}
          </p>
        ) : null}
        {!compact ? (
          <p className="text-xs text-muted-foreground">
            {formatDateTime(review.createdAt, locale, 'datetime')}
          </p>
        ) : null}
        {review.legacyId ? (
          <p className="text-xs text-muted-foreground">
            {tPages('importLegacy', {
              source: review.legacySource ?? 'legacy',
              id: review.legacyId,
            })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {review.status !== 'APPROVED' ? (
          <Button
            type="button"
            size="sm"
            disabled={updatingId === review.id}
            onClick={onApprove}
          >
            <Check className="mr-1 h-4 w-4" />
            {tActions('approve')}
          </Button>
        ) : null}
        {review.status !== 'REJECTED' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={updatingId === review.id}
            onClick={onReject}
          >
            <X className="mr-1 h-4 w-4" />
            {tActions('reject')}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function BackstageReviewsPage() {
  const tPages = useTranslations('pages.reviews')
  const tActions = useTranslations('actions')
  const tStatus = useTranslations('status')
  const tt = useTranslations('toast')
  const { locale } = useBackstageUiLocale()

  const statusFilters: Array<{ value: ReviewStatus | 'ALL'; label: string }> = [
    { value: 'ALL', label: tPages('filterAll') },
    { value: 'PENDING', label: tPages('filterPending') },
    { value: 'APPROVED', label: tPages('filterApproved') },
    { value: 'REJECTED', label: tPages('filterRejected') },
  ]

  const statusLabel = (status: ReviewStatus): string => {
    switch (status) {
      case 'PENDING':
        return tStatus('pending')
      case 'APPROVED':
        return tStatus('approved')
      case 'REJECTED':
        return tStatus('rejected')
    }
  }

  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<ReviewTypeFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReviewListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  const displayGroups = useMemo(() => groupReviewsForDisplay(reviews), [reviews])

  const loadReviews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageReviews({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        type: typeFilter,
        rating: ratingFilter ?? undefined,
      })
      setReviews(data)
    } catch (err) {
      setReviews([])
      setError(err instanceof Error ? err.message : tt('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, ratingFilter, tt])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  const handleStatus = async (id: string, status: ReviewStatus) => {
    setUpdatingId(id)
    try {
      await updateBackstageReviewStatus(id, status)
      toast.success(status === 'APPROVED' ? tt('reviewApproved') : tt('reviewRejected'))
      await loadReviews()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('statusUpdateFailed'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleOrderStatus = async (orderId: string, status: ReviewStatus) => {
    setUpdatingOrderId(orderId)
    try {
      const result = await updateBackstageOrderReviewsStatus(orderId, status)
      toast.success(
        status === 'APPROVED'
          ? tPages('batchApproved', { count: result.updated })
          : tPages('batchRejected', { count: result.updated }),
      )
      await loadReviews()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('statusUpdateFailed'))
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteBackstageReview(deleteTarget.id)
      toast.success(tt('reviewDeleted'))
      setDeleteTarget(null)
      await loadReviews()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('reviewDeleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">{tPages('title')}</h1>
            <p className="mt-1 text-muted-foreground">{tPages('subtitle')}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void loadReviews()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            {tActions('refresh')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={statusFilter === item.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <ReviewFiltersBar
            type={typeFilter}
            rating={ratingFilter}
            sort="newest"
            onTypeChange={setTypeFilter}
            onRatingChange={setRatingFilter}
            onSortChange={() => undefined}
            showSortFilter={false}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            {tPages('empty')}
          </p>
        ) : (
          <div className="space-y-4">
            {displayGroups.map((group) => {
              if (group.kind === 'single') {
                const review = group.review
                return (
                  <Card key={review.id}>
                    <CardContent className="space-y-4 p-5">
                      <BackstageReviewHeader
                        review={review}
                        statusLabel={statusLabel}
                        locale={locale}
                        updatingId={updatingId}
                        onApprove={() => void handleStatus(review.id, 'APPROVED')}
                        onReject={() => void handleStatus(review.id, 'REJECTED')}
                        onDelete={() => setDeleteTarget(review)}
                      />
                      <ReviewTextPanel review={review} />
                      <BackstageReviewImages review={review} />
                      <ReviewBackstageReplyPanel
                        review={review}
                        onUpdated={(updated) =>
                          setReviews((prev) =>
                            prev.map((item) => (item.id === updated.id ? updated : item)),
                          )
                        }
                      />
                    </CardContent>
                  </Card>
                )
              }

              const members = [
                ...(group.store ? [group.store] : []),
                ...group.products,
              ]
              const orderId = group.groupId
              const allApproved = members.every((item) => item.status === 'APPROVED')
              const allRejected = members.every((item) => item.status === 'REJECTED')
              const busy = updatingOrderId === orderId

              return (
                <Card key={orderId} className="border-primary/20">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium">{group.primary.authorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {tPages('orderGroupLabel', { count: members.length })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[group.primary.email, group.primary.phone].filter(Boolean).join(' · ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(group.primary.createdAt, locale, 'datetime')}
                          {orderId ? ` · order ${orderId.slice(0, 8)}…` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!allApproved ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleOrderStatus(orderId, 'APPROVED')}
                          >
                            {busy ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-1 h-4 w-4" />
                            )}
                            {tPages('approveAll')}
                          </Button>
                        ) : null}
                        {!allRejected ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void handleOrderStatus(orderId, 'REJECTED')}
                          >
                            <X className="mr-1 h-4 w-4" />
                            {tPages('rejectAll')}
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {members.map((review) => (
                        <div
                          key={review.id}
                          className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4"
                        >
                          <BackstageReviewHeader
                            review={review}
                            statusLabel={statusLabel}
                            locale={locale}
                            updatingId={updatingId}
                            compact
                            onApprove={() => void handleStatus(review.id, 'APPROVED')}
                            onReject={() => void handleStatus(review.id, 'REJECTED')}
                            onDelete={() => setDeleteTarget(review)}
                          />
                          <ReviewTextPanel review={review} />
                          <BackstageReviewImages review={review} />
                          <ReviewBackstageReplyPanel
                            review={review}
                            onUpdated={(updated) =>
                              setReviews((prev) =>
                                prev.map((item) => (item.id === updated.id ? updated : item)),
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tPages('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? tPages('deleteBody', { name: deleteTarget.authorName }) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tActions('cancel')}</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {tActions('delete')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
