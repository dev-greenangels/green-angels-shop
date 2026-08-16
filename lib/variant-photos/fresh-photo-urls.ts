import { resolveThumbUrl } from '@/lib/media/paths'
import { toPublicMediaUrl } from '@/lib/media/public-url'

export type FreshPhotoUrlFields = {
  url: string
  mainUrl?: string | null
  thumbUrl?: string | null
}

/**
 * Large / fullscreen Fresh Photo. Legacy originals without variants keep `url`.
 */
export function resolveFreshPhotoMainUrl(photo: FreshPhotoUrlFields): string {
  const explicit = photo.mainUrl?.trim()
  if (explicit) return toPublicMediaUrl(explicit)
  return toPublicMediaUrl(photo.url)
}

/**
 * Card / strip / catalog thumbnail. Prefer API `thumbUrl` when present
 * (legacy rows send the original URL). Otherwise derive `thumb.webp` from
 * a variant `main.webp` path; leave other URLs unchanged.
 */
export function resolveFreshPhotoThumbUrl(photo: FreshPhotoUrlFields): string {
  const explicit = photo.thumbUrl?.trim()
  if (explicit) return toPublicMediaUrl(explicit)
  return toPublicMediaUrl(resolveThumbUrl(photo.url))
}
