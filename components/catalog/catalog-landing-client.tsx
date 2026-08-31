'use client'

import { useMemo, useState } from 'react'
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
import { catalogRootBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import type { CatalogRootNode } from '@/lib/catalog/catalog-root'
import {
  getCatalogPageFromSearchParams,
  shouldShowCategoryFooterContent,
} from '@/lib/catalog/category-footer'
import { shouldShowProducts, shouldShowSubcategories } from '@/lib/catalog/display'
import type { CatalogCategory } from '@/lib/catalog/types'
import { emptyCatalogFilters } from '@/lib/catalog/filter-plants'
import { useCatalogSettings } from '@/components/providers/catalog-settings-provider'
import { useCatalogViewMode } from '@/lib/catalog/view-mode'
import { buildCatalogFacetFetchKey, buildCatalogProductsFetchKey } from '@/lib/catalog/ssr-keys'
import type { CatalogCategoryDisplay } from '@/lib/settings/types'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'
import { useCatalogScrollRestore } from '@/lib/use-catalog-scroll-restore'

type CatalogLandingClientProps = {
  catalogRoot: CatalogRootNode | null
  subcategories: CatalogCategory[]
  productCategorySlug?: string
  categoryDisplay: CatalogCategoryDisplay
  initialProducts?: PaginatedCatalogGridInitialData
  initialFilterDefinitions: CatalogFilterDefinitions
  unavailable?: boolean
  initialPage: number
  initialSort: string
}

export function CatalogLandingClient({
  catalogRoot,
  subcategories,
  productCategorySlug,
  categoryDisplay,
  initialProducts,
  initialFilterDefinitions,
  unavailable = false,
  initialPage,
  initialSort,
}: CatalogLandingClientProps) {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const te = useTranslations('errors')
  const searchParams = useSearchParams()
  const numberLocale = intlLocaleForApp(locale)

  const [meta, setMeta] = useState(initialProducts?.meta ?? null)
  const [filters, setFilters] = useState(emptyCatalogFilters)
  const [sortBy, setSortBy] = useState(initialSort)
  const { viewMode, setViewMode } = useCatalogViewMode()
  const catalogSettings = useCatalogSettings()
  const filterVisibility = catalogSettings.catalogFilters

  const childCount = subcategories.length
  const showSubcategories = shouldShowSubcategories(categoryDisplay, childCount)
  const showProducts = shouldShowProducts(categoryDisplay, childCount)
  const syncPageToUrl = showProducts
  const currentPage = syncPageToUrl ? getCatalogPageFromSearchParams(searchParams) : 1
  const showFooter = shouldShowCategoryFooterContent(catalogRoot?.footerDescription, {
    showProducts,
    currentPage,
  })

  const pageTitle = catalogRoot?.name ?? t('titlePlants')
  const pageDescription = catalogRoot?.description?.trim() || t('defaultDescription')

  const productQueryParams = useMemo(
    () => (productCategorySlug ? { categorySlug: productCategorySlug, locale } : { locale }),
    [locale, productCategorySlug],
  )
  const filterScope = useMemo(
    () => (productCategorySlug ? { categorySlug: productCategorySlug } : undefined),
    [productCategorySlug],
  )
  const filterDefinitionsOptions = useMemo(
    () => ({
      initialDefinitions: initialFilterDefinitions,
      initialFetchKey: buildCatalogFacetFetchKey(filterScope ?? {}, emptyCatalogFilters()),
    }),
    [filterScope, initialFilterDefinitions],
  )
  const productsInitialFetchKey = useMemo(
    () =>
      initialProducts
        ? buildCatalogProductsFetchKey(
            productQueryParams,
            initialSort,
            emptyCatalogFilters(),
            initialPage,
          )
        : undefined,
    [initialPage, initialProducts, initialSort, productQueryParams],
  )

  const scrollReady = !showProducts || meta !== null
  useCatalogScrollRestore(scrollReady)

  if (unavailable && subcategories.length === 0 && !showProducts) {
    return (
      <>
        <CatalogPageHeader
          breadcrumbs={catalogRootBreadcrumbs(pageTitle, catalogRoot?.slug)}
          title={pageTitle}
          description={pageDescription}
        />
        <div className={cn(siteContentShellClassName, 'py-16')}>
          <ServiceUnavailableNotice message={te('catalogUnavailable')} className="mx-auto max-w-lg" />
        </div>
      </>
    )
  }

  return (
    <>
      <CatalogPageHeader
        breadcrumbs={catalogRootBreadcrumbs(pageTitle, catalogRoot?.slug)}
        title={pageTitle}
        description={pageDescription}
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
                <CategoryCardsGrid categories={subcategories} />
              </section>
            ) : null
          }
          productsSection={
            showProducts && initialProducts ? (
              <section className={cn(showSubcategories && 'border-t border-border/70 pt-10 md:pt-12')}>
                {showSubcategories ? (
                  <h2 className="mb-6 font-serif text-2xl font-semibold text-foreground">
                    {catalogRoot ? t('categoryProducts') : t('allProducts')}
                  </h2>
                ) : null}
                <CatalogProductsToolbar
                  countText={
                    meta
                      ? catalogRoot
                        ? t('plantsInCategory', {
                            count: meta.total.toLocaleString(numberLocale),
                          })
                        : t('plantsInCatalog', {
                            count: meta.total.toLocaleString(numberLocale),
                          })
                      : t('loadingCatalog')
                  }
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
                  queryParams={productQueryParams}
                  filters={filters}
                  sortBy={sortBy}
                  viewMode={viewMode}
                  syncPageToUrl={syncPageToUrl}
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

      {showFooter && catalogRoot?.footerDescription ? (
        <CatalogCategoryFooter content={catalogRoot.footerDescription} />
      ) : null}

      <RecentlyViewedSection page="catalog" />
    </>
  )
}
