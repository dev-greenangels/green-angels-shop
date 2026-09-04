import type { SeoOfferContext } from '@/lib/seo/offer-context'

import { merchantSku } from './eligibility'
import { collectMerchantProductImages, merchantAbsoluteImageUrls } from './images'
import type { MerchantCatalogProduct } from './types'

export type MerchantExcludeReason =
  | 'unpublished_product'
  | 'missing_locale_name'
  | 'missing_category_slug'
  | 'missing_non_public_image'
  | 'missing_sku'
  | 'stock_le_0'
  | 'invalid_missing_price'
  | 'other'

export type MerchantVariantEvaluation = {
  decision: 'included' | 'excluded'
  reason: MerchantExcludeReason | null
  productId: string
  productName: string
  latinName: string | null
  productSlug: string
  categorySlug: string
  variantId: string
  sku: string | null
  variantLabel: string | null
  stock: number
  price: number
  rawImages: string[]
  absoluteImages: string[]
}

export type MerchantEvalOpts = {
  siteUrl?: string | null
  /** When set, shelf offer must resolve (> 0) for inclusion (same as XML feed). */
  resolveOffer?: (storedPrice: number) => SeoOfferContext | null
}

/**
 * Authoritative include/exclude decision for one variant.
 * Used by XML feed generation and Backoffice diagnostics.
 */
export function evaluateMerchantVariant(
  product: MerchantCatalogProduct,
  variant: MerchantCatalogProduct['variants'][number],
  opts?: MerchantEvalOpts,
): MerchantVariantEvaluation {
  const rawImages = collectMerchantProductImages(product)
  const absoluteImages = merchantAbsoluteImageUrls(rawImages, { siteUrl: opts?.siteUrl })
  const sku = merchantSku(variant)
  const base: Omit<MerchantVariantEvaluation, 'decision' | 'reason'> = {
    productId: product.id,
    productName: product.name?.trim() || '',
    latinName: product.latinName?.trim() || null,
    productSlug: product.slug?.trim() || '',
    categorySlug: product.categorySlug?.trim() || '',
    variantId: variant.id,
    sku,
    variantLabel: variant.label?.trim() || null,
    stock: variant.stock,
    price: variant.price,
    rawImages,
    absoluteImages,
  }

  const exclude = (reason: MerchantExcludeReason): MerchantVariantEvaluation => ({
    ...base,
    decision: 'excluded',
    reason,
  })

  if (product.isPublished === false) return exclude('unpublished_product')
  if (!base.productName) return exclude('missing_locale_name')
  if (!base.productSlug || !base.categorySlug) return exclude('missing_category_slug')
  if (!absoluteImages.length) return exclude('missing_non_public_image')
  if (!sku) return exclude('missing_sku')
  if (variant.stock <= 0) return exclude('stock_le_0')
  if (!Number.isFinite(variant.price) || variant.price <= 0) {
    return exclude('invalid_missing_price')
  }
  if (opts?.resolveOffer) {
    const offer = opts.resolveOffer(variant.price)
    if (!offer || offer.price <= 0) return exclude('invalid_missing_price')
  }

  return { ...base, decision: 'included', reason: null }
}

export type MerchantDiagCounters = {
  productsFetched: number
  variantsInspected: number
  included: number
  excluded: number
  excludedUnpublishedProduct: number
  excludedMissingLocaleName: number
  excludedMissingCategorySlug: number
  excludedStockLe0: number
  excludedMissingSku: number
  excludedInvalidMissingPrice: number
  excludedMissingNonPublicImage: number
  excludedOther: number
}

export function emptyMerchantDiagCounters(): MerchantDiagCounters {
  return {
    productsFetched: 0,
    variantsInspected: 0,
    included: 0,
    excluded: 0,
    excludedUnpublishedProduct: 0,
    excludedMissingLocaleName: 0,
    excludedMissingCategorySlug: 0,
    excludedStockLe0: 0,
    excludedMissingSku: 0,
    excludedInvalidMissingPrice: 0,
    excludedMissingNonPublicImage: 0,
    excludedOther: 0,
  }
}

function bumpReason(c: MerchantDiagCounters, reason: MerchantExcludeReason) {
  c.excluded += 1
  switch (reason) {
    case 'unpublished_product':
      c.excludedUnpublishedProduct += 1
      break
    case 'missing_locale_name':
      c.excludedMissingLocaleName += 1
      break
    case 'missing_category_slug':
      c.excludedMissingCategorySlug += 1
      break
    case 'stock_le_0':
      c.excludedStockLe0 += 1
      break
    case 'missing_sku':
      c.excludedMissingSku += 1
      break
    case 'invalid_missing_price':
      c.excludedInvalidMissingPrice += 1
      break
    case 'missing_non_public_image':
      c.excludedMissingNonPublicImage += 1
      break
    default:
      c.excludedOther += 1
  }
}

export type MerchantCatalogEvaluation = {
  counters: MerchantDiagCounters
  rows: MerchantVariantEvaluation[]
  includedRows: MerchantVariantEvaluation[]
  excludedRows: MerchantVariantEvaluation[]
}

/** Evaluate every variant once — shared by feed XML + diagnostics. */
export function evaluateMerchantCatalog(
  products: MerchantCatalogProduct[],
  opts?: MerchantEvalOpts,
): MerchantCatalogEvaluation {
  const counters = emptyMerchantDiagCounters()
  counters.productsFetched = products.length
  const rows: MerchantVariantEvaluation[] = []

  for (const product of products) {
    for (const variant of product.variants) {
      counters.variantsInspected += 1
      const ev = evaluateMerchantVariant(product, variant, opts)
      rows.push(ev)
      if (ev.decision === 'included') counters.included += 1
      else if (ev.reason) bumpReason(counters, ev.reason)
      else {
        counters.excluded += 1
        counters.excludedOther += 1
      }
    }
  }

  return {
    counters,
    rows,
    includedRows: rows.filter((r) => r.decision === 'included'),
    excludedRows: rows.filter((r) => r.decision === 'excluded'),
  }
}

export type MerchantFeedHealth = 'OK' | 'WARN' | 'ERROR'

export function merchantFeedHealth(included: number, excluded: number): MerchantFeedHealth {
  if (included <= 0) return 'ERROR'
  if (excluded > 0) return 'WARN'
  return 'OK'
}
