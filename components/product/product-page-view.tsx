import { getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { ProductCareTabs } from '@/components/product/product-care-tabs'
import { ProductCoverImageServer } from '@/components/product/product-cover-image-server'
import {
  ProductPageDeferredRecentlyViewed,
  ProductPageDeferredRelated,
  ProductPageDeferredReviews,
} from '@/components/product/product-page-deferred'
import { ProductPageGalleryClient } from '@/components/product/product-page-gallery-client'
import { ProductPagePurchaseClient } from '@/components/product/product-page-purchase-client'
import { ProductPageTrackView } from '@/components/product/product-page-track-view'
import { ProductDisplayCharacteristics } from '@/components/product/product-display-characteristics'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { productPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import type { CatalogCategoryBreadcrumb } from '@/lib/catalog/categories'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { getVisiblePlantVariants } from '@/lib/plant-variants'
import { hasProductImage } from '@/lib/product-image'
import { mergeProductPageDisplayItems } from '@/lib/product-display'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import type { Plant } from '@/lib/types'
import { cn } from '@/lib/utils'

export async function ProductPageView({
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
  canonicalOrigin?: string
}) {
  const t = await getTranslations('product')

  const variants = getVisiblePlantVariants(plant)
  const displayItems = mergeProductPageDisplayItems(plant.displayCharacteristics ?? [], variants[0])
  const breadcrumbItems = productPageBreadcrumbs(
    categoryBreadcrumbs,
    plant.name,
    catalogRootSlug,
  )

  const initialImages = hasProductImage(plant.images)
    ? plant.images.filter((url) => Boolean(url?.trim()))
    : []
  const heroImageSrc = initialImages[0]?.trim() || null

  return (
    <>
      <ProductPageTrackView productId={plant.id} />
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="border-b border-border/60 bg-background">
          <div className={cn(siteContentShellClassName, 'py-3 md:py-3.5')}>
            <PublicPageBreadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'min-w-0 overflow-x-clip py-8')}>
          <div className="mb-16 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <ProductPageGalleryClient
              plant={plant}
              heroImageSrc={heroImageSrc}
              heroSlot={
                heroImageSrc ? (
                  <ProductCoverImageServer
                    src={heroImageSrc}
                    alt={plant.name}
                    imageClassName="object-cover"
                    sizes="(max-width: 1024px) 100vw, 22rem"
                    priority
                  />
                ) : null
              }
            />

            <div className="min-w-0 space-y-6">
              <h1 className="space-y-2">
                <span className="block font-serif text-3xl font-bold text-foreground md:text-4xl">
                  {plant.name}
                </span>
                {plant.latinName ? (
                  <span className="block text-lg font-normal italic text-muted-foreground">
                    {plant.latinName}
                  </span>
                ) : null}
              </h1>

              {displayItems.length > 0 ? (
                <section aria-labelledby="product-main-characteristics">
                  <h2
                    id="product-main-characteristics"
                    className="mb-3 font-serif text-xl font-semibold text-foreground"
                  >
                    {t('mainCharacteristics')}
                  </h2>
                  <ProductDisplayCharacteristics items={displayItems} />
                </section>
              ) : null}
            </div>
          </div>

          <ProductPagePurchaseClient plant={plant} />

          {plant.description ? (
            <section
              aria-labelledby="product-description-heading"
              className="mb-16 space-y-4 border-b border-border pb-10"
            >
              <h2
                id="product-description-heading"
                className="text-2xl font-[500] tracking-tight text-foreground"
              >
                {t('descriptionHeading', {
                  name: plant.latinName?.trim() || plant.name,
                })}
              </h2>
              <div
                className="rich-text-content max-w-none leading-relaxed text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: plant.description }}
              />
            </section>
          ) : null}

          <ProductCareTabs
            plantingInstructions={plant.plantingInstructions}
            lightRequirements={plant.lightRequirements}
            careInstructions={plant.careInstructions}
          />

          <ProductPageDeferredReviews
            productId={plant.id}
            productName={plant.name}
            initialPage={productReviewsPage}
          />

          {relatedPlants.length > 0 ? (
            <ProductPageDeferredRelated
              plants={relatedPlants}
              title={t('similarPlants')}
              countLabel={t('similarPlantsCount', { count: relatedPlants.length })}
            />
          ) : null}
        </div>
      </main>
      <ProductPageDeferredRecentlyViewed excludeProductId={plant.id} />
    </>
  )
}
