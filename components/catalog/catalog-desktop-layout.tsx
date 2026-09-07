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

/**
 * One products tree only (never duplicate). Desktop uses CSS grid; mobile stacks.
 * Duplicating productsSection used to mount two PaginatedCatalogGrids and broke
 * mobile filter-scroll (querySelector hit the hidden desktop anchor).
 */
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

  if (splitSidebar) {
    return (
      <div className="grid w-full grid-cols-1 items-start gap-y-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-8">
        <div
          className={cn(
            'sticky z-10 hidden self-start lg:block',
            catalogSidebarStickyTopClassName,
          )}
        >
          <CatalogCategorySidebar
            compact={collapse.compact}
            maxHeightPx={collapse.maxHeightPx}
          />
        </div>

        <div className="min-w-0 lg:col-start-2">{subcategoriesSection}</div>

        <div
          ref={filterStickyRef}
          className={cn(
            'sticky z-20 hidden self-start lg:block',
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

        <div className="min-w-0 lg:col-start-2">{productsSection}</div>
      </div>
    )
  }

  if (showFilters) {
    return (
      <div className="grid w-full grid-cols-1 items-start gap-y-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-8">
        <div
          className={cn(
            'sticky hidden flex-col gap-4 self-start lg:flex',
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
        <div className="min-w-0 space-y-10">
          {showSubcategories ? subcategoriesSection : null}
          {productsSection}
        </div>
      </div>
    )
  }

  if (showSubcategories) {
    return (
      <div className="grid w-full grid-cols-1 items-start gap-y-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-x-8">
        <div className={cn('sticky hidden self-start lg:block', catalogSidebarStickyTopClassName)}>
          <CatalogCategorySidebar />
        </div>
        <div className="min-w-0 space-y-10">
          {subcategoriesSection}
          {productsSection}
        </div>
      </div>
    )
  }

  return <div className="min-w-0">{productsSection}</div>
}
