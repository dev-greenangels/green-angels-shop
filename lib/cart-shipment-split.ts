import { findVariantOnPlant } from '@/lib/cart-limits'
import { variantHasAvailableFrom } from '@/lib/plant-variants'
import type { CartItem } from '@/lib/types'

export type ShipmentSplitMode = 'together' | 'split'

export function getCartItemShipmentDate(item: CartItem): string | null {
  const variant = findVariantOnPlant(item.plant, item.variantId)
  if (!variant || !variantHasAvailableFrom(variant) || !variant.availableFrom?.trim()) {
    return null
  }
  return variant.availableFrom.trim()
}

export function partitionCartByShipmentDate(items: CartItem[]): {
  immediate: CartItem[]
  dated: CartItem[]
} {
  const immediate: CartItem[] = []
  const dated: CartItem[] = []

  for (const item of items) {
    if (getCartItemShipmentDate(item)) {
      dated.push(item)
    } else {
      immediate.push(item)
    }
  }

  return { immediate, dated }
}

/** Потрібен вибір: є і товари з датою відвантаження, і без неї. */
export function cartNeedsShipmentSplitChoice(items: CartItem[]): boolean {
  const { immediate, dated } = partitionCartByShipmentDate(items)
  return immediate.length > 0 && dated.length > 0
}

function parseShipmentDisplayDate(value: string): number | null {
  const parts = value.trim().split('.')
  if (parts.length !== 3) return null
  const [day, month, year] = parts.map((part) => Number.parseInt(part, 10))
  if (!day || !month || !year) return null
  const timestamp = Date.UTC(year, month - 1, day)
  const date = new Date(timestamp)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return timestamp
}

export function getLatestShipmentDate(items: CartItem[]): string | null {
  let latestValue: string | null = null
  let latestTimestamp = Number.NEGATIVE_INFINITY

  for (const item of items) {
    const date = getCartItemShipmentDate(item)
    if (!date) continue
    const timestamp = parseShipmentDisplayDate(date)
    if (timestamp == null) continue
    if (timestamp >= latestTimestamp) {
      latestTimestamp = timestamp
      latestValue = date
    }
  }

  return latestValue
}
