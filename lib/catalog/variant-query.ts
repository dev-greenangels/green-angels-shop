import type { ProductVariant } from '@/lib/types'

/** Merchant / deep-link query key for variant SKU preselection. */
export const VARIANT_SKU_QUERY_PARAM = 'variant'

/**
 * Decode `?variant=` safely. Invalid / empty → null (PDP keeps default selection).
 */
export function parseVariantSkuQueryParam(
  raw: string | string[] | null | undefined,
): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const decoded = decodeURIComponent(trimmed).trim()
    return decoded || null
  } catch {
    return trimmed
  }
}

/** Match visible sellable variant by exact SKU (trimmed). */
export function findVisibleVariantIdBySku(
  variants: Array<Pick<ProductVariant, 'id' | 'sku'>>,
  sku: string | null | undefined,
): string | null {
  const needle = sku?.trim()
  if (!needle) return null
  const match = variants.find((variant) => variant.sku?.trim() === needle)
  return match?.id ?? null
}

export function resolveInitialVariantId(input: {
  variants: Array<Pick<ProductVariant, 'id' | 'sku'>>
  preferredSku?: string | null
}): string | null {
  const fromSku = findVisibleVariantIdBySku(input.variants, input.preferredSku)
  if (fromSku) return fromSku
  return input.variants[0]?.id ?? null
}
