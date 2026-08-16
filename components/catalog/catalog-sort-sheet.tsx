'use client'

import { ArrowUpDown, Check, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useStickyToolbarOptional } from '@/components/layout/sticky-toolbar-shell'
import { CATALOG_SORT_OPTIONS } from '@/lib/catalog/sort-options'
import { cn } from '@/lib/utils'

const SORT_PANEL_ID = 'sort'

type CatalogSortOptionsListProps = {
  sortBy: string
  onSortChange: (value: string) => void
  onSelect?: () => void
  className?: string
}

export function CatalogSortOptionsList({
  sortBy,
  onSortChange,
  onSelect,
  className,
}: CatalogSortOptionsListProps) {
  const tCatalog = useTranslations('catalog')

  return (
    <div className={cn('space-y-0.5', className)}>
      {CATALOG_SORT_OPTIONS.map((option) => {
        const selected = sortBy === option.value
        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-[18px] tracking-wide transition-colors',
              selected
                ? 'bg-primary/10 font-medium text-foreground'
                : 'text-foreground/75 hover:bg-white/50 hover:text-foreground dark:hover:bg-white/5',
            )}
            onClick={() => {
              onSortChange(option.value)
              onSelect?.()
            }}
          >
            <span>{tCatalog(`sort.${option.value}` as 'sort.name')}</span>
            {selected ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden /> : null}
          </button>
        )
      })}
    </div>
  )
}

type CatalogSortSheetProps = {
  sortBy: string
  onSortChange: (value: string) => void
  variant?: 'default' | 'icon'
  className?: string
  /** Panel id when nested in StickyToolbarShell (default "sort"). */
  panelId?: string
}

/** Mobile sort trigger for StickyToolbarShell — expands inline, not a Sheet. */
export function CatalogSortSheet({
  sortBy,
  onSortChange,
  variant = 'default',
  className,
  panelId = SORT_PANEL_ID,
}: CatalogSortSheetProps) {
  const tc = useTranslations('common')
  const tCatalog = useTranslations('catalog')
  const toolbar = useStickyToolbarOptional()

  const sortLabel =
    CATALOG_SORT_OPTIONS.some((option) => option.value === sortBy)
      ? tCatalog(`sort.${sortBy}` as 'sort.name')
      : tCatalog('sort.fallback')

  const open = toolbar?.isOpen(panelId) ?? false

  return (
    <Button
      type="button"
      variant="outline"
      size={variant === 'icon' ? 'icon-sm' : 'default'}
      className={cn(
        variant === 'icon'
          ? 'size-8 shrink-0 shadow-xs'
          : 'h-9 min-h-9 flex-1 min-w-0 gap-2 px-3 text-sm',
        open && 'border-primary/40 bg-primary/10 text-primary',
        className,
      )}
      aria-label={sortLabel}
      aria-expanded={open}
      onClick={() => toolbar?.togglePanel(panelId)}
    >
      {open ? (
        <X className="h-4 w-4 shrink-0" />
      ) : (
        <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      {variant === 'icon' ? (
        <span className="sr-only">{open ? tc('close') : sortLabel}</span>
      ) : (
        <span className="truncate">{sortLabel}</span>
      )}
    </Button>
  )
}

export function CatalogSortToolbarPanel({
  sortBy,
  onSortChange,
  panelId = SORT_PANEL_ID,
}: {
  sortBy: string
  onSortChange: (value: string) => void
  panelId?: string
}) {
  const tc = useTranslations('common')
  const toolbar = useStickyToolbarOptional()

  return (
    <div>
      <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">{tc('sortLabel')}</p>
      <CatalogSortOptionsList
        sortBy={sortBy}
        onSortChange={onSortChange}
        onSelect={() => toolbar?.setOpenPanel(null)}
      />
    </div>
  )
}

export { SORT_PANEL_ID as CATALOG_SORT_PANEL_ID }
