'use client'

import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { getVisiblePageNumbers } from '@/lib/catalog/pagination'
import { cn } from '@/lib/utils'

function PageButton({
  children,
  active,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        active
          ? 'bg-primary-gradient text-primary-foreground'
          : 'text-foreground hover:bg-primary/10 hover:text-primary',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  )
}

export function ReviewsPagination({
  page,
  totalPages,
  total,
  disabled,
  onPageChange,
  className,
}: {
  page: number
  totalPages: number
  total: number
  disabled?: boolean
  onPageChange: (page: number) => void
  className?: string
}) {
  const t = useTranslations('reviews')
  const tc = useTranslations('common')

  if (totalPages <= 1) return null

  const pages = getVisiblePageNumbers(page, totalPages)

  return (
    <nav
      aria-label={t('paginationLabel')}
      className={cn('flex flex-col items-center gap-2 sm:flex-row sm:justify-between', className)}
    >
      <p className="text-xs text-muted-foreground">{tc('reviewCount', { count: total })}</p>
      <div className="flex items-center gap-1">
        <PageButton
          ariaLabel={t('prevPage')}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>
        {pages.map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
              …
            </span>
          ) : (
            <PageButton
              key={item}
              active={item === page}
              disabled={disabled}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PageButton>
          ),
        )}
        <PageButton
          ariaLabel={t('nextPage')}
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
      </div>
    </nav>
  )
}
