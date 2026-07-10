'use client'

import type { ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CATALOG_PAGE_SIZE } from '@/lib/catalog/constants'
import { getVisiblePageNumbers } from '@/lib/catalog/pagination'
import { formatNumberForLocale } from '@/lib/i18n/intl-locale'
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
        'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        active
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
          : 'text-foreground hover:bg-primary/10 hover:text-primary',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  )
}

function NavArrowButton({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: ReactNode
  disabled?: boolean
  onClick?: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-all duration-200',
        'hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  )
}

export function CatalogPaginationControls({
  page,
  totalPages,
  total,
  shownCount,
  disabled,
  onPageChange,
  className,
}: {
  page: number
  totalPages: number
  total: number
  shownCount: number
  disabled?: boolean
  onPageChange: (page: number) => void
  className?: string
}) {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const tc = useTranslations('common')

  if (totalPages <= 1 && total <= shownCount) return null

  const pages = getVisiblePageNumbers(page, totalPages)
  const showJumpArrows = totalPages > 5

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <nav aria-label={t('paginationLabel')} className="flex items-center justify-center gap-1 sm:gap-1.5">
        {showJumpArrows ? (
          <NavArrowButton
            ariaLabel={t('firstPage')}
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </NavArrowButton>
        ) : null}

        <NavArrowButton
          ariaLabel={t('prevPage')}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </NavArrowButton>

        <div className="flex items-center gap-0.5 px-1 sm:gap-1 sm:px-2">
          {pages.map((entry, index) =>
            entry === 'ellipsis' ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-9 w-8 items-center justify-center text-muted-foreground"
                aria-hidden
              >
                …
              </span>
            ) : (
              <PageButton
                key={entry}
                active={entry === page}
                disabled={disabled}
                ariaLabel={t('pageN', { n: entry })}
                onClick={() => {
                  if (entry !== page) onPageChange(entry)
                }}
              >
                {entry}
              </PageButton>
            ),
          )}
        </div>

        <NavArrowButton
          ariaLabel={t('nextPage')}
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </NavArrowButton>

        {showJumpArrows ? (
          <NavArrowButton
            ariaLabel={t('lastPage')}
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </NavArrowButton>
        ) : null}
      </nav>

      <p className="text-sm text-muted-foreground">
        {t('loadedOf', {
          shown: formatNumberForLocale(shownCount, locale),
          total: formatNumberForLocale(total, locale),
        })}
      </p>
    </div>
  )
}

export function CatalogLoadMoreButton({
  loading,
  disabled,
  remaining,
  onClick,
}: {
  loading?: boolean
  disabled?: boolean
  remaining: number
  onClick: () => void
}) {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const tc = useTranslations('common')

  if (remaining <= 0) return null

  const batchSize = Math.min(remaining, CATALOG_PAGE_SIZE)

  return (
    <div className="flex flex-col items-center pt-4">
      <div className="mb-5 h-px w-full max-w-md bg-border/50" aria-hidden />
      <Button
        type="button"
        variant="ghost"
        disabled={disabled || loading}
        onClick={onClick}
        className={cn(
          'group h-10 gap-2 rounded-lg px-5 text-sm font-medium text-muted-foreground',
          'hover:bg-transparent hover:text-primary',
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {tc('loading')}
          </>
        ) : (
          <>
            {t('showMore')}
            <span className="font-normal text-muted-foreground/80">
              ({formatNumberForLocale(batchSize, locale)})
            </span>
            <ChevronDown className="h-4 w-4 opacity-50 transition-transform group-hover:translate-y-0.5" />
          </>
        )}
      </Button>
    </div>
  )
}
