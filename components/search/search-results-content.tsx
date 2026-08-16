'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { CatalogActiveFilters } from '@/components/catalog/catalog-active-filters'
import { CatalogViewModeToggle } from '@/components/catalog/catalog-view-mode-toggle'
import { FilterSidebar } from '@/components/catalog/filter-sidebar'
import { PaginatedCatalogGrid } from '@/components/catalog/paginated-catalog-grid'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { LISTING_PRODUCT_GRID_CLASS_NAME } from '@/lib/catalog/grid-columns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCatalogSettings } from '@/components/providers/catalog-settings-provider'
import { emptyCatalogFilters } from '@/lib/catalog/filter-plants'
import type { CatalogProductsPageMeta } from '@/lib/catalog/products'
import { useCatalogFilterDefinitions } from '@/lib/catalog/use-catalog-filter-definitions'
import { useCatalogViewMode } from '@/lib/catalog/view-mode'
import {
  siteContentShellClassName,
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

type SearchResultsContentProps = {
  query: string
}

export function SearchResultsContent({ query }: SearchResultsContentProps) {
  const t = useTranslations('search')
  const tc = useTranslations('common')
  const tCatalog = useTranslations('catalog')
  const [meta, setMeta] = useState<CatalogProductsPageMeta | null>(null)
  const [filters, setFilters] = useState(emptyCatalogFilters)
  const [sortBy, setSortBy] = useState('name')
  const { viewMode, setViewMode } = useCatalogViewMode()
  const catalogSettings = useCatalogSettings()
  const filterVisibility = catalogSettings.catalogFilters

  const queryParams = useMemo(() => ({ search: query }), [query])
  const filterScope = useMemo(() => ({ search: query }), [query])
  const { definitions, priceBounds } = useCatalogFilterDefinitions(filterScope, filters)

  return (
    <div className={cn(siteContentShellClassName, 'py-8')}>
      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterSidebar
          filters={filters}
          onFilterChange={setFilters}
          filterScope={filterScope}
          filterVisibility={filterVisibility}
        />

        <div className="flex-1">
          <div className={siteStickyToolbarOuterClassName}>
            <div className={cn(siteStickyToolbarInnerClassName, 'flex-col items-stretch gap-2')}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <CatalogViewModeToggle value={viewMode} onChange={setViewMode} />
                  <p className="truncate text-sm text-muted-foreground">
                    {meta ? t('found', { count: meta.total }) : t('loadingResults')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm text-muted-foreground">{tc('sortBy')}</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">{tCatalog('sort.name')}</SelectItem>
                      <SelectItem value="price-asc">{tCatalog('sort.price-asc')}</SelectItem>
                      <SelectItem value="price-desc">{tCatalog('sort.price-desc')}</SelectItem>
                      <SelectItem value="newest">{tCatalog('sort.newest')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CatalogActiveFilters
                filters={filters}
                definitions={definitions}
                priceBounds={priceBounds}
                onFilterChange={setFilters}
              />
            </div>
          </div>

          <PaginatedCatalogGrid
            queryParams={queryParams}
            filters={filters}
            sortBy={sortBy}
            viewMode={viewMode}
            syncPageToUrl
            gridClassName={LISTING_PRODUCT_GRID_CLASS_NAME}
            onMetaChange={setMeta}
            emptyMessage={t('emptyForQuery', { query })}
          />
        </div>
      </div>

      <RecentlyViewedSection page="search" shell={false} className="mt-12" />
    </div>
  )
}
