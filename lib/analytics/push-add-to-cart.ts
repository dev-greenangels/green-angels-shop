/**
 * GA4 ecommerce `add_to_cart` → dataLayer (GTM).
 * Consent Mode is handled by existing GTM bootstrap — do not gate here.
 */

type DataLayerWindow = Window & {
  dataLayer?: unknown[]
}

export type AddToCartTrackingInput = {
  currency: string
  /** Unit price actually used for this cart addition. */
  unitPrice: number
  /** Units actually added (`result.added`). */
  quantity: number
  itemId: string
  itemName: string
  itemVariant: string
}

export type AddToCartDataLayerItem = {
  item_id: string
  item_name: string
  item_variant: string
  price: number
  quantity: number
}

export type AddToCartDataLayerPayload = {
  event: 'add_to_cart'
  ecommerce: {
    currency: string
    value: number
    items: AddToCartDataLayerItem[]
  }
}

/** Round money for GA4 value/price without inventing a different commerce price. */
export function roundMoneyForAnalytics(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100) / 100
}

export function buildAddToCartPayload(
  input: AddToCartTrackingInput,
): AddToCartDataLayerPayload | null {
  const quantity = Math.floor(input.quantity)
  if (quantity <= 0) return null

  const currency = input.currency.trim().toUpperCase()
  if (!currency) return null

  const itemId = input.itemId.trim()
  if (!itemId) return null

  const price = roundMoneyForAnalytics(input.unitPrice)
  const value = roundMoneyForAnalytics(input.unitPrice * quantity)

  return {
    event: 'add_to_cart',
    ecommerce: {
      currency,
      value,
      items: [
        {
          item_id: itemId,
          item_name: input.itemName.trim() || itemId,
          item_variant: input.itemVariant.trim(),
          price,
          quantity,
        },
      ],
    },
  }
}

/**
 * Client-only: push GA4 `add_to_cart` after a successful cart add (`result.added > 0`).
 * Clears previous `ecommerce` on dataLayer first (GTM / GA4 recommendation).
 * Returns true when a push was performed.
 */
export function pushAddToCartEvent(input: AddToCartTrackingInput): boolean {
  if (typeof window === 'undefined') return false

  const payload = buildAddToCartPayload(input)
  if (!payload) return false

  const w = window as DataLayerWindow
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ ecommerce: null })
  w.dataLayer.push(payload)
  return true
}
