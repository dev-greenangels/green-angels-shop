'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { CatalogCategoryFooter } from '@/components/catalog/catalog-category-footer'
import { CatalogPageHeader } from '@/components/catalog/catalog-page-header'
import { CatalogDesktopLayout } from '@/components/catalog/catalog-desktop-layout'
import { CatalogProductsToolbar } from '@/components/catalog/catalog-products-toolbar'
import { CategoryCardsGrid } from '@/components/catalog/category-cards-grid'
import {
  PaginatedCatalogGrid,
  type PaginatedCatalogGridInitialData,
} from '@/components/catalog/paginated-catalog-grid'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import type { CatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import { categoryPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import {
  getCatalogPageFromSearchParams,
  shouldShowCategoryFooterContent,
} from '@/lib/catalog/category-footer'
import type { CatalogCategoryDetail } from '@/lib/catalog/categories'
import type { CatalogCategory } from '@/lib/catalog/types'
import { emptyCatalogFilters } from '@/lib/catalog/filter-plants'
import { useCatalogSettings } from '@/components/providers/catalog-settings-provider'
import { useCatalogViewMode } from '@/lib/catalog/view-mode'
import { buildCatalogFacetFetchKey, buildCatalogProductsFetchKey } from '@/lib/catalog/ssr-keys'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'
import { useCatalogScrollRestore } from '@/lib/use-catalog-scroll-restore'

type CategoryCatalogClientProps = {
  categorySlug: string
  category: CatalogCategoryDetail
  visibleCards: CatalogCategory[]
  catalogRootSlug: string | null
  initialProducts: PaginatedCatalogGridInitialData
  initialFilterDefinitions: CatalogFilterDefinitions
  unavailable?: boolean
  initialPage: number
  initialSort: string
}

export function CategoryCatalogClient({
  categorySlug,
  category,
  visibleCards,
  catalogRootSlug,
  initialProducts,
  initialFilterDefinitions,
  unavailable = false,
  initialPage,
  initialSort,
}: CategoryCatalogClientProps) {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const te = useTranslations('errors')
  const searchParams = useSearchParams()
  const numberLocale = intlLocaleForApp(locale)

  const [meta, setMeta] = useState(initialProducts.meta)
  const [filters, setFilters] = useState(emptyCatalogFilters)
  const [sortBy, setSortBy] = useState(initialSort)
  const { viewMode, setViewMode } = useCatalogViewMode()
  const catalogSettings = useCatalogSettings()
  const filterVisibility = catalogSettings.catalogFilters

  const categoryQueryParams = useMemo(
    () => ({ categorySlug, locale }),
    [categorySlug, locale],
  )
  const filterScope = useMemo(() => ({ categorySlug }), [categorySlug])
  const filterDefinitionsOptions = useMemo(
    () => ({
      initialDefinitions: initialFilterDefinitions,
      initialFetchKey: buildCatalogFacetFetchKey(filterScope, emptyCatalogFilters()),
    }),
    [initialFilterDefinitions, filterScope],
  )
  const productsInitialFetchKey = useMemo(
    () =>
      buildCatalogProductsFetchKey(
        categoryQueryParams,
        initialSort,
        emptyCatalogFilters(),
        initialPage,
      ),
    [categoryQueryParams, initialPage, initialSort],
  )

  const childCount = visibleCards.length
  const showSubcategories = childCount > 0
  const showProducts = true
  const currentPage = getCatalogPageFromSearchParams(searchParams)
  const showFooter = shouldShowCategoryFooterContent(category.footerDescription, {
    showProducts,
    currentPage,
  })
  const breadcrumbs = useMemo(
    () => categoryPageBreadcrumbs(category.breadcrumbs, catalogRootSlug),
    [category, catalogRootSlug],
  )

  const scrollReady = meta !== null
  useCatalogScrollRestore(scrollReady)

  useEffect(() => {
    setMeta(initialProducts.meta)
  }, [initialProducts.meta])

  if (unavailable) {
    return (
      <div className="flex flex-1 flex-col">
        <CatalogPageHeader
          breadcrumbs={breadcrumbs}
          title={category.name}
          description={category.description || undefined}
        />
        <div className={cn(siteContentShellClassName, 'py-16')}>
          <ServiceUnavailableNotice message={te('catalogUnavailable')} className="mx-auto max-w-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <CatalogPageHeader
        breadcrumbs={breadcrumbs}
        title={category.name}
        description={category.description || undefined}
        footer={
          showProducts && meta ? (
            <p className="text-sm text-muted-foreground">
              {t('productsInCategory', { count: meta.total.toLocaleString(numberLocale) })}
            </p>
          ) : null
        }
      />

      <div className={cn(siteContentShellClassName, 'py-8 [overflow-anchor:none]')}>
        <CatalogDesktopLayout
          showFilters={showProducts}
          showSubcategories={showSubcategories}
          filters={filters}
          onFilterChange={setFilters}
          filterScope={filterScope}
          filterVisibility={filterVisibility}
          filterDefinitionsOptions={filterDefinitionsOptions}
          subcategoriesSection={
            showSubcategories ? (
              <section>
                <h2 className="mb-6 font-serif text-2xl font-semibold text-foreground">
                  {t('categories')}
                </h2>
                <CategoryCardsGrid
                  categories={visibleCards}
                  emptyMessage={t('emptySubcategories')}
                />
              </section>
            ) : null
          }
          productsSection={
            showProducts ? (
              <section className={cn(showSubcategories && 'border-t border-border/70 pt-10 md:pt-12')}>
                {showSubcategories ? (
                  <h2 className="mb-6 font-serif text-2xl font-semibold text-foreground">
                    {t('categoryProducts')}
                  </h2>
                ) : null}
                <CatalogProductsToolbar
                  countText={t('plantsInCategory', {
                    count: meta.total.toLocaleString(numberLocale),
                  })}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  filters={filters}
                  onFilterChange={setFilters}
                  filterScope={filterScope}
                  filterVisibility={filterVisibility}
                  filterDefinitionsOptions={filterDefinitionsOptions}
                />
                <PaginatedCatalogGrid
                  queryParams={categoryQueryParams}
                  filters={filters}
                  sortBy={sortBy}
                  viewMode={viewMode}
                  syncPageToUrl
                  onMetaChange={setMeta}
                  emptyMessage={t('emptyFiltered')}
                  initialData={initialProducts}
                  initialFetchKey={productsInitialFetchKey}
                />
              </section>
            ) : null
          }
        />
      </div>

      {showFooter && category.footerDescription ? (
        <CatalogCategoryFooter content={category.footerDescription} />
      ) : null}

      <RecentlyViewedSection page="catalogCategory" />
    </div>
  )
}
