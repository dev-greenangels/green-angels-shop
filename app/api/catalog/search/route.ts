import { NextRequest, NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'
import { defaultLocale, isAppLocale } from '@/i18n/routing'
import {
  EMPTY_SEARCH_SUGGEST,
  SEARCH_SUGGEST_MIN_LENGTH,
  type SearchCategoryHit,
  type SearchProductHit,
  type SearchSuggestResult,
  type SearchSuggestionItem,
} from '@/lib/catalog/search-suggest'
import type { CatalogProductListItem } from '@/lib/catalog/types'
import { categoryHref, productHref } from '@/lib/catalog/paths'
import { resolveCategoryThumbUrl } from '@/lib/category-image'
import { resolveThumbUrl } from '@/lib/media/paths'
import { buildSearchPageHref, normalizeSearchQuery } from '@/lib/search/url'

const PLACEHOLDER_IMAGE = '/images/category-placeholder.svg'
const MAX_SUGGESTIONS = 5
const MAX_CATEGORIES = 5
const MAX_PRODUCTS = 4

type BackendCategorySearchHit = {
  id: string
  slug: string
  name: string
  imageUrl: string
}

function isPaginatedProducts(data: unknown): data is { items: CatalogProductListItem[] } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as { items: unknown }).items)
  )
}

function resolveProductImage(imageUrl: string | null | undefined) {
  if (!imageUrl?.trim()) return PLACEHOLDER_IMAGE
  return resolveThumbUrl(imageUrl.trim())
}

function buildSuggestions(
  query: string,
  locale: string,
  categories: SearchCategoryHit[],
  products: SearchProductHit[],
): SearchSuggestionItem[] {
  const seen = new Set<string>()
  const suggestions: SearchSuggestionItem[] = []

  const add = (label: string, href: string) => {
    const key = label.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    suggestions.push({ label, href })
  }

  const searchQueryLabel = searchQueryLabelForLocale(locale, query)
  add(searchQueryLabel, buildSearchPageHref(query))

  for (const category of categories) {
    if (suggestions.length >= MAX_SUGGESTIONS) break
    add(category.name, categoryHref(category.slug))
  }

  for (const product of products) {
    if (suggestions.length >= MAX_SUGGESTIONS) break
    if (!product.categorySlug) continue
    add(product.name, productHref(product.categorySlug, product.slug))
  }

  return suggestions
}

function searchQueryLabelForLocale(locale: string, query: string): string {
  const labels: Record<string, string> = {
    uk: `Шукати «${query}»`,
    sk: `Hľadať «${query}»`,
    cs: `Hledat «${query}»`,
    en: `Search «${query}»`,
    de: `Suchen «${query}»`,
    hu: `Keresés: «${query}»`,
  }
  return labels[locale] ?? labels.en!
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = normalizeSearchQuery(searchParams.get('q'))
  const requestedLocale = searchParams.get('locale')
  const locale = requestedLocale && isAppLocale(requestedLocale) ? requestedLocale : defaultLocale
  if (query.length < SEARCH_SUGGEST_MIN_LENGTH) {
    return NextResponse.json(EMPTY_SEARCH_SUGGEST)
  }

  const backend = getBackendApiUrl()
  const productParams = new URLSearchParams({
    locale,
    published: 'true',
    search: query,
    pageSize: String(MAX_PRODUCTS),
    page: '1',
  })
  const categoryParams = new URLSearchParams({
    q: query,
    locale,
    limit: String(MAX_CATEGORIES),
  })

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${backend}/products?${productParams}`, { cache: 'no-store' }),
      fetch(`${backend}/categories/search?${categoryParams}`, { cache: 'no-store' }),
    ])

    if (!productsRes.ok || !categoriesRes.ok) {
      return NextResponse.json(EMPTY_SEARCH_SUGGEST)
    }

    const productsData = await productsRes.json()
    const categoriesData = (await categoriesRes.json()) as BackendCategorySearchHit[]

    const productRows: CatalogProductListItem[] = isPaginatedProducts(productsData)
      ? productsData.items
      : (productsData as CatalogProductListItem[])

    const categoryHits: SearchCategoryHit[] = categoriesData.slice(0, MAX_CATEGORIES).map(
      (category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        image: resolveCategoryThumbUrl(category.imageUrl),
      }),
    )

    const productHits: SearchProductHit[] = productRows.slice(0, MAX_PRODUCTS).map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      categorySlug: item.categorySlug,
      image: resolveProductImage(item.imageUrl),
    }))

    const result: SearchSuggestResult = {
      suggestions: buildSuggestions(query, locale, categoryHits, productHits),
      categories: categoryHits,
      products: productHits,
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(EMPTY_SEARCH_SUGGEST)
  }
}
