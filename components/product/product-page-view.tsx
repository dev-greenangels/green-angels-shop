'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { showAddedToCartToast } from '@/lib/cart-toast'

import { ProductDisplayCharacteristics } from '@/components/product/product-display-characteristics'
import { ProductImageGallery } from '@/components/product/product-image-gallery'
import { MinOrderPolicyBanner } from '@/components/cart/min-order-policy-banner'

import { Navigation } from '@/components/navigation'
import { ProductCard } from '@/components/product-card'
import { ProductVariantsTable } from '@/components/product/product-variants-table'
import { ProductReviewsSection } from '@/components/reviews/product-reviews-section'
import {
  RecentlyViewedSection,
} from '@/components/product/recently-viewed-section'
import { useTrackProductView } from '@/lib/recently-viewed-store'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCartLineQuantity } from '@/lib/cart-limits'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { getVisiblePlantVariants, isPlantFullyUnavailable } from '@/lib/plant-variants'
import { mergeProductPageDisplayItems } from '@/lib/product-display'
import { LISTING_PRODUCT_GRID_CLASS_NAME } from '@/lib/catalog/grid-columns'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import type { CatalogCategoryBreadcrumb } from '@/lib/catalog/categories'
import { productPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import type { Plant, ProductVariant } from '@/lib/types'
import { cn } from '@/lib/utils'

export function ProductPageView({
  plant,
  categoryBreadcrumbs = [],
  catalogRootSlug = null,
  relatedPlants,
  productReviewsPage,
  canonicalOrigin,
}: {
  plant: Plant
  categoryBreadcrumbs?: CatalogCategoryBreadcrumb[]
  catalogRootSlug?: string | null
  relatedPlants: Plant[]
  productReviewsPage: ReviewsPageResult
  canonicalOrigin?: string
}) {
  const t = useTranslations('product')
  const tc = useTranslations('cart')
  const cartItems = useCartItems()
  const { addItem, updateQuantity } = useCartActions()

  const variants = getVisiblePlantVariants(plant)
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    () => variants[0]?.id ?? null,
  )

  useEffect(() => {
    const next = getVisiblePlantVariants(plant)
    setActiveVariantId((prev) => {
      if (prev && next.some((variant) => variant.id === prev)) return prev
      return next[0]?.id ?? null
    })
  }, [plant])

  const activeVariant = variants.find((variant) => variant.id === activeVariantId) ?? variants[0] ?? null
  const displayItems = useMemo(
    () => mergeProductPageDisplayItems(plant.displayCharacteristics ?? [], activeVariant),
    [plant.displayCharacteristics, activeVariant],
  )
  const fullyUnavailable = isPlantFullyUnavailable(variants)
  const breadcrumbItems = productPageBreadcrumbs(
    categoryBreadcrumbs,
    plant.name,
    catalogRootSlug,
  )
  const hasCareTabs =
    Boolean(plant.plantingInstructions?.trim()) ||
    Boolean(plant.lightRequirements?.trim()) ||
    Boolean(plant.careInstructions?.trim())

  useTrackProductView(plant.id)

  const handleBuy = (variant: ProductVariant, targetQuantity: number, unitPrice: number) => {
    const inCart = getCartLineQuantity(cartItems, plant.id, variant.id)
    let addedCount = 0

    if (targetQuantity < inCart) {
      updateQuantity(plant.id, targetQuantity, variant.id)
    } else if (targetQuantity > inCart) {
      const result = addItem(plant, targetQuantity - inCart, { variant, unitPrice })
      addedCount = result.added
    }

    if (addedCount > 0) {
      showAddedToCartToast(tc('addedToCart', { count: addedCount }), plant.name, variant.label)
    }
  }

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="border-b border-border/60 bg-background">
          <div className={cn(siteContentShellClassName, 'py-3 md:py-3.5')}>
            <ClientPublicPageBreadcrumbs
              items={breadcrumbItems}
              origin={canonicalOrigin}
            />
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'min-w-0 overflow-x-clip py-8')}>
          <div className="mb-16 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <ProductImageGallery
              images={plant.images}
              productId={plant.id}
              productName={plant.name}
              isNew={plant.isNew}
            />

            <div className="min-w-0 space-y-6">
              <div>
                <h1 className="mb-2 font-serif text-3xl font-bold text-foreground md:text-4xl">
                  {plant.name}
                </h1>
                {plant.latinName ? (
                  <p className="text-lg italic text-muted-foreground">{plant.latinName}</p>
                ) : null}
              </div>

              <ProductDisplayCharacteristics items={displayItems} />
            </div>
          </div>

          <div className="mb-16 space-y-6">
            <MinOrderPolicyBanner />
            <ProductVariantsTable
              variants={variants}
              plantId={plant.id}
              plantName={plant.name}
              fullyOutOfStock={fullyUnavailable}
              selectedVariantId={activeVariantId}
              onSelectVariant={setActiveVariantId}
              onBuy={handleBuy}
            />
            {plant.description ? (
              <div
                className="prose prose-neutral max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: plant.description }}
              />
            ) : null}
          </div>

          {hasCareTabs ? (
            <div className="mb-16">
              <Tabs defaultValue="planting" className="w-full">
                <TabsList className="mb-6 h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                  {plant.plantingInstructions?.trim() ? (
                    <TabsTrigger
                      value="planting"
                      className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      {t('planting')}
                    </TabsTrigger>
                  ) : null}
                  {plant.lightRequirements?.trim() ? (
                    <TabsTrigger
                      value="light"
                      className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      {t('lighting')}
                    </TabsTrigger>
                  ) : null}
                  {plant.careInstructions?.trim() ? (
                    <TabsTrigger
                      value="care"
                      className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      {t('care')}
                    </TabsTrigger>
                  ) : null}
                </TabsList>
                {plant.plantingInstructions?.trim() ? (
                  <TabsContent value="planting" className="mt-0">
                    <div className="rounded-xl bg-secondary/30 p-6">
                      <h3 className="mb-4 font-serif text-xl font-semibold">{t('plantingInstructions')}</h3>
                      <p className="leading-relaxed text-muted-foreground">{plant.plantingInstructions}</p>
                    </div>
                  </TabsContent>
                ) : null}
                {plant.lightRequirements?.trim() ? (
                  <TabsContent value="light" className="mt-0">
                    <div className="rounded-xl bg-secondary/30 p-6">
                      <h3 className="mb-4 font-serif text-xl font-semibold">{t('lightingRequirements')}</h3>
                      <p className="leading-relaxed text-muted-foreground">{plant.lightRequirements}</p>
                    </div>
                  </TabsContent>
                ) : null}
                {plant.careInstructions?.trim() ? (
                  <TabsContent value="care" className="mt-0">
                    <div className="rounded-xl bg-secondary/30 p-6">
                      <h3 className="mb-4 font-serif text-xl font-semibold">{t('careInstructions')}</h3>
                      <p className="leading-relaxed text-muted-foreground">{plant.careInstructions}</p>
                    </div>
                  </TabsContent>
                ) : null}
              </Tabs>
            </div>
          ) : null}

          <ProductReviewsSection
            productId={plant.id}
            productName={plant.name}
            initialPage={productReviewsPage}
          />

          {relatedPlants.length > 0 ? (
            <div>
              <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-serif text-2xl font-bold text-foreground">{t('similarPlants')}</h2>
                <p className="text-sm text-muted-foreground md:text-base">
                  {t('similarPlantsCount', { count: relatedPlants.length })}
                </p>
              </div>
              <div className={LISTING_PRODUCT_GRID_CLASS_NAME}>
                {relatedPlants.map((relatedPlant) => (
                  <ProductCard key={relatedPlant.id} plant={relatedPlant} layout="grid" />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <RecentlyViewedSection page="product" excludeProductId={plant.id} />
    </>
  )
}
