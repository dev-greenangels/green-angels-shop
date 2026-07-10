import { findVariantOnPlant } from '@/lib/cart-limits'
import { isVariantVisibleOnStorefront } from '@/lib/plant-variants'
import type { CartItem } from '@/lib/types'

/** Позиція в кошику ще доступна для замовлення (є залишок на складі). */
export function isCartItemInStock(item: CartItem): boolean {
  const variant = findVariantOnPlant(item.plant, item.variantId)
  if (!variant) return false
  return isVariantVisibleOnStorefront(variant)
}

export function getInStockCartItems(items: CartItem[]): CartItem[] {
  return items.filter(isCartItemInStock)
}

export function hasCheckoutableCartItems(items: CartItem[]): boolean {
  return getInStockCartItems(items).length > 0
}
