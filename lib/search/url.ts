import { normalizeSearchQuery } from '@/lib/search/normalize'

export const SEARCH_QUERY_PARAM = 'q'
export { normalizeSearchQuery }

export function buildSearchPageHref(query: string) {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return '/search'
  const params = new URLSearchParams({ [SEARCH_QUERY_PARAM]: normalized })
  return `/search?${params.toString()}`
}
