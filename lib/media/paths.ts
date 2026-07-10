export const CATEGORY_COVER = 'cover.webp'
export const CATEGORY_THUMB = 'cover-thumb.webp'
export const PRODUCT_MAIN = 'main.webp'
export const PRODUCT_THUMB = 'thumb.webp'

/** Новий формат: /uploads/categories/{id}/v{revision}/cover.webp або pending */
export const CATEGORY_IMAGE_PATH_REGEX =
  /^\/uploads\/categories\/(?:pending\/[a-f0-9-]+|[a-f0-9-]{36})(?:\/v\d+)?\/cover\.webp$/i

/** Старий формат (до рефакторингу) */
export const LEGACY_CATEGORY_IMAGE_PATH_REGEX =
  /^\/uploads\/categories\/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i

export const PRODUCT_IMAGE_PATH_REGEX =
  /^\/uploads\/products\/(?:pending\/[a-f0-9-]+|[a-f0-9-]{36})\/[a-f0-9-]{36}\/main\.webp$/i

export function isCategoryImagePath(url: string): boolean {
  const trimmed = url.trim()
  return (
    CATEGORY_IMAGE_PATH_REGEX.test(trimmed) || LEGACY_CATEGORY_IMAGE_PATH_REGEX.test(trimmed)
  )
}

export function isProductImagePath(url: string): boolean {
  return PRODUCT_IMAGE_PATH_REGEX.test(url.trim())
}

export function isPendingCategoryPath(url: string): boolean {
  return /^\/uploads\/categories\/pending\/[a-f0-9-]+\/cover\.webp$/i.test(url.trim())
}

export function isPendingProductPath(url: string): boolean {
  return /^\/uploads\/products\/pending\/[a-f0-9-]+\/[a-f0-9-]+\/main\.webp$/i.test(
    url.trim(),
  )
}

export function buildCategoryImageUrl(categoryId: string, revision: number = Date.now()): string {
  return `/uploads/categories/${categoryId}/v${revision}/${CATEGORY_COVER}`
}

export function buildCategoryPendingUrl(pendingId: string): string {
  return `/uploads/categories/pending/${pendingId}/${CATEGORY_COVER}`
}

export function buildProductImageUrl(productId: string, imageId: string): string {
  return `/uploads/products/${productId}/${imageId}/${PRODUCT_MAIN}`
}

export function buildProductPendingUrl(pendingId: string, imageId: string): string {
  return `/uploads/products/pending/${pendingId}/${imageId}/${PRODUCT_MAIN}`
}

/** Для карток каталогу — менший файл. */
export function resolveThumbUrl(url: string): string {
  if (url.includes(`/${PRODUCT_MAIN}`)) {
    return url.replace(`/${PRODUCT_MAIN}`, `/${PRODUCT_THUMB}`)
  }
  if (url.endsWith(`/${CATEGORY_COVER}`)) {
    return url.replace(`/${CATEGORY_COVER}`, `/${CATEGORY_THUMB}`)
  }
  return url
}
