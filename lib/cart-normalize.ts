import { getCartItemMaxQuantity } from '@/lib/cart-limits'
import { getPlantVariants, getVariantMaxQuantity } from '@/lib/plant-variants'
import type { CartItem, Plant, ProductVariant } from '@/lib/types'

export function cartLineKey(plantId: string, variantId: string) {
  return `${plantId}:${variantId}`
}

/** Канонічний варіант для позиції кошика (у т.ч. legacy без variantId). */
export function resolveCartLineVariant(
  plant: Plant,
  variantId?: string
): ProductVariant | null {
  const variants = getPlantVariants(plant)
  if (!variants.length) return null

  if (variantId) {
    const found = variants.find((v) => v.id === variantId)
    if (found) return found
  }

  return variants[0] ?? null
}

export function normalizeCartItem(item: CartItem): CartItem | null {
  const variant = resolveCartLineVariant(item.plant, item.variantId)
  if (!variant) return null

  const maxQty = getVariantMaxQuantity(variant)
  const quantity = Math.min(Math.max(0, item.quantity), maxQty)
  if (quantity <= 0) return null

  return {
    plant: item.plant,
    quantity,
    variantId: variant.id,
    variantLabel: variant.label,
    unitPrice: item.unitPrice ?? variant.basePrice,
  }
}

/** Нормалізує позиції та зливає дублікати після міграції legacy-рядків. */
export function normalizeCartItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>()

  for (const raw of items) {
    const item = normalizeCartItem(raw)
    if (!item) continue

    const key = cartLineKey(item.plant.id, item.variantId)
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
