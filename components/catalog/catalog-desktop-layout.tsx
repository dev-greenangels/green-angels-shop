'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { CatalogCategorySidebar } from '@/components/catalog/catalog-category-sidebar'
import {
  CatalogFilterPanel,
  type CatalogFiltersState,
} from '@/components/catalog/filter-sidebar'
import { catalogSidebarStickyTopClassName } from '@/lib/catalog/sidebar-panel-styles'
import { useCatalogSidebarCollapse } from '@/lib/catalog/use-catalog-sidebar-collapse'
import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import type { CatalogFiltersVisibilitySettings } from '@/lib/catalog/filter-visibility'
import type { CatalogFilterScope } from '@/lib/catalog/use-catalog-filter-definitions'
import { cn } from '@/lib/utils'

type CatalogDesktopLayoutProps = {
  showFilters: boolean
  showSubcategories: boolean
  filters: CatalogFiltersState
  onFilterChange: (filters: CatalogFiltersState) => void
  filterScope?: CatalogFilterScope
  filterVisibility?: CatalogFiltersVisibilitySettings
  filterDefinitionsOptions?: {
    initialDefinitions?: CatalogFilterDefinitions
    initialFetchKey?: string
  }
  subcategoriesSection: ReactNode
  productsSection: ReactNode
}

export function CatalogDesktopLayout({
  showFilters,
  showSubcategories,
  filters,
  onFilterChange,
  filterScope,
  filterVisibility,
  filterDefinitionsOptions,
  subcategoriesSection,
  productsSection,
}: CatalogDesktopLayoutProps) {
  const splitSidebar = showSubcategories && showFilters
  const filterStickyRef = useRef<HTMLDivElement>(null)
  const collapse = useCatalogSidebarCollapse(filterStickyRef)
  const [filterMaxHeightPx, setFilterMaxHeightPx] = useState<number | null>(null)

  useEffect(() => {
    if (!splitSidebar) {
      setFilterMaxHeightPx(null)
      return
    }

    const update = () => {
      setFilterMaxHeightPx(
        Math.max(160, window.innerHeight - collapse.filterStickyTopPx - 16),
      )
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [splitSidebar, collapse.filterStickyTopPx])

  const filterStickyStyle: CSSProperties | undefined = collapse.filterStuck
    ? { top: collapse.filterStickyTopPx }
    : undefined

  return (
    <>
      <div
        className={cn(
          'hidden lg:grid lg:w-full lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-x-8 lg:gap-y-10',
        )}
      >
        {splitSidebar ? (
          <>
            <div
              className={cn(
                'sticky z-10 row-start-1 self-start',
                catalogSidebarStickyTopClassName,
              )}
            >
              <CatalogCategorySidebar
                compact={collapse.compact}
                maxHeightPx={collapse.maxHeightPx}
              />
            </div>
            <div className="row-start-1 min-w-0">{subcategoriesSection}</div>
            <div
              ref={filterStickyRef}
              className={cn(
                'sticky z-20 row-start-2 self-start',
                collapse.filterStuck
                  ? 'transition-[top] duration-200 ease-out'
                  : catalogSidebarStickyTopClassName,
              )}
              style={filterStickyStyle}
            >
              <div
                data-catalog-filter-sticky-sentinel
                className="pointer-events-none h-px w-full"
                aria-hidden
              />
              <CatalogFilterPanel
                filters={filters}
                onFilterChange={onFilterChange}
                filterScope={filterScope}
                filterVisibility={filterVisibility}
                filterDefinitionsOptions={filterDefinitionsOptions}
                maxHeightPx={filterMaxHeightPx}
              />
            </div>
            <div className="row-start-2 min-w-0">{productsSection}</div>
          </>
        ) : null}

        {!splitSidebar && showFilters ? (
          <>
            <div
              className={cn(
                'sticky flex flex-col gap-4 self-start',
                catalogSidebarStickyTopClassName,
              )}
            >
              <CatalogCategorySidebar />
              <CatalogFilterPanel
                filters={filters}
                onFilterChange={onFilterChange}
                filterScope={filterScope}
                filterVisibility={filterVisibility}
                filterDefinitionsOptions={filterDefinitionsOptions}
              />
            </div>
            <div className="min-w-0">{productsSection}</div>
          </>
        ) : null}

        {!splitSidebar && !showFilters && showSubcategories ? (
          <>
            <div className={cn('sticky self-start', catalogSidebarStickyTopClassName)}>
              <CatalogCategorySidebar />
            </div>
            <div className="min-w-0">{subcategoriesSection}</div>
          </>
        ) : null}
      </div>

      <div className="min-w-0 space-y-10 lg:hidden">
        {subcategoriesSection}
        {productsSection}
      </div>
    </>
  )
}
