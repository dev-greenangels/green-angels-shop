import { buildSearchPageHref, normalizeSearchQuery } from '@/lib/search/url'

export type SearchSuggestionItem = {
  label: string
  href: string
}

export type SearchCategoryHit = {
  id: string
  name: string
  slug: string
  image: string
}

export type SearchProductHit = {
  id: string
  name: string
  slug: string
  categorySlug: string
  image: string
}

export type SearchSuggestResult = {
  suggestions: SearchSuggestionItem[]
  categories: SearchCategoryHit[]
  products: SearchProductHit[]
}

export const EMPTY_SEARCH_SUGGEST: SearchSuggestResult = {
  suggestions: [],
  categories: [],
  products: [],
}

export const SEARCH_SUGGEST_MIN_LENGTH = 2

export { buildSearchPageHref, normalizeSearchQuery }

export async function fetchSearchSuggestions(
  query: string,
  locale: string,
): Promise<SearchSuggestResult> {
  const trimmed = normalizeSearchQuery(query)
  if (trimmed.length < SEARCH_SUGGEST_MIN_LENGTH) {
    return EMPTY_SEARCH_SUGGEST
  }

  const params = new URLSearchParams({ q: trimmed, locale })
  const res = await fetch(`/api/catalog/search?${params}`, { cache: 'no-store' })
  if (!res.ok) {
    return EMPTY_SEARCH_SUGGEST
  }

  return res.json()
}
