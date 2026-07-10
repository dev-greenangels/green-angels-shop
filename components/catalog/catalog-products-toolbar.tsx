'use client'

import { useTranslations } from 'next-intl'

import { CatalogActiveFilters } from '@/components/catalog/catalog-active-filters'
import { CatalogFilterSheet } from '@/components/catalog/filter-sidebar'
import type { CatalogFiltersState } from '@/components/catalog/filter-sidebar'
import { CatalogSortSheet } from '@/components/catalog/catalog-sort-sheet'
import { CATALOG_SORT_OPTIONS } from '@/lib/catalog/sort-options'
import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import type { CatalogFiltersVisibilitySettings } from '@/lib/catalog/filter-visibility'
import type { CatalogFilterScope } from '@/lib/catalog/use-catalog-filter-definitions'
import { useCatalogFilterDefinitions } from '@/lib/catalog/use-catalog-filter-definitions'
import { CatalogViewModeToggle } from '@/components/catalog/catalog-view-mode-toggle'
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
    <div className={siteStickyToolbarOuterClassName}>
      <div className={cn(siteStickyToolbarInnerClassName, 'hidden flex-col items-stretch gap-2 lg:flex')}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{countText}</p>
          <div className="flex items-center gap-3">
            <CatalogViewModeToggle value={viewMode} onChange={onViewModeChange} />
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

      <div className={cn(siteStickyToolbarInnerClassName, 'flex-col items-stretch gap-2 lg:hidden')}>
        <div className="flex items-stretch gap-2">
          <CatalogFilterSheet
            filters={filters}
            onFilterChange={onFilterChange}
            filterScope={filterScope}
            filterVisibility={filterVisibility}
            filterDefinitionsOptions={filterDefinitionsOptions}
          />
          <CatalogSortSheet sortBy={sortBy} onSortChange={onSortChange} />
          <CatalogViewModeToggle value={viewMode} onChange={onViewModeChange} />
        </div>

        <p className="text-sm text-muted-foreground">{countText}</p>

        <CatalogActiveFilters
          filters={filters}
          definitions={definitions}
          priceBounds={priceBounds}
          onFilterChange={onFilterChange}
        />
      </div>
    </div>
  )
}
