export const CATALOG_SORT_VALUES = ['name', 'price-asc', 'price-desc', 'newest', 'restocked', 'popular', 'low_stock'] as const

export type CatalogSortValue = (typeof CATALOG_SORT_VALUES)[number]

export const CATALOG_SORT_OPTIONS = CATALOG_SORT_VALUES.map((value) => ({ value }))
