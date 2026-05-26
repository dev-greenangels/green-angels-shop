import type { PriceTier, ProductVariant } from './types'

/** Стандартні пороги оптових знижок (шт.) */
export const DEFAULT_TIER_THRESHOLDS = [5, 10, 50, 100, 500, 1000] as const

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

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('uk-UA')} ₴`
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
