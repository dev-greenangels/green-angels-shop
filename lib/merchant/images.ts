import { isProductPlaceholderImage } from '@/lib/product-image'
import { getPublicMediaBaseUrl, toPublicMediaUrl } from '@/lib/media/public-url'

/**
 * Absolute public image URLs for Merchant.
 * Prefer R2/CDN (`NEXT_PUBLIC_MEDIA_BASE_URL`); fall back to site origin for `/uploads/…`
 * so local MEDIA_DRIVER=local paths become crawlable absolute URLs.
 */
export function merchantAbsoluteImageUrls(
  rawUrls: string[],
  opts?: { siteUrl?: string | null },
): string[] {
  const mediaBase = getPublicMediaBaseUrl()
  const siteBase = (opts?.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')

  const seen = new Set<string>()
  const out: string[] = []

  for (const raw of rawUrls) {
    let url = toPublicMediaUrl(raw)?.trim() || ''
    if (!url || isProductPlaceholderImage(url)) continue

    if (url.startsWith('/uploads/')) {
      const base = mediaBase || siteBase
      if (!base) continue
      url = `${base}${url}`
    }

    if (!/^https?:\/\//i.test(url)) continue
    if (seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }

  return out
}

export function collectMerchantProductImages(product: {
  images?: string[]
  imageUrl?: string | null
}): string[] {
  if (product.images?.length) return product.images
  if (product.imageUrl) return [product.imageUrl]
  return []
}
