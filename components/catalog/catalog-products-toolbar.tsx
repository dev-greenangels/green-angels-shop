'use client'

import { useTranslations } from 'next-intl'

import { CatalogActiveFilters } from '@/components/catalog/catalog-active-filters'
import {
  CatalogFilterSheet,
  CatalogFilterToolbarPanel,
  CATALOG_FILTER_PANEL_ID,
} from '@/components/catalog/filter-sidebar'
import type { CatalogFiltersState } from '@/components/catalog/filter-sidebar'
import {
  CatalogSortSheet,
  CatalogSortToolbarPanel,
  CATALOG_SORT_PANEL_ID,
} from '@/components/catalog/catalog-sort-sheet'
import { CATALOG_SORT_OPTIONS } from '@/lib/catalog/sort-options'
import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import type { CatalogFiltersVisibilitySettings } from '@/lib/catalog/filter-visibility'
import type { CatalogFilterScope } from '@/lib/catalog/use-catalog-filter-definitions'
import { useCatalogFilterDefinitions } from '@/lib/catalog/use-catalog-filter-definitions'
import { CatalogViewModeToggle } from '@/components/catalog/catalog-view-mode-toggle'
import {
  StickyToolbarPanel,
  StickyToolbarRow,
  StickyToolbarShell,
} from '@/components/layout/sticky-toolbar-shell'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CatalogViewMode } from '@/lib/catalog/view-mode'
import {
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

type CatalogProductsToolbarProps = {
  countText: string
  sortBy: string
  onSortChange: (value: string) => void
  viewMode: CatalogViewMode
  onViewModeChange: (value: CatalogViewMode) => void
  filters: CatalogFiltersState
  onFilterChange: (filters: CatalogFiltersState) => void
  filterScope?: CatalogFilterScope
  filterVisibility?: CatalogFiltersVisibilitySettings
  filterDefinitionsOptions?: {
    initialDefinitions?: CatalogFilterDefinitions
    initialFetchKey?: string
  }
}

export function CatalogProductsToolbar({
  countText,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  filterScope,
  filterVisibility,
  filterDefinitionsOptions,
}: CatalogProductsToolbarProps) {
  const tc = useTranslations('common')
  const tCatalog = useTranslations('catalog')
  const { definitions, priceBounds } = useCatalogFilterDefinitions(
    filterScope,
    filters,
    filterDefinitionsOptions,
  )

  return (
    <>
      <div className={cn(siteStickyToolbarOuterClassName, 'hidden lg:block')}>
        <div className={cn(siteStickyToolbarInnerClassName, 'flex-col items-stretch gap-2')}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <CatalogViewModeToggle value={viewMode} onChange={onViewModeChange} />
              <p className="truncate text-sm text-muted-foreground">{countText}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm text-muted-foreground">{tc('sortBy')}</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-48">
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
            </div>
          </div>

          <CatalogActiveFilters
            filters={filters}
            definitions={definitions}
            priceBounds={priceBounds}
            onFilterChange={onFilterChange}
          />
        </div>
      </div>

      <StickyToolbarShell className="lg:hidden">
        <StickyToolbarRow>
          <CatalogViewModeToggle value={viewMode} onChange={onViewModeChange} />
          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{countText}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            <CatalogFilterSheet
              filters={filters}
              onFilterChange={onFilterChange}
              filterScope={filterScope}
              filterVisibility={filterVisibility}
              filterDefinitionsOptions={filterDefinitionsOptions}
              iconOnly
            />
            <CatalogSortSheet sortBy={sortBy} onSortChange={onSortChange} variant="icon" />
          </div>
        </StickyToolbarRow>

        <StickyToolbarPanel id={CATALOG_FILTER_PANEL_ID} contentClassName="max-h-[min(70vh,28rem)]">
          <CatalogFilterToolbarPanel
            filters={filters}
            onFilterChange={onFilterChange}
            filterScope={filterScope}
            filterVisibility={filterVisibility}
            filterDefinitionsOptions={filterDefinitionsOptions}
          />
        </StickyToolbarPanel>

        <StickyToolbarPanel id={CATALOG_SORT_PANEL_ID}>
          <CatalogSortToolbarPanel sortBy={sortBy} onSortChange={onSortChange} />
        </StickyToolbarPanel>
      </StickyToolbarShell>
    </>
  )
}
