'use client'

import { CalendarDays, UserRound } from 'lucide-react'
import { useLocale } from 'next-intl'

import { blogAuthorInitials, formatBlogDate } from '@/lib/blog/posts'
import { cn } from '@/lib/utils'

export function BlogPostMeta({
  author,
  createdAt,
  size = 'md',
  className,
}: {
  author: string
  createdAt: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const locale = useLocale()
  const compact = size === 'sm'
  const initials = blogAuthorInitials(author)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1.5 text-muted-foreground',
        compact ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      <div className="inline-flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-semibold text-primary',
            compact ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
          )}
          aria-hidden
        >
          {initials}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <UserRound className={cn('shrink-0 opacity-70', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <span className="truncate font-medium text-foreground/85">{author}</span>
        </span>
      </div>
      <span className="hidden h-3 w-px bg-border sm:inline-block" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className={cn('shrink-0 opacity-70', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        <time dateTime={createdAt}>{formatBlogDate(createdAt, locale)}</time>
      </span>
    </div>
  )
}
