import type { Metadata } from 'next'
import { Fragment, type ReactNode } from 'react'
import { getLocale, setRequestLocale } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { HeroSection } from '@/components/home/hero-section'
import { CategoriesSection } from '@/components/home/categories-section'
import { NewArrivalsSection } from '@/components/home/new-arrivals-section'
import { BestsellersSection } from '@/components/home/bestsellers-section'
import { LowStockSection } from '@/components/home/low-stock-section'
import { AboutSection } from '@/components/home/about-section'
import { NurseryGallerySection } from '@/components/home/nursery-gallery-section'
import { FreshPlantPhotosSection } from '@/components/home/fresh-plant-photos-section'
import { ReviewsSection } from '@/components/home/reviews-section'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { fetchCatalogCategories } from '@/lib/catalog/categories'
import { fetchHomeFreshPhotos, fetchHomeReviews } from '@/lib/catalog/home-content'
import {
  fetchBestsellerProducts,
  fetchLowStockProducts,
  fetchNewArrivalProducts,
  type HomeProductsResult,
} from '@/lib/catalog/home-products'
import { buildHomeMetadata } from '@/lib/home/metadata'
import { EMPTY_REVIEWS_PAGE } from '@/lib/reviews/types'
import {
  isHomeSectionHidden,
  normalizeHomeSectionOrder,
  type HomeSectionKey,
} from '@/lib/settings/home-sections'
import {
  fetchPublicSiteSettings,
  getHomeSettings,
  getRecentlyViewedSettings,
} from '@/lib/settings/fetch'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildHomeMetadata(locale)
}

export default async function HomePage() {
  const locale = await getLocale()
  setRequestLocale(locale)

  const siteSettingsResult = await fetchPublicSiteSettings()
  const home = getHomeSettings(siteSettingsResult)
  const recentlyViewedSettings = getRecentlyViewedSettings(siteSettingsResult)
  const hidden = home.sectionHidden
  const show = (key: HomeSectionKey) => !isHomeSectionHidden(hidden, key)
  const emptyProducts: HomeProductsResult = { plants: [], unavailable: false }

  const [categoriesResult, newArrivalsResult, bestsellersResult, lowStockResult, freshPhotosResult, reviewsResult] =
    await Promise.all([
      show('categories')
        ? fetchCatalogCategories(locale)
        : Promise.resolve({ data: [], unavailable: false }),
      show('newArrivals')
        ? fetchNewArrivalProducts(home.newArrivals, locale)
        : Promise.resolve(emptyProducts),
      show('bestsellers')
        ? fetchBestsellerProducts(home.bestsellers, locale)
        : Promise.resolve(emptyProducts),
      show('lowStock')
        ? fetchLowStockProducts(home.lowStock, locale)
        : Promise.resolve(emptyProducts),
      show('freshPlantPhotos')
        ? fetchHomeFreshPhotos(home.freshPlantPhotos.limit)
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 0, totalPages: 1 }),
      show('reviews')
        ? fetchHomeReviews({
            page: 1,
            pageSize: home.reviews.limit,
            sort: home.reviews.sort,
          })
        : Promise.resolve(EMPTY_REVIEWS_PAGE),
    ])

  const sectionRenderers: Record<HomeSectionKey, ReactNode> = {
    categories: (
      <CategoriesSection settings={home.categories} initialCategories={categoriesResult} />
    ),
    newArrivals: (
      <NewArrivalsSection
        settings={home.newArrivals}
        initialProducts={{ data: newArrivalsResult.plants, unavailable: newArrivalsResult.unavailable }}
      />
    ),
    bestsellers: (
      <BestsellersSection settings={home.bestsellers} initialProducts={bestsellersResult} />
    ),
    lowStock: <LowStockSection settings={home.lowStock} initialProducts={lowStockResult} />,
    whyUs: <AboutSection settings={home.whyUs} />,
    nurseryGallery: <NurseryGallerySection settings={home.nurseryGallery} />,
    freshPlantPhotos: (
      <FreshPlantPhotosSection settings={home.freshPlantPhotos} photos={freshPhotosResult.items} />
    ),
    reviews: <ReviewsSection settings={home.reviews} reviews={reviewsResult} />,
    recentlyViewed: (
      <RecentlyViewedSection page="home" initialSettings={recentlyViewedSettings} />
    ),
  }

  const orderedSectionKeys = normalizeHomeSectionOrder(home.sectionOrder).filter(
    (key) => show(key),
  )

  return (
    <>
      <Navigation />
      <main className="home-page flex-1">
        <HeroSection settings={home.hero} />
        {orderedSectionKeys.map((key) => (
          <Fragment key={key}>{sectionRenderers[key]}</Fragment>
        ))}
      </main>
    </>
  )
}
