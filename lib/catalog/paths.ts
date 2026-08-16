import { cache } from 'react'

import { findCatalogRootNode } from '@/lib/catalog/catalog-root'
import { fetchCategoryTree } from '@/lib/catalog/categories'

/** Односегментні маршрути, які не є slug категорії. */
export const RESERVED_PUBLIC_SEGMENTS = new Set([
  'about',
  'account',
  'auth',
  'blog',
  'catalog',
  'checkout',
  'contacts',
  'faq',
  'favorites',
  'new-arrivals',
  'plants',
  'product',
  'promotions',
  'reviews',
  'search',
  'shipping',
  'terms',
])

export function catalogRootHref(rootSlug: string): string {
  return `/${rootSlug}`
}

export function categoryHref(slug: string): string {
  return `/${slug}`
}

export function productHref(categorySlug: string, productSlug: string): string {
  return `/${categorySlug}/${productSlug}`
}

export function productHrefFromPlant(plant: {
  slug: string
  category?: string | null
}): string {
  const categorySlug = plant.category?.trim()
  if (categorySlug) return productHref(categorySlug, plant.slug)
  return `/product/${plant.slug}`
}

export function isReservedPublicSegment(segment: string): boolean {
  return RESERVED_PUBLIC_SEGMENTS.has(segment)
}

export function resolveCategorySlugFromPathname(pathname: string): string | null {
  const productMatch = pathname.match(/^\/([^/]+)\/[^/]+$/)
  if (productMatch && !isReservedPublicSegment(productMatch[1])) {
    return productMatch[1]
  }

  const categoryMatch = pathname.match(/^\/([^/]+)$/)
  if (categoryMatch && !isReservedPublicSegment(categoryMatch[1])) {
    return categoryMatch[1]
  }

  const legacyMatch = pathname.match(/^\/catalog\/([^/]+)/)
  if (legacyMatch) return legacyMatch[1]

  return null
}

export function isCatalogRootPath(pathname: string, catalogRootSlug: string | null | undefined): boolean {
  if (!catalogRootSlug) return pathname === '/catalog'
  return pathname === catalogRootHref(catalogRootSlug) || pathname === '/catalog'
}

export function isCatalogSectionActive(
  pathname: string,
  catalogRootSlug: string | null | undefined,
): boolean {
  if (isCatalogRootPath(pathname, catalogRootSlug)) return true
  if (pathname.startsWith('/catalog/')) return true
  const slug = resolveCategorySlugFromPathname(pathname)
  return Boolean(slug)
}

export const fetchCatalogRootSlug = cache(async (locale?: string): Promise<string | null> => {
  try {
    const tree = await fetchCategoryTree(locale)
    return findCatalogRootNode(tree)?.slug ?? null
  } catch {
    return null
  }
})

/**
 * Канонічне посилання на каталог.
 * Без кореня — `/catalog` (лендинг без редіректу на себе).
 * З коренем — `/{rootSlug}`.
 */
export function resolveCatalogHref(catalogRootSlug: string | null | undefined): string {
  return catalogRootSlug ? catalogRootHref(catalogRootSlug) : '/catalog'
}
