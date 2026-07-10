'use client'

import { useMemo, useState } from 'react'
import { Sparkles, Tags } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { CatalogSortControl } from '@/components/catalog/catalog-sort-control'
import { CatalogViewModeToggle } from '@/components/catalog/catalog-view-mode-toggle'
import { PaginatedCatalogGrid } from '@/components/catalog/paginated-catalog-grid'
import { Navigation } from '@/components/navigation'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { Button } from '@/components/ui/button'
import { LISTING_PRODUCT_GRID_CLASS_NAME } from '@/lib/catalog/grid-columns'
import type { CatalogProductsPageMeta } from '@/lib/catalog/products'
import { useCatalogViewMode } from '@/lib/catalog/view-mode'
import {
  siteContentShellClassName,
  siteStickyToolbarControlsClusterClassName,
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import { formatNumberForLocale } from '@/lib/i18n/intl-locale'
import { getVisiblePlantVariants } from '@/lib/plant-variants'
import { cn } from '@/lib/utils'

export function PromotionsPageContent() {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const tNav = useTranslations('nav')
  const cart = useTranslations('cart')
  const [meta, setMeta] = useState<CatalogProductsPageMeta | null>(null)
  const [selectedDiscountTier, setSelectedDiscountTier] = useState<number | null>(null)
  const [tierOptions, setTierOptions] = useState<number[]>([])
  const [sortBy, setSortBy] = useState('name')
  const { viewMode, setViewMode } = useCatalogViewMode()

  const queryParams = useMemo(
    () => ({
      hasDiscount: true,
      ...(selectedDiscountTier ? { discountMinQuantity: selectedDiscountTier } : {}),
      ...(selectedDiscountTier ? { discountQuantityMode: 'exact' as const } : {}),
    }),
    [selectedDiscountTier],
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
              { label: t('promotionsTitle') },
            ]}
          />
          <div className="mb-10 max-w-2xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">{t('promotionsTitle')}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('promotionsSubtitle')}</p>
            {meta ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('promotionsCount', { count: formatNumberForLocale(meta.total, locale) })}
              </p>
            ) : null}
          </div>

          <div className={siteStickyToolbarOuterClassName}>
            <div className={siteStickyToolbarInnerClassName}>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    'h-8 shrink-0 gap-1 rounded-full px-2.5 text-[11px] leading-none border-primary/30',
                    selectedDiscountTier == null
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-background text-foreground hover:bg-primary/10',
                  )}
                  variant="outline"
                  onClick={() => setSelectedDiscountTier(null)}
                >
                  <Sparkles className="h-3 w-3" />
                  Усі
                </Button>
                {tierOptions.map((tier) => (
                  <Button
                    key={tier}
                    type="button"
                    size="sm"
                    className={cn(
                      'h-8 shrink-0 gap-1 rounded-full px-2.5 text-[11px] leading-none border-primary/30',
                      selectedDiscountTier === tier
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-background text-foreground hover:bg-primary/10',
                    )}
                    variant="outline"
                    onClick={() => setSelectedDiscountTier(tier)}
                  >
                    <Tags className="h-3 w-3" />
                    {cart('fromQty', { count: tier })}
                  </Button>
                ))}
              </div>
              <div className={siteStickyToolbarControlsClusterClassName}>
                <CatalogSortControl sortBy={sortBy} onSortChange={setSortBy} />
                <CatalogViewModeToggle value={viewMode} onChange={setViewMode} />
              </div>
            </div>
          </div>

          <PaginatedCatalogGrid
            queryParams={queryParams}
            sortBy={sortBy}
            syncPageToUrl
            gridClassName={LISTING_PRODUCT_GRID_CLASS_NAME}
            viewMode={viewMode}
            onMetaChange={setMeta}
            onProductsChange={(plants) => {
              const nextOptions = new Set<number>()
              for (const plant of plants) {
                for (const variant of getVisiblePlantVariants(plant)) {
                  for (const tier of variant.priceTiers) {
                    if (tier.pricePerUnit < variant.basePrice) {
                      nextOptions.add(Math.max(1, Math.floor(tier.minQuantity)))
                    }
                  }
                }
              }
              const sorted = [...nextOptions].sort((a, b) => a - b)
              setTierOptions((prev) =>
                prev.length === sorted.length && prev.every((value, index) => value === sorted[index])
                  ? prev
                  : sorted,
              )
              if (
                selectedDiscountTier != null &&
                !nextOptions.has(selectedDiscountTier)
              ) {
                setSelectedDiscountTier(null)
              }
            }}
            listDiscountFilter={
              selectedDiscountTier
                ? { minQuantity: selectedDiscountTier, mode: 'exact' }
                : undefined
            }
            emptyMessage={t('promotionsEmpty')}
          />
        </div>
        <RecentlyViewedSection page="promotions" />
      </main>
    </>
  )
}
