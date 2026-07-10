'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { CatalogActiveFilters } from '@/components/catalog/catalog-active-filters'
import { CatalogAlphabetNav } from '@/components/catalog/catalog-alphabet-nav'
import { CatalogFilterSheet, FilterSidebar } from '@/components/catalog/filter-sidebar'
import { PaginatedCatalogGrid } from '@/components/catalog/paginated-catalog-grid'
import { Navigation } from '@/components/navigation'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { useCatalogSettings } from '@/components/providers/catalog-settings-provider'
import { emptyCatalogFilters } from '@/lib/catalog/filter-plants'
import { hasVisibleCatalogFilters } from '@/lib/catalog/filter-visibility'
import type { CatalogProductsPageMeta } from '@/lib/catalog/products'
import { plantsActiveFiltersStickyOuterClassName } from '@/lib/catalog/sidebar-panel-styles'
import { useCatalogFilterDefinitions } from '@/lib/catalog/use-catalog-filter-definitions'
import { usePathname, useRouter } from '@/i18n/navigation'
import {
  siteContentShellClassName,
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import { formatNumberForLocale } from '@/lib/i18n/intl-locale'
import { cn } from '@/lib/utils'

function PlantsAlphabetStickyNav({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        '--plants-alphabet-sticky-height',
        `${element.offsetHeight}px`,
      )
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(element)
    window.addEventListener('resize', syncHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncHeight)
      document.documentElement.style.removeProperty('--plants-alphabet-sticky-height')
    }
  }, [])

  return (
    <div ref={ref} className={cn(siteStickyToolbarOuterClassName, 'mb-6')}>
      <div className={siteStickyToolbarInnerClassName}>{children}</div>
    </div>
  )
}

function PlantsAlphabetActiveFiltersSticky({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        '--plants-alphabet-active-filters-height',
        `${element.offsetHeight}px`,
      )
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(element)
    window.addEventListener('resize', syncHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncHeight)
      document.documentElement.style.removeProperty('--plants-alphabet-active-filters-height')
    }
  }, [])

  return (
    <div ref={ref} className={cn(plantsActiveFiltersStickyOuterClassName, 'overflow-x-hidden')}>
      {children}
    </div>
  )
}

export function PlantsAlphabetPageContent() {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const tNav = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const letter = searchParams.get('letter')?.trim() || null
  const catalogSettings = useCatalogSettings()
  const filterVisibility = catalogSettings.plantsAlphabetFilters
  const showFilters = hasVisibleCatalogFilters(filterVisibility)

  const [meta, setMeta] = useState<CatalogProductsPageMeta | null>(null)
  const [filters, setFilters] = useState(emptyCatalogFilters)

  const queryParams = useMemo(
    () => ({
      namePrefix: letter ?? undefined,
    }),
    [letter],
  )

  const { definitions, priceBounds } = useCatalogFilterDefinitions(undefined, filters)

  const setLetter = useCallback(
    (nextLetter: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextLetter) {
        params.set('letter', nextLetter)
      } else {
        params.delete('letter')
      }
      params.delete('page')
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-gradient-to-br from-secondary via-background to-accent">
        <div className={cn(siteContentShellClassName, 'py-10 md:py-14')}>
          <ClientPublicPageBreadcrumbs
            className="mb-4"
            items={[
              { label: tNav('catalog'), href: '/catalog' },
              { label: tNav('plantsList') },
            ]}
          />

          <div className="mb-8 max-w-3xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              {t('plantsAlphabetTitle')}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('plantsAlphabetSubtitle')}</p>
            {meta ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('plantsAlphabetCount', { count: formatNumberForLocale(meta.total, locale) })}
              </p>
            ) : null}
          </div>

          <PlantsAlphabetStickyNav>
            <CatalogAlphabetNav
              embedded
              activeLetter={letter}
              onLetterChange={setLetter}
            />
          </PlantsAlphabetStickyNav>

          {showFilters ? (
            <PlantsAlphabetActiveFiltersSticky>
              <div
                className={cn(
                  siteStickyToolbarInnerClassName,
                  'flex w-full min-w-0 items-center gap-2 py-0',
                )}
              >
                <div className="shrink-0 lg:hidden">
                  <CatalogFilterSheet
                    filters={filters}
                    onFilterChange={setFilters}
                    filterVisibility={filterVisibility}
                    expandContainerByDefault
                    collapseContainerGroupsByDefault
                    fitContent
                    compact
                  />
                </div>
                <CatalogActiveFilters
                  filters={filters}
                  definitions={definitions}
                  priceBounds={priceBounds}
                  onFilterChange={setFilters}
                  showEmptyState
                  scrollable
                  className="min-w-0 flex-1"
                />
              </div>
            </PlantsAlphabetActiveFiltersSticky>
          ) : null}

          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-x-8">
            {showFilters ? (
              <FilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                filterVisibility={filterVisibility}
                sticky
                fitContent
                expandContainerByDefault
                collapseContainerGroupsByDefault
              />
            ) : null}

            <div className="min-w-0">
              <PaginatedCatalogGrid
                viewMode="list"
                queryParams={queryParams}
                filters={filters}
                sortBy="name"
                syncPageToUrl
                onMetaChange={setMeta}
                emptyMessage={
                  letter ? t('plantsAlphabetEmptyLetter', { letter }) : t('plantsAlphabetEmpty')
                }
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
