'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CatalogSortControl } from '@/components/catalog/catalog-sort-control'
import { CatalogViewModeToggle } from '@/components/catalog/catalog-view-mode-toggle'
import { PaginatedCatalogGrid } from '@/components/catalog/paginated-catalog-grid'
import { Navigation } from '@/components/navigation'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { LISTING_PRODUCT_GRID_CLASS_NAME } from '@/lib/catalog/grid-columns'
import type { CatalogProductsPageMeta } from '@/lib/catalog/products'
import { useCatalogViewMode } from '@/lib/catalog/view-mode'
import {
  siteContentShellClassName,
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import { formatNumberForLocale } from '@/lib/i18n/intl-locale'
import { cn } from '@/lib/utils'

export function NewArrivalsPageContent() {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const tNav = useTranslations('nav')
  const th = useTranslations('home')
  const [meta, setMeta] = useState<CatalogProductsPageMeta | null>(null)
  const { viewMode, setViewMode } = useCatalogViewMode()
  const [sortBy, setSortBy] = useState('restocked')

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-gradient-to-br from-secondary via-background to-accent">
        <div className={cn(siteContentShellClassName, 'py-10 md:py-14')}>
          <ClientPublicPageBreadcrumbs
            className="mb-4"
            items={[
              { label: tNav('catalog'), href: '/catalog' },
              { label: th('newArrivalsTitle') },
            ]}
          />
          <div className="mb-10 max-w-2xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              {th('newArrivalsTitle')}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('newArrivalsPageSubtitle')}</p>
            {meta ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('newArrivalsCount', { count: formatNumberForLocale(meta.total, locale) })}
              </p>
            ) : null}
          </div>

          <div className={siteStickyToolbarOuterClassName}>
            <div className={cn(siteStickyToolbarInnerClassName, 'justify-end')}>
              <CatalogSortControl sortBy={sortBy} onSortChange={setSortBy} />
              <CatalogViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          <PaginatedCatalogGrid
            sortBy={sortBy}
            syncPageToUrl
            gridClassName={LISTING_PRODUCT_GRID_CLASS_NAME}
            viewMode={viewMode}
            onMetaChange={setMeta}
            emptyMessage={t('newArrivalsEmpty')}
          />
        </div>
        <RecentlyViewedSection page="newArrivals" />
      </main>
    </>
  )
}
