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

/** Оптові пороги (від 2+ шт.) — список під основною ціною. */
export function getBulkPriceTiers(variant: ProductVariant): PriceTier[] {
  return [...variant.priceTiers]
    .filter((t) => t.minQuantity > 1 && t.pricePerUnit < variant.basePrice)
    .sort((a, b) => a.minQuantity - b.minQuantity)
}

export type VariantDiscountLayout = 'none' | 'single-unit' | 'bulk'

export function getVariantDiscountLayout(variant: ProductVariant): VariantDiscountLayout {
  if (getBulkPriceTiers(variant).length > 0) return 'bulk'
  if (getSingleUnitSaleTier(variant)) return 'single-unit'
  return 'none'
}

/** Ціна за одиницю для заданої кількості з урахуванням градації */
export function getUnitPriceForQuantity(variant: ProductVariant, quantity: number): number {
  if (quantity <= 0) return variant.basePrice

  const tiers = [...variant.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity)
  const tier = tiers.find((t) => quantity >= t.minQuantity)
  return tier?.pricePerUnit ?? variant.basePrice
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
  if (plant.maxDiscountPercent != null && plant.maxDiscountPercent > 0) {
    return plant.maxDiscountPercent
  }

  if (!plant.variants?.length) return null

  let maxPercent = 0
  for (const variant of plant.variants) {
    if (variant.stock <= 0) continue
    const minPrice = getMinVariantPrice(variant)
    if (minPrice < variant.basePrice - 0.001) {
      maxPercent = Math.max(
        maxPercent,
        Math.round((1 - minPrice / variant.basePrice) * 100),
      )
    }
  }

  return maxPercent > 0 ? maxPercent : null
}
