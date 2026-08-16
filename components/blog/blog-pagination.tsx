import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { getVisiblePageNumbers } from '@/lib/catalog/pagination'
import { cn } from '@/lib/utils'

function pageHref(page: number, sort: 'newest' | 'oldest') {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (sort !== 'newest') params.set('sort', sort)
  const qs = params.toString()
  return qs ? `/blog?${qs}` : '/blog'
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ariaLabel,
}: {
  href: string
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  ariaLabel?: string
}) {
  const className = cn(
    'inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    active
      ? 'bg-primary-gradient text-primary-foreground'
      : 'text-foreground hover:bg-primary/10 hover:text-primary',
    disabled && 'pointer-events-none opacity-40',
  )

  if (disabled || active) {
    return (
      <span aria-label={ariaLabel} aria-current={active ? 'page' : undefined} className={className}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  )
}

export function BlogPagination({
  page,
  totalPages,
  total,
  sort,
  className,
}: {
  page: number
  totalPages: number
  total: number
  sort: 'newest' | 'oldest'
  className?: string
}) {
  if (totalPages <= 1) return null

  const pages = getVisiblePageNumbers(page, totalPages)

  return (
    <nav
      aria-label="Пагінація блогу"
      className={cn('flex flex-col items-center gap-2 sm:flex-row sm:justify-between', className)}
    >
      <p className="text-xs text-muted-foreground">
        {total} {total === 1 ? 'стаття' : total < 5 ? 'статті' : 'статей'}
      </p>
      <div className="flex items-center gap-1">
        <PageLink
          href={pageHref(page - 1, sort)}
          disabled={page <= 1}
          ariaLabel="Попередня сторінка"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageLink>
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <PageLink key={item} href={pageHref(item, sort)} active={item === page}>
              {item}
            </PageLink>
          ),
        )}
        <PageLink
          href={pageHref(page + 1, sort)}
          disabled={page >= totalPages}
          ariaLabel="Наступна сторінка"
        >
          <ChevronRight className="h-4 w-4" />
        </PageLink>
      </div>
    </nav>
  )
}
