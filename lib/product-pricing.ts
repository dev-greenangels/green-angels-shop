import type { PriceTier, ProductVariant } from './types'

import { DEFAULT_CURRENCY } from '@/lib/commerce/defaults'
import { formatMoneyAmount } from '@/lib/commerce/format'

/** Стандартні пороги оптових знижок (шт.) */
export const DEFAULT_TIER_THRESHOLDS = [5, 10, 50, 100, 500, 1000] as const

/** Знижка від 1 шт. — показуємо перекреслену базову та акційну ціну в заголовку. */
export function getSingleUnitSaleTier(variant: ProductVariant): PriceTier | null {
  const tier = variant.priceTiers.find((t) => t.minQuantity === 1)
  if (!tier || tier.pricePerUnit >= variant.basePrice) return null
  return tier
}

/** Оптові пороги (від 2+ шт.) відносно basePrice. */
export function getBulkPriceTiersFrom(
  basePrice: number,
  priceTiers: PriceTier[],
  options?: { maxPurchasableQty?: number | null },
): PriceTier[] {
  const maxQty = options?.maxPurchasableQty
  return [...priceTiers]
    .filter((t) => t.minQuantity > 1 && t.pricePerUnit < basePrice - 0.001)
    .filter((t) => {
      if (maxQty == null || !Number.isFinite(maxQty)) return true
      if (maxQty <= 0) return false
      return t.minQuantity <= maxQty
    })
    .sort((a, b) => a.minQuantity - b.minQuantity)
}

/** Оптові пороги (від 2+ шт.) — список під основною ціною. */
export function getBulkPriceTiers(variant: ProductVariant): PriceTier[] {
  return getBulkPriceTiersFrom(variant.basePrice, variant.priceTiers, {
    maxPurchasableQty: variant.stock,
  })
}

export type VariantDiscountLayout = 'none' | 'single-unit' | 'bulk'

export function getVariantDiscountLayout(variant: ProductVariant): VariantDiscountLayout {
  if (getBulkPriceTiers(variant).length > 0) return 'bulk'
  if (getSingleUnitSaleTier(variant)) return 'single-unit'
  return 'none'
}

/** Ціна за одиницю з готової драбини (серверний ladder або Product Card tiers). */
export function getUnitPriceForQuantityFrom(
  basePrice: number,
  priceTiers: PriceTier[],
  quantity: number,
): number {
  if (quantity <= 0) return basePrice
  const tiers = [...priceTiers].sort((a, b) => b.minQuantity - a.minQuantity)
  const tier = tiers.find((t) => quantity >= t.minQuantity)
  return tier?.pricePerUnit ?? basePrice
}

/** Ціна за одиницю для заданої кількості з урахуванням градації */
export function getUnitPriceForQuantity(variant: ProductVariant, quantity: number): number {
  return getUnitPriceForQuantityFrom(variant.basePrice, variant.priceTiers, quantity)
}

export function getLineTotal(variant: ProductVariant, quantity: number): number {
  return getUnitPriceForQuantity(variant, quantity) * quantity
}

export function formatPrice(amount: number, locale: string = 'uk'): string {
  return formatMoneyAmount(amount, DEFAULT_CURRENCY, locale)
}

export function getMinVariantPrice(variant: ProductVariant): number {
  if (!variant.priceTiers.length) return variant.basePrice
  return Math.min(variant.basePrice, ...variant.priceTiers.map((t) => t.pricePerUnit))
}

export function getMaxVariantPrice(variant: ProductVariant): number {
  if (!variant.priceTiers.length) return variant.basePrice
  return Math.max(variant.basePrice, ...variant.priceTiers.map((t) => t.pricePerUnit))
}

export function getVariantPriceRange(variants: ProductVariant[]): {
  min: number
  max: number
} {
  if (!variants.length) return { min: 0, max: 0 }
  const mins = variants.map(getMinVariantPrice)
  const maxes = variants.map(getMaxVariantPrice)
  return { min: Math.min(...mins), max: Math.max(...maxes) }
}

/** Максимальний відсоток знижки по всіх видимих варіантах (лише реальні priceTiers). */
export function getPlantMaxDiscountPercent(plant: {
  variants?: ProductVariant[]
  maxDiscountPercent?: number | null
}): number | null {
  return getPlantDiscountBadge(plant)?.percent ?? null
}

export type PlantDiscountBadge = {
  percent: number
  /** True when max % is from qty>1 tiers / multiple thresholds → show «до −N%». */
  upTo: boolean
}

/** Whether this variant’s discount needs an «up to» badge (bulk / multi-tier). */
export function variantDiscountBadgeUsesUpTo(variant: ProductVariant): boolean {
  // Ignore stock cap — same ladder used for max % (badge should say «до» if qty>1 steps exist).
  return getBulkPriceTiersFrom(variant.basePrice, variant.priceTiers).length > 0
}

/**
 * Card badge: max % off Product Card / ladder, plus whether to prefix «до / up to».
 * `upTo` when any in-stock variant has a discounted step at qty ≥ 2 (one or more thresholds).
 */
export function getPlantDiscountBadge(plant: {
  variants?: ProductVariant[]
  maxDiscountPercent?: number | null
}): PlantDiscountBadge | null {
  const variants = plant.variants ?? []
  let maxPercent = 0
  let upTo = false

  for (const variant of variants) {
    if (variant.stock <= 0) continue
    if (variantDiscountBadgeUsesUpTo(variant)) upTo = true
    const minPrice = getMinVariantPrice(variant)
    if (minPrice < variant.basePrice - 0.001) {
      maxPercent = Math.max(
        maxPercent,
        Math.round((1 - minPrice / variant.basePrice) * 100),
      )
    }
  }

  if (maxPercent <= 0 && plant.maxDiscountPercent != null && plant.maxDiscountPercent > 0) {
    // Nest compare-at fallback has no ladder → treat as exact (not «до»).
    return { percent: plant.maxDiscountPercent, upTo: false }
  }

  if (maxPercent <= 0) return null
  return { percent: maxPercent, upTo }
}

/** Single-variant badge (fresh photos / PDP overlays). */
export function getVariantDiscountBadge(variant: ProductVariant | null | undefined): PlantDiscountBadge | null {
  if (!variant || variant.basePrice <= 0) return null
  const minPrice = getMinVariantPrice(variant)
  if (minPrice >= variant.basePrice - 0.001) return null
  const percent = Math.round((1 - minPrice / variant.basePrice) * 100)
  if (percent <= 0) return null
  return { percent, upTo: variantDiscountBadgeUsesUpTo(variant) }
}
