import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import type { HomePageSettings } from '@/lib/settings/types'

export function normalizeHomeSettings(
  home: Partial<HomePageSettings> | null | undefined,
): HomePageSettings {
  const base = home ?? {}
  return {
    hero: { ...DEFAULT_HOME_SETTINGS.hero, ...base.hero },
    categories: {
      ...DEFAULT_HOME_SETTINGS.categories,
      ...base.categories,
      categorySlugs: base.categories?.categorySlugs ?? DEFAULT_HOME_SETTINGS.categories.categorySlugs,
    },
    newArrivals: {
      ...DEFAULT_HOME_SETTINGS.newArrivals,
      ...base.newArrivals,
      productSlugs: base.newArrivals?.productSlugs ?? DEFAULT_HOME_SETTINGS.newArrivals.productSlugs,
    },
    bestsellers: {
      ...DEFAULT_HOME_SETTINGS.bestsellers,
      ...base.bestsellers,
      productSlugs: base.bestsellers?.productSlugs ?? DEFAULT_HOME_SETTINGS.bestsellers.productSlugs,
    },
    lowStock: {
      ...DEFAULT_HOME_SETTINGS.lowStock,
      ...base.lowStock,
      productSlugs: base.lowStock?.productSlugs ?? DEFAULT_HOME_SETTINGS.lowStock.productSlugs,
      stockThreshold:
        base.lowStock?.stockThreshold ?? DEFAULT_HOME_SETTINGS.lowStock.stockThreshold,
    },
    whyUs: { ...DEFAULT_HOME_SETTINGS.whyUs, ...base.whyUs },
    nurseryGallery: { ...DEFAULT_HOME_SETTINGS.nurseryGallery, ...base.nurseryGallery },
    reviews: { ...DEFAULT_HOME_SETTINGS.reviews, ...base.reviews },
  }
}
