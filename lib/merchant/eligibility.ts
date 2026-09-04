import { merchantAbsoluteImageUrls, collectMerchantProductImages } from './images'
import type { MerchantCatalogProduct } from './types'

/** Strip HTML and collapse whitespace for Merchant description. */
export function stripHtmlToPlainText(html: string | null | undefined): string {
  return (html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** Non-empty trimmed SKU, or null. Never falls back to UUID. */
export function merchantSku(variant: { sku?: string | null }): string | null {
  const sku = variant.sku?.trim()
  return sku || null
}

export function isMerchantVariantEligible(variant: {
  sku?: string | null
  stock: number
  price?: number
  basePrice?: number
}): boolean {
  if (!merchantSku(variant)) return false
  if (variant.stock <= 0) return false
  const stored = variant.basePrice ?? variant.price ?? 0
  return Number.isFinite(stored) && stored > 0
}

export function merchantProductPublicImages(
  product: MerchantCatalogProduct,
  opts?: { siteUrl?: string | null },
): string[] {
  return merchantAbsoluteImageUrls(collectMerchantProductImages(product), opts)
}

export function isMerchantProductEligible(
  product: MerchantCatalogProduct,
  opts?: { siteUrl?: string | null },
): boolean {
  if (product.isPublished === false) return false
  if (!product.name?.trim()) return false
  if (!product.slug?.trim()) return false
  if (!product.categorySlug?.trim()) return false
  if (!merchantProductPublicImages(product, opts).length) return false
  return product.variants.some((variant) =>
    isMerchantVariantEligible({
      sku: variant.sku,
      stock: variant.stock,
      basePrice: variant.price,
    }),
  )
}

export type MerchantExclusionReason = 'missing_sku' | 'out_of_stock' | 'invalid_price'

export function classifyMerchantVariantExclusion(variant: {
  sku?: string | null
  stock: number
  price?: number
  basePrice?: number
}): MerchantExclusionReason | null {
  if (!merchantSku(variant)) return 'missing_sku'
  if (variant.stock <= 0) return 'out_of_stock'
  const stored = variant.basePrice ?? variant.price ?? 0
  if (!Number.isFinite(stored) || stored <= 0) return 'invalid_price'
  return null
}
