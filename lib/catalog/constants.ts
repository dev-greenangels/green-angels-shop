export const CATALOG_PAGE_SIZE = 50
/** PDP “similar plants” — must match Nest `take` via `GET /products?limit=`. */
export const RELATED_PRODUCTS_LIMIT = 4
/**
 * Homepage pin textarea has no max. Cap unique slugs per section fetch so one
 * `GET /products?slugs=` cannot dump the catalog. Matches Nest unpaginated take.
 */
export const HOME_PINNED_SLUGS_MAX = 24
