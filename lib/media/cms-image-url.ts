import { CATEGORY_DEFAULT_IMAGE } from '@/lib/category-image'

const LEGACY_CMS_HOST = /landshaft\.info/i

export function isLegacyCmsImageUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return false
  try {
    return LEGACY_CMS_HOST.test(new URL(trimmed).hostname)
  } catch {
    return LEGACY_CMS_HOST.test(trimmed)
  }
}

/** Strip legacy CMS hosts and blank values — safe for storage/API. */
export function sanitizeCmsImageUrl(url: string | null | undefined): string {
  const trimmed = url?.trim() ?? ''
  if (!trimmed || isLegacyCmsImageUrl(trimmed)) return ''
  return trimmed
}

/** Storefront display: legacy/blank → category placeholder. */
export function resolveCmsDisplayImageUrl(url: string | null | undefined): string {
  const sanitized = sanitizeCmsImageUrl(url)
  return sanitized || CATEGORY_DEFAULT_IMAGE
}
