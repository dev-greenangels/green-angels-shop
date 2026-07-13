import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import { normalizeHomeSectionOrder } from '@/lib/settings/home-sections'
import type { ReviewSortOrder } from '@/lib/reviews/types'
import type { HomePageSettings } from '@/lib/settings/types'

const REVIEW_SORT_VALUES: ReviewSortOrder[] = ['newest', 'oldest', 'rating_desc']

function normalizeReviewSort(value: unknown): ReviewSortOrder {
  if (typeof value === 'string' && REVIEW_SORT_VALUES.includes(value as ReviewSortOrder)) {
    return value as ReviewSortOrder
  }
  return DEFAULT_HOME_SETTINGS.reviews.sort
}

export function normalizeHomeSettings(
  home: Partial<HomePageSettings> | null | undefined,
): HomePageSettings {
  const base = home ?? {}
  const legacyReviews = base.reviews as
    | (HomePageSettings['reviews'] & { items?: unknown[] })
    | undefined

  return {
    sectionOrder: normalizeHomeSectionOrder(base.sectionOrder),
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
    freshPlantPhotos: {
      ...DEFAULT_HOME_SETTINGS.freshPlantPhotos,
      ...base.freshPlantPhotos,
      enabled: base.freshPlantPhotos?.enabled ?? DEFAULT_HOME_SETTINGS.freshPlantPhotos.enabled,
      limit: base.freshPlantPhotos?.limit ?? DEFAULT_HOME_SETTINGS.freshPlantPhotos.limit,
    },
    reviews: {
      enabled: legacyReviews?.enabled ?? DEFAULT_HOME_SETTINGS.reviews.enabled,
      title: legacyReviews?.title ?? DEFAULT_HOME_SETTINGS.reviews.title,
      subtitle: legacyReviews?.subtitle ?? DEFAULT_HOME_SETTINGS.reviews.subtitle,
      limit: legacyReviews?.limit ?? DEFAULT_HOME_SETTINGS.reviews.limit,
      sort: normalizeReviewSort(legacyReviews?.sort),
    },
  }
}
