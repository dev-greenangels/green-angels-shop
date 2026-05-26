import { getPlantVariants, getVariantMaxQuantity } from '@/lib/plant-variants'
import type { CartItem, Plant, ProductVariant } from '@/lib/types'

export function findVariantOnPlant(plant: Plant, variantId?: string): ProductVariant | null {
  const variants = getPlantVariants(plant)
  if (!variants.length) return null
  if (variantId) {
    return variants.find((v) => v.id === variantId) ?? null
  }
  return variants[0] ?? null
}

export function getCartLineQuantity(
  items: CartItem[],
  plantId: string,
  variantId?: string
): number {
  const item = items.find(
    (i) =>
      i.plant.id === plantId &&
      (i.variantId ?? undefined) === (variantId ?? undefined)
  )
  return item?.quantity ?? 0
}

/** Скільки ще можна додати в кошик для цього варіанту */
export function getMaxAddableQuantity(
  variant: ProductVariant,
  items: CartItem[],
  plantId: string
): number {
  const max = getVariantMaxQuantity(variant)
  const inCart = getCartLineQuantity(items, plantId, variant.id)
  return Math.max(0, max - inCart)
}

export function getCartItemMaxQuantity(item: CartItem): number {
  const variant = findVariantOnPlant(item.plant, item.variantId)
  if (variant) return getVariantMaxQuantity(variant)
  return Math.max(0, item.plant.stock)
}

export function getPlantLineMaxQuantity(plant: Plant, variant?: ProductVariant): number {
  if (variant) return getVariantMaxQuantity(variant)
  const fallback = findVariantOnPlant(plant)
  if (fallback) return getVariantMaxQuantity(fallback)
  return Math.max(0, plant.stock)
}
