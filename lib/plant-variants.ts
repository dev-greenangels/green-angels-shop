import type { Plant, ProductVariant } from './types'

/** Макс. кількість для бронювання, якщо на складі 0, але є дата відвантаження */
const DEFAULT_PREORDER_MAX_QTY = 99

export function getPlantVariants(plant: Plant): ProductVariant[] {
  return plant.variants ?? []
}

/** Розміри з ненульовим залишком — лише вони показуються на вітрині. */
export function isVariantVisibleOnStorefront(variant: ProductVariant): boolean {
  return variant.stock > 0
}

export function getVisiblePlantVariants(plant: Plant): ProductVariant[] {
  return getPlantVariants(plant).filter(isVariantVisibleOnStorefront)
}

export function getPlantDisplayPrice(plant: Plant): number {
  const variants = getPlantVariants(plant)
  if (!variants.length) return plant.price
  return Math.min(...variants.map((variant) => variant.basePrice))
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

/** Хоча б один розмір доступний для замовлення на вітрині */
export function isPlantOrderable(variants: ProductVariant[]): boolean {
  return variants.some(isVariantVisibleOnStorefront)
}

/** Усі розміри з нульовим залишком — показуємо «немає в наявності» і підписку */
export function isPlantFullyUnavailable(variants: ProductVariant[]): boolean {
  return variants.length === 0
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
