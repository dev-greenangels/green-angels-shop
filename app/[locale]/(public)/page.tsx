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
import { fetchHomeFreshPhotos } from '@/lib/catalog/home-content'
import {
  fetchBestsellerProducts,
  fetchLowStockProducts,
  fetchNewArrivalProducts,
} from '@/lib/catalog/home-products'
import { buildHomeMetadata } from '@/lib/home/metadata'
import { normalizeHomeSectionOrder, type HomeSectionKey } from '@/lib/settings/home-sections'
import {
  fetchPublicSiteSettings,
  getHomeSettings,
  getRecentlyViewedSettings,
} from '@/lib/settings/fetch'

export async function generateMetadata(): Promise<Metadata> {
  return buildHomeMetadata()
}

export default async function HomePage() {
  const locale = await getLocale()
  setRequestLocale(locale)

  const siteSettingsResult = await fetchPublicSiteSettings()
  const home = getHomeSettings(siteSettingsResult)
  const recentlyViewedSettings = getRecentlyViewedSettings(siteSettingsResult)

  const [categoriesResult, newArrivalsResult, bestsellersResult, lowStockResult, freshPhotosResult] =
    await Promise.all([
      fetchCatalogCategories(locale),
      fetchNewArrivalProducts(home.newArrivals, locale),
      fetchBestsellerProducts(home.bestsellers, locale),
      fetchLowStockProducts(home.lowStock, locale),
      home.freshPlantPhotos.enabled
        ? fetchHomeFreshPhotos(home.freshPlantPhotos.limit)
        : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 0, totalPages: 1 }),
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
    reviews: <ReviewsSection settings={home.reviews} />,
    recentlyViewed: (
      <RecentlyViewedSection page="home" initialSettings={recentlyViewedSettings} />
    ),
  }

  const orderedSectionKeys = normalizeHomeSectionOrder(home.sectionOrder)

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <HeroSection settings={home.hero} />
        {orderedSectionKeys.map((key) => (
          <Fragment key={key}>{sectionRenderers[key]}</Fragment>
        ))}
      </main>
    </>
  )
}
