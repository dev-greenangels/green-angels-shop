'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { ProductCoverImage } from '@/components/product/product-cover-image'
import { ProductDisplayCharacteristics } from '@/components/product/product-display-characteristics'

import { Navigation } from '@/components/navigation'
import { ProductCard } from '@/components/product-card'
import { FavoriteButton } from '@/components/favorites/favorite-button'
import { ProductVariantsTable } from '@/components/product/product-variants-table'
import { ProductReviewsSection } from '@/components/reviews/product-reviews-section'
import {
  RecentlyViewedSection,
} from '@/components/product/recently-viewed-section'
import { useTrackProductView } from '@/lib/recently-viewed-store'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCartLineQuantity } from '@/lib/cart-limits'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { getVisiblePlantVariants, isPlantFullyUnavailable } from '@/lib/plant-variants'
import { useProductGridClassName } from '@/components/providers/catalog-settings-provider'
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
}: {
  plant: Plant
  categoryBreadcrumbs?: CatalogCategoryBreadcrumb[]
  catalogRootSlug?: string | null
  relatedPlants: Plant[]
  productReviewsPage: ReviewsPageResult
}) {
  const t = useTranslations('product')
  const tc = useTranslations('cart')
  const productGridClassName = useProductGridClassName()
  const [selectedImage, setSelectedImage] = useState(0)
  const cartItems = useCartItems()
  const { addItem, updateQuantity } = useCartActions()

  const variants = getVisiblePlantVariants(plant)
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
      toast.success(tc('addedToCart', { count: addedCount }))
    }
  }

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="border-b border-border/60 bg-background">
          <div className={cn(siteContentShellClassName, 'py-3 md:py-3.5')}>
            <ClientPublicPageBreadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-8')}>
          <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                <ProductCoverImage
                  src={plant.images[selectedImage]}
                  alt={plant.name}
                  imageClassName="object-cover"
                  priority
                />
                {plant.isNew ? (
                  <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground">
                    {t('newBadge')}
                  </Badge>
                ) : null}
                <div className="absolute bottom-2 right-2 z-[2]">
                  <FavoriteButton productId={plant.id} tone="overlay" />
                </div>
              </div>
              {plant.images.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {plant.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <ProductCoverImage
                        src={image}
                        alt={`${plant.name} ${index + 1}`}
                        imageClassName="object-cover"
                        logoClassName="p-2"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="mb-2 font-serif text-3xl font-bold text-foreground md:text-4xl">
                  {plant.name}
                </h1>
                {plant.latinName ? (
                  <p className="text-lg italic text-muted-foreground">{plant.latinName}</p>
                ) : null}
              </div>

              <ProductDisplayCharacteristics items={plant.displayCharacteristics ?? []} />
            </div>
          </div>

          <div className="mb-16 space-y-6">
            <ProductVariantsTable
              variants={variants}
              plantId={plant.id}
              plantName={plant.name}
              fullyOutOfStock={fullyUnavailable}
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
              <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">{t('similarPlants')}</h2>
              <div className={productGridClassName}>
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
