'use client'

import { useTranslations } from 'next-intl'

import type { ReviewStoreReply as ReviewStoreReplyType } from '@/lib/reviews/types'
import { formatReviewDate, formatReviewDateTime } from '@/lib/reviews/utils'
import { cn } from '@/lib/utils'

type ReviewStoreReplyProps = {
  reply: ReviewStoreReplyType
  className?: string
  variant?: 'standalone' | 'embedded'
  showTime?: boolean
}

export function ReviewStoreReply({
  reply,
  className,
  variant = 'standalone',
  showTime = false,
}: ReviewStoreReplyProps) {
  const t = useTranslations('reviews')
  const dateLabel = showTime
    ? formatReviewDateTime(reply.createdAt)
    : formatReviewDate(reply.createdAt)

  if (variant === 'embedded') {
    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <p className="text-xs font-semibold tracking-wide text-primary">
            {t('storeReply')}
            <span className="font-normal text-muted-foreground"> · {reply.authorName}</span>
          </p>
          <time className="text-[11px] text-muted-foreground" dateTime={reply.createdAt}>
            {dateLabel}
          </time>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{reply.text}</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-primary/15 bg-primary/[0.04] px-3 py-2.5',
        className,
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p className="text-xs font-semibold text-primary">
          {t('storeReply')}
          <span className="font-normal text-muted-foreground"> · {reply.authorName}</span>
        </p>
        <time className="text-[11px] text-muted-foreground" dateTime={reply.createdAt}>
          {dateLabel}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{reply.text}</p>
    </div>
  )
}
