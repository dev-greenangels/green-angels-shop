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

/**
 * Cart/catalog often store display `DD.MM.YYYY`; dispatch calendar API needs `YYYY-MM-DD`.
 */
export function toDispatchIsoDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed.slice(0, 10))) {
    return trimmed.slice(0, 10)
  }
  const parts = trimmed.split('.')
  if (parts.length !== 3) return null
  const [day, month, year] = parts.map((part) => Number.parseInt(part, 10))
  if (!day || !month || !year) return null
  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const date = new Date(`${iso}T12:00:00.000Z`)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return iso
}

/** ISO dates for dispatch calendar earliest constraint (API takes the max). */
export function collectDispatchAvailableFromDates(items: CartItem[]): string[] {
  const out: string[] = []
  for (const item of items) {
    const iso = toDispatchIsoDate(getCartItemShipmentDate(item))
    if (iso) out.push(iso)
  }
  return out
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

export function getLatestShipmentDate(items: CartItem[]): string | null {
  let latestValue: string | null = null
  let latestIso = ''

  for (const item of items) {
    const display = getCartItemShipmentDate(item)
    if (!display) continue
    const iso = toDispatchIsoDate(display)
    if (!iso) continue
    if (!latestIso || iso >= latestIso) {
      latestIso = iso
      latestValue = display
    }
  }

  return latestValue
}
