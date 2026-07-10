import {
  CATEGORY_DEFAULT_IMAGE,
  isCategoryPlaceholderImage,
} from '@/lib/category-image'

export const PRODUCT_PLACEHOLDER_IMAGE = CATEGORY_DEFAULT_IMAGE

export function isProductPlaceholderImage(url: string | null | undefined): boolean {
  return isCategoryPlaceholderImage(url)
}

export function hasProductImage(images: string[] | null | undefined): boolean {
  const first = images?.[0]?.trim()
  return Boolean(first && !isProductPlaceholderImage(first))
}
