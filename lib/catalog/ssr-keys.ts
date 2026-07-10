import type { CatalogFilters } from '@/lib/catalog/filter-plants'

export function buildCatalogProductsFetchKey(
  queryParams: Record<string, unknown>,
  sortBy: string,
  filters: CatalogFilters,
  page: number,
) {
  return `${JSON.stringify(queryParams)}|${sortBy}|${JSON.stringify(filters)}|${page}`
}

export function buildCatalogFacetFetchKey(
  scope: Record<string, unknown>,
  filters: CatalogFilters,
) {
  return `${JSON.stringify(scope)}|${JSON.stringify(filters)}`
}
