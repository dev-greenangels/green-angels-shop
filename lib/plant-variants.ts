import { DEFAULT_TIER_THRESHOLDS } from './product-pricing'
import type { Plant, ProductVariant, PriceTier } from './types'

/** Макс. кількість для бронювання, якщо на складі 0, але є дата відвантаження */
const DEFAULT_PREORDER_MAX_QTY = 99

function buildDefaultTiers(basePrice: number): PriceTier[] {
  const discounts = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7]
  return DEFAULT_TIER_THRESHOLDS.map((minQuantity, i) => ({
    minQuantity,
    pricePerUnit: Math.round(basePrice * discounts[i]),
  }))
}

export function getPlantVariants(plant: Plant): ProductVariant[] {
  if (plant.variants?.length) return plant.variants

  return [
    {
      id: `${plant.id}-default`,
      label: plant.containerSize,
      stock: plant.stock,
      basePrice: plant.price,
      priceTiers: buildDefaultTiers(plant.price),
    },
  ]
}

export function getPlantDisplayPrice(plant: Plant): number {
  const variants = getPlantVariants(plant)
  return Math.min(...variants.map((v) => v.basePrice))
}

export function variantHasPriceTiers(variant: ProductVariant): boolean {
  return variant.priceTiers.length > 0
}

export function variantHasAvailableFrom(variant: ProductVariant): boolean {
  return Boolean(variant.availableFrom?.trim())
}

/** Є фізичний залишок на складі */
export function variantHasStock(variant: ProductVariant): boolean {
  return variant.stock > 0
}

/** Можна купити / забронювати: є залишок або вказано дату відвантаження */
export function canOrderVariant(variant: ProductVariant): boolean {
  return variantHasStock(variant) || variantHasAvailableFrom(variant)
}

/** Хоча б один розмір доступний для замовлення */
export function isPlantOrderable(variants: ProductVariant[]): boolean {
  return variants.some(canOrderVariant)
}

/** Усі розміри недоступні — показуємо «немає в наявності» і підписку */
export function isPlantFullyUnavailable(variants: ProductVariant[]): boolean {
  return !isPlantOrderable(variants)
}

/** @deprecated використовуйте isPlantOrderable / variantHasStock */
export function isPlantInStock(variants: ProductVariant[]): boolean {
  return variants.some(variantHasStock)
}

export function getVariantMaxQuantity(variant: ProductVariant): number {
  if (variant.stock > 0) return variant.stock
  if (variantHasAvailableFrom(variant)) return DEFAULT_PREORDER_MAX_QTY
  return 0
}

/** Для відображення в колонці «Наявність»: при бронюванні — ліміт, а не 0 */
export function getVariantDisplayStock(variant: ProductVariant): number {
  if (variant.stock > 0) return variant.stock
  if (variantHasAvailableFrom(variant)) return getVariantMaxQuantity(variant)
  return 0
}

export function isVariantPreorder(variant: ProductVariant): boolean {
  return variant.stock <= 0 && variantHasAvailableFrom(variant)
}

export function tableShowsPriceTiers(variants: ProductVariant[]): boolean {
  return variants.some(variantHasPriceTiers)
}

export function tableShowsAvailableFrom(variants: ProductVariant[]): boolean {
  return variants.some(variantHasAvailableFrom)
}
