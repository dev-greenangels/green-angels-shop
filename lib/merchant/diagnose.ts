/**
 * Diagnostics helpers — thin wrappers over the authoritative `evaluate` module
 * so feed XML and Backoffice cannot diverge.
 */
export {
  emptyMerchantDiagCounters,
  evaluateMerchantCatalog,
  evaluateMerchantVariant,
  merchantFeedHealth,
  type MerchantCatalogEvaluation,
  type MerchantDiagCounters,
  type MerchantExcludeReason,
  type MerchantFeedHealth,
  type MerchantVariantEvaluation,
} from './evaluate'

import { evaluateMerchantCatalog, evaluateMerchantVariant } from './evaluate'
import type { MerchantCatalogProduct } from './types'

export type VariantTraceResult = {
  sku: string
  productSlug: string | null
  productFound: boolean
  isPublished: boolean | null
  name: string | null
  categorySlug: string | null
  skuPresent: boolean
  stock: number | null
  price: number | null
  rawImages: string[]
  absoluteImages: string[]
  decision: 'included' | 'excluded'
  excludeReason: string | null
}

export function diagnoseMerchantCatalog(
  products: MerchantCatalogProduct[],
  opts?: { siteUrl?: string | null },
) {
  return evaluateMerchantCatalog(products, opts).counters
}

export function traceMerchantVariantBySku(
  products: MerchantCatalogProduct[],
  sku: string,
  opts?: { siteUrl?: string | null },
): VariantTraceResult {
  const needle = sku.trim()
  for (const product of products) {
    const variant = product.variants.find((row) => row.sku?.trim() === needle)
    if (!variant) continue
    const ev = evaluateMerchantVariant(product, variant, opts)
    return {
      sku: needle,
      productSlug: ev.productSlug,
      productFound: true,
      isPublished: product.isPublished !== false,
      name: ev.productName,
      categorySlug: ev.categorySlug,
      skuPresent: Boolean(ev.sku),
      stock: ev.stock,
      price: ev.price,
      rawImages: ev.rawImages,
      absoluteImages: ev.absoluteImages,
      decision: ev.decision,
      excludeReason: ev.reason,
    }
  }

  return {
    sku: needle,
    productSlug: null,
    productFound: false,
    isPublished: null,
    name: null,
    categorySlug: null,
    skuPresent: false,
    stock: null,
    price: null,
    rawImages: [],
    absoluteImages: [],
    decision: 'excluded',
    excludeReason: 'other',
  }
}
