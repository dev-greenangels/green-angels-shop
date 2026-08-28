export const CATEGORY_DEFAULT_IMAGE = '/images/category-placeholder.svg'

export {
  buildCategoryImageUrl,
  isCategoryImagePath,
  resolveThumbUrl,
} from '@/lib/media/paths'
export { getImageExtension as getCategoryImageExtension, validateImageFile as validateCategoryImageFile } from '@/lib/media/validate'

import { resolveThumbUrl } from '@/lib/media/paths'
import { toPublicMediaUrl } from '@/lib/media/public-url'

export function isCategoryPlaceholderImage(url: string | null | undefined): boolean {
  if (!url?.trim()) return true
  const trimmed = url.trim()
  return trimmed === CATEGORY_DEFAULT_IMAGE || trimmed.endsWith('/category-placeholder.svg')
}

export function resolveCategoryImageUrl(image: string | null | undefined): string {
  const trimmed = image?.trim()
  return toPublicMediaUrl(trimmed || CATEGORY_DEFAULT_IMAGE)
}

export function resolveCategoryThumbUrl(image: string | null | undefined): string {
  const trimmed = image?.trim()
  if (!trimmed) return CATEGORY_DEFAULT_IMAGE
  return toPublicMediaUrl(resolveThumbUrl(trimmed))
}

/** Backstage lists/editors: thumb variant + optional CDN base (`NEXT_PUBLIC_MEDIA_BASE_URL`). */
export function resolveBackstageThumbnailSrc(image: string | null | undefined): string {
  if (isCategoryPlaceholderImage(image)) return image?.trim() || CATEGORY_DEFAULT_IMAGE
  return resolveCategoryThumbUrl(image)
}
