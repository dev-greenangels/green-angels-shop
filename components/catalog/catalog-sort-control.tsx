'use client'

import type { ReactNode } from 'react'
import { ArrowDownWideNarrow } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  CatalogSortSheet,
  CatalogSortToolbarPanel,
  CATALOG_SORT_PANEL_ID,
} from '@/components/catalog/catalog-sort-sheet'
import {
  StickyToolbarPanel,
  StickyToolbarRow,
  StickyToolbarShell,
  useStickyToolbarOptional,
} from '@/components/layout/sticky-toolbar-shell'
import { CATALOG_SORT_OPTIONS } from '@/lib/catalog/sort-options'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type CatalogSortControlProps = {
  sortBy: string
  onSortChange: (value: string) => void
  className?: string
  /** Controls on the left (e.g. view mode). Sort stays on the right. */
  leading?: ReactNode
  /** @deprecated Prefer `leading` — kept for callers that still pass trailing. */
  trailing?: ReactNode
  /** When true, wrap with StickyToolbarShell (default). Set false if already inside a shell. */
  withShell?: boolean
}

function CatalogSortControlInner({
  sortBy,
  onSortChange,
  className,
  leading,
}: Omit<CatalogSortControlProps, 'withShell' | 'trailing'>) {
  return (
    <>
      <StickyToolbarRow className={cn('justify-between', className)}>
        <div className="flex shrink-0 items-center gap-1.5">{leading}</div>
        <CatalogSortSheet sortBy={sortBy} onSortChange={onSortChange} variant="icon" />
      </StickyToolbarRow>
      <StickyToolbarPanel id={CATALOG_SORT_PANEL_ID}>
        <CatalogSortToolbarPanel sortBy={sortBy} onSortChange={onSortChange} />
      </StickyToolbarPanel>
    </>
  )
}

export function CatalogSortControl({
  sortBy,
  onSortChange,
  className,
  leading,
  trailing,
  withShell = true,
}: CatalogSortControlProps) {
  const tCatalog = useTranslations('catalog')
  const parentToolbar = useStickyToolbarOptional()
  const leftControls = leading ?? trailing

  const desktopSelect = (
    <Select value={sortBy} onValueChange={onSortChange}>
      <SelectTrigger
        size="sm"
        className={cn('hidden h-8 w-[9.5rem] gap-1.5 px-2.5 lg:inline-flex', className)}
      >
        <ArrowDownWideNarrow className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATALOG_SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {tCatalog(`sort.${option.value}` as 'sort.name')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (parentToolbar || !withShell) {
    return (
      <>
        <div className="lg:hidden">
          <CatalogSortSheet
            sortBy={sortBy}
            onSortChange={onSortChange}
            variant="icon"
            className={className}
          />
        </div>
        {desktopSelect}
      </>
    )
  }

  return (
    <>
      <div className="lg:hidden">
        <StickyToolbarShell>
          <CatalogSortControlInner
            sortBy={sortBy}
            onSortChange={onSortChange}
            className={className}
            leading={leftControls}
          />
        </StickyToolbarShell>
      </div>
      <div className="mb-6 hidden items-center justify-between gap-3 lg:flex">
        <div className="flex shrink-0 items-center gap-1.5">{leftControls}</div>
        {desktopSelect}
      </div>
    </>
  )
}
