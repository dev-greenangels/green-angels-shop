/** Default Fresh Photos cap per product variant size (`sizeId`). */
export const DEFAULT_FRESH_PHOTOS_LIMIT = 4
export const FRESH_PHOTOS_LIMIT_MIN = 1
/** Abuse cap — not a product-business maximum. */
export const FRESH_PHOTOS_LIMIT_MAX = 100

export function normalizeFreshPhotosLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_FRESH_PHOTOS_LIMIT
  }
  const n = Math.trunc(value)
  if (n < FRESH_PHOTOS_LIMIT_MIN) return DEFAULT_FRESH_PHOTOS_LIMIT
  return Math.min(FRESH_PHOTOS_LIMIT_MAX, n)
}
