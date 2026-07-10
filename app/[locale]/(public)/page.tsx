import type { Metadata } from 'next'
import { getLocale, setRequestLocale } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { HeroSection } from '@/components/home/hero-section'
import { CategoriesSection } from '@/components/home/categories-section'
import { NewArrivalsSection } from '@/components/home/new-arrivals-section'
import { BestsellersSection } from '@/components/home/bestsellers-section'
import { LowStockSection } from '@/components/home/low-stock-section'
import { AboutSection } from '@/components/home/about-section'
import { NurseryGallerySection } from '@/components/home/nursery-gallery-section'
import { ReviewsSection } from '@/components/home/reviews-section'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { fetchCatalogCategories } from '@/lib/catalog/categories'
import {
  fetchBestsellerProducts,
  fetchLowStockProducts,
  fetchNewArrivalProducts,
} from '@/lib/catalog/home-products'
import { buildHomeMetadata } from '@/lib/home/metadata'
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

  const [categoriesResult, newArrivalsResult, bestsellersResult, lowStockResult] =
    await Promise.all([
      fetchCatalogCategories(locale),
      fetchNewArrivalProducts(home.newArrivals, locale),
      fetchBestsellerProducts(home.bestsellers, locale),
      fetchLowStockProducts(home.lowStock, locale),
    ])

  return (
    <>
      <Navigation />
      <main className="flex-1">
        <HeroSection settings={home.hero} />
        <CategoriesSection
          settings={home.categories}
          initialCategories={categoriesResult}
        />
        <NewArrivalsSection
          settings={home.newArrivals}
          initialProducts={{ data: newArrivalsResult.plants, unavailable: newArrivalsResult.unavailable }}
        />
        <BestsellersSection settings={home.bestsellers} initialProducts={bestsellersResult} />
        <LowStockSection settings={home.lowStock} initialProducts={lowStockResult} />
        <AboutSection settings={home.whyUs} />
        <NurseryGallerySection settings={home.nurseryGallery} />
        <ReviewsSection settings={home.reviews} />
        <RecentlyViewedSection page="home" initialSettings={recentlyViewedSettings} />
      </main>
    </>
  )
}
