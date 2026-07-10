import { getSiteUrl } from '@/lib/auth/google-oauth'
import { normalizeSearchQuery } from '@/lib/search/normalize'

export const SEARCH_QUERY_PARAM = 'q'
export { normalizeSearchQuery }

export function buildSearchPageHref(query: string) {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return '/search'
  const params = new URLSearchParams({ [SEARCH_QUERY_PARAM]: normalized })
  return `/search?${params.toString()}`
}

export function buildSearchCanonicalUrl(query: string, locale: string) {
  const normalized = normalizeSearchQuery(query)
  if (!normalized) return `${getSiteUrl()}/${locale}/search`

  const params = new URLSearchParams({ [SEARCH_QUERY_PARAM]: normalized })
  return `${getSiteUrl()}/${locale}/search?${params.toString()}`
}
