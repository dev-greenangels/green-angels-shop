'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import {
  buildCatalogActiveFilterChips,
  clearCatalogFilters,
  hasActiveCatalogFilters,
  removeCatalogFilterChip,
  type CatalogFilters,
  type CatalogPriceBounds,
} from '@/lib/catalog/filter-plants'
import { useFormatPrice } from '@/lib/commerce/use-format-price'
import { siteStickyToolbarControlsClusterClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

type CatalogActiveFiltersProps = {
  filters: CatalogFilters
  definitions: CatalogFilterDefinitions | null
  priceBounds: CatalogPriceBounds
  onFilterChange: (filters: CatalogFilters) => void
  className?: string
  /** Завжди показувати рядок (напр. «фільтри не обрані»), зі стабільною висотою */
  showEmptyState?: boolean
  /** Один ряд: чіпси з горизонтальним скролом, «Очистити все» завжди справа */
  scrollable?: boolean
}

export function CatalogActiveFilters({
  filters,
  definitions,
  priceBounds,
  onFilterChange,
  className,
  showEmptyState = false,
  scrollable = false,
}: CatalogActiveFiltersProps) {
  const t = useTranslations('filter')
  const formatAmount = useFormatPrice('shelf')

  const hasActive = definitions ? hasActiveCatalogFilters(filters, priceBounds) : false

  if (!definitions) {
    if (!showEmptyState) return null
    return (
      <div
        className={cn(
          'flex min-h-9 items-center gap-2 py-1',
          scrollable && 'min-w-0 flex-1 overflow-hidden',
          className,
        )}
      >
        <span className="shrink-0 text-sm text-muted-foreground">{t('activeFilters')}</span>
        <span className={cn('text-sm text-muted-foreground/75', scrollable && 'truncate')}>
          {t('noFiltersSelected')}
        </span>
      </div>
    )
  }

  if (!hasActive) {
    if (!showEmptyState) return null
    return (
      <div
        className={cn(
          'flex min-h-9 items-center gap-2 py-1',
          scrollable && 'min-w-0 flex-1 overflow-hidden',
          className,
        )}
      >
        <span className="shrink-0 text-sm text-muted-foreground">{t('activeFilters')}</span>
        <span className={cn('text-sm text-muted-foreground/75', scrollable && 'truncate')}>
          {t('noFiltersSelected')}
        </span>
      </div>
    )
  }

  const chips = buildCatalogActiveFilterChips(filters, definitions, priceBounds, formatAmount)

  if (scrollable) {
    return (
      <div className={cn('flex min-h-9 w-full min-w-0 items-center gap-1.5 py-1', className)}>
        <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
          {t('activeFilters')}
        </span>
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <div className="flex w-0 min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map((chip) => (
              <Badge key={chip.id} variant="secondary" className="shrink-0 gap-1 pr-1 font-normal whitespace-nowrap">
                {chip.label}
                <button
                  type="button"
                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={t('removeFilter', { label: chip.label })}
                  onClick={() => onFilterChange(removeCatalogFilterChip(filters, chip, priceBounds))}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <div className={cn(siteStickyToolbarControlsClusterClassName, 'pl-1.5')}>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7 shrink-0 rounded-full border border-border/70 bg-background shadow-sm hover:bg-muted"
            onClick={() => onFilterChange(clearCatalogFilters())}
            aria-label={t('clearAll')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-9 flex-wrap items-center gap-2 py-1', className)}>
      <span className="text-sm text-muted-foreground">{t('activeFilters')}</span>
      {chips.map((chip) => (
        <Badge key={chip.id} variant="secondary" className="gap-1 pr-1 font-normal">
          {chip.label}
          <button
            type="button"
            className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('removeFilter', { label: chip.label })}
            onClick={() => onFilterChange(removeCatalogFilterChip(filters, chip, priceBounds))}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => onFilterChange(clearCatalogFilters())}
      >
        {t('clearAll')}
      </Button>
    </div>
  )
}
