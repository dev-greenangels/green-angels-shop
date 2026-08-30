import { resolveThumbUrl } from '@/lib/media/paths'
import { toPublicMediaUrl } from '@/lib/media/public-url'

/** Public hero image URL for storefront / OG (uploads → CDN when configured). */
export function resolveHeroDisplayUrl(imageUrl: string | null | undefined): string | null {
  const trimmed = imageUrl?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/uploads/')) return toPublicMediaUrl(trimmed)
  if (trimmed.startsWith('/images/')) return trimmed
  return null
}

/** Backstage preview — smaller thumb when available. */
export function resolveHeroPreviewUrl(imageUrl: string | null | undefined): string {
  const display = resolveHeroDisplayUrl(imageUrl)
  if (!display) return ''
  if (display.startsWith('/images/')) return display
  return toPublicMediaUrl(resolveThumbUrl(display))
}
