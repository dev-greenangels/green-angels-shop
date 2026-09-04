export const CATEGORY_COVER = 'cover.webp'
export const CATEGORY_THUMB = 'cover-thumb.webp'
export const PRODUCT_MAIN = 'main.webp'
export const PRODUCT_THUMB = 'thumb.webp'
export const BLOG_COVER = 'cover.webp'
export const BLOG_THUMB = 'cover-thumb.webp'

export const BLOG_IMAGE_PATH_REGEX =
  /^\/uploads\/blog\/(?:pending\/)?[a-f0-9-]+\/cover\.webp$/i

export function isBlogImagePath(url: string): boolean {
  return BLOG_IMAGE_PATH_REGEX.test(url.trim())
}

export function buildBlogCoverUrl(blogId: string): string {
  return `/uploads/blog/${blogId}/${BLOG_COVER}`
}

export function buildBlogPendingCoverUrl(pendingId: string): string {
  return `/uploads/blog/pending/${pendingId}/${BLOG_COVER}`
}

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

export const HOME_HERO_IMAGE_PATH_REGEX =
  /^\/uploads\/settings\/home-hero\/v\d+\/cover\.webp$/i

export function isHomeHeroImagePath(url: string): boolean {
  return HOME_HERO_IMAGE_PATH_REGEX.test(url.trim())
}

export const HOME_HERO_MOBILE_IMAGE_PATH_REGEX =
  /^\/uploads\/settings\/home-hero-mobile\/v\d+\/cover\.webp$/i

export function isHomeHeroMobileImagePath(url: string): boolean {
  return HOME_HERO_MOBILE_IMAGE_PATH_REGEX.test(url.trim())
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

/** Для карток каталогу — менший файл. Product / category / blog / Fresh Photo `main.webp`. */
export function resolveThumbUrl(url: string): string {
  if (url.includes(`/${PRODUCT_MAIN}`)) {
    return url.replace(`/${PRODUCT_MAIN}`, `/${PRODUCT_THUMB}`)
  }
  if (url.endsWith(`/${CATEGORY_COVER}`)) {
    return url.replace(`/${CATEGORY_COVER}`, `/${CATEGORY_THUMB}`)
  }
  if (url.endsWith(`/${BLOG_COVER}`)) {
    return url.replace(`/${BLOG_COVER}`, `/${BLOG_THUMB}`)
  }
  return url
}
