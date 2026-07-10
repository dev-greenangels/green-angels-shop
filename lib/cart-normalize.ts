import { getCartItemMaxQuantity } from '@/lib/cart-limits'
import { isProductVariantUuid } from '@/lib/pricing/quote-line-items'
import {
  getPlantVariants,
  getVariantMaxQuantity,
  isVariantVisibleOnStorefront,
} from '@/lib/plant-variants'
import type { CartItem, Plant, ProductVariant } from '@/lib/types'

export function cartLineKey(plantId: string, variantId: string) {
  return `${plantId}:${variantId}`
}

export function resolveCartLineVariant(
  plant: Plant,
  variantId?: string,
): ProductVariant | null {
  const variants = getPlantVariants(plant)
  if (!variants.length) return null

  if (variantId && isProductVariantUuid(variantId)) {
    return variants.find((variant) => variant.id === variantId) ?? null
  }

  return variants.length === 1 ? variants[0]! : null
}

export function normalizeCartItem(item: CartItem): CartItem | null {
  const variant = resolveCartLineVariant(item.plant, item.variantId)
  if (!variant || !isProductVariantUuid(variant.id)) return null

  if (!isVariantVisibleOnStorefront(variant)) {
    const quantity = Math.max(1, item.quantity)
    return {
      plant: item.plant,
      quantity,
      variantId: variant.id,
      variantLabel: variant.label,
      unitPrice: item.unitPrice ?? variant.basePrice,
    }
  }

  const maxQty = getVariantMaxQuantity(variant)
  const quantity = Math.min(Math.max(1, item.quantity), maxQty)
  if (quantity <= 0) return null

  return {
    plant: item.plant,
    quantity,
    variantId: variant.id,
    variantLabel: variant.label,
    unitPrice: item.unitPrice ?? variant.basePrice,
  }
}

export function normalizeCartItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>()

  for (const raw of items) {
    const item = normalizeCartItem(raw)
    if (!item) continue

    const key = cartLineKey(item.plant.id, item.variantId!)
    const existing = merged.get(key)

    if (!existing) {
      merged.set(key, item)
      continue
    }

    const combinedQty = existing.quantity + item.quantity
    const candidate: CartItem = { ...existing, quantity: combinedQty }
    const cappedQty = Math.min(combinedQty, getCartItemMaxQuantity(candidate))
    merged.set(key, { ...candidate, quantity: cappedQty })
  }

  return Array.from(merged.values())
}

export type PersistedCartState = {
  items: CartItem[]
}
