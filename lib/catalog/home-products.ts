import { filterInStockPlants } from '@/lib/catalog/filter-in-stock-plants'
import { fetchCatalogProductBySlug, fetchCatalogProductsPage } from '@/lib/catalog/products'
import type { HomePageSettings } from '@/lib/settings/types'
import type { Plant } from '@/lib/types'

export type HomeProductsResult = {
  plants: Plant[]
  unavailable: boolean
}

async function fetchPlantsBySlugs(slugs: string[]): Promise<HomeProductsResult> {
  const cleaned = slugs.map((slug) => slug.trim()).filter(Boolean)
  if (!cleaned.length) {
    return { plants: [], unavailable: false }
  }

  const results = await Promise.all(cleaned.map((slug) => fetchCatalogProductBySlug(slug)))
  const unavailable = results.some((result) => result.unavailable)
  const plants = filterInStockPlants(
    results.map((result) => result.data).filter((plant): plant is Plant => plant !== null),
  )

  return { plants, unavailable }
}

function mergePinnedAndAuto(
  pinned: Plant[],
  auto: Plant[],
  limit: number,
): Plant[] {
  const seen = new Set<string>()
  const merged: Plant[] = []

  for (const plant of [...pinned, ...auto]) {
    if (merged.length >= limit) break
    if (seen.has(plant.id)) continue
    seen.add(plant.id)
    merged.push(plant)
  }

  return merged
}

async function fetchSortedInStockPlants(input: {
  limit: number
  sort: string
  locale?: string
  lowStockThreshold?: number
}): Promise<HomeProductsResult> {
  const result = await fetchCatalogProductsPage({
    locale: input.locale,
    page: 1,
    pageSize: input.limit,
    sort: input.sort,
    stock: 'in_stock',
    lowStockThreshold: input.lowStockThreshold,
  })

  return {
    plants: filterInStockPlants(result.data.plants),
    unavailable: result.unavailable,
  }
}

export async function fetchNewArrivalProducts(
  settings: HomePageSettings['newArrivals'],
  locale?: string,
): Promise<HomeProductsResult> {
  const slugs = settings.productSlugs.filter(Boolean)
  if (slugs.length > 0) {
    const manual = await fetchPlantsBySlugs(slugs)
    if (manual.plants.length >= settings.limit) {
      return { plants: manual.plants.slice(0, settings.limit), unavailable: manual.unavailable }
    }

    const auto = await fetchSortedInStockPlants({
      limit: settings.limit,
      sort: 'restocked',
      locale,
    })

    return {
      plants: mergePinnedAndAuto(manual.plants, auto.plants, settings.limit),
      unavailable: manual.unavailable || auto.unavailable,
    }
  }

  return fetchSortedInStockPlants({
    limit: settings.limit,
    sort: 'restocked',
    locale,
  })
}

export async function fetchBestsellerProducts(
  settings: HomePageSettings['bestsellers'],
  locale?: string,
): Promise<HomeProductsResult> {
  const slugs = settings.productSlugs.filter(Boolean)
  if (slugs.length > 0) {
    const manual = await fetchPlantsBySlugs(slugs)
    if (manual.plants.length >= settings.limit) {
      return { plants: manual.plants.slice(0, settings.limit), unavailable: manual.unavailable }
    }

    const auto = await fetchSortedInStockPlants({
      limit: settings.limit,
      sort: 'popular',
      locale,
    })

    return {
      plants: mergePinnedAndAuto(manual.plants, auto.plants, settings.limit),
      unavailable: manual.unavailable || auto.unavailable,
    }
  }

  return fetchSortedInStockPlants({
    limit: settings.limit,
    sort: 'popular',
    locale,
  })
}

export async function fetchLowStockProducts(
  settings: HomePageSettings['lowStock'],
  locale?: string,
): Promise<HomeProductsResult> {
  const slugs = settings.productSlugs.filter(Boolean)
  const manual = slugs.length ? await fetchPlantsBySlugs(slugs) : { plants: [], unavailable: false }

  const auto = await fetchSortedInStockPlants({
    limit: Math.max(settings.limit, settings.limit * 2),
    sort: 'low_stock',
    locale,
    lowStockThreshold: settings.stockThreshold,
  })

  return {
    plants: mergePinnedAndAuto(manual.plants, auto.plants, settings.limit),
    unavailable: manual.unavailable || auto.unavailable,
  }
}
