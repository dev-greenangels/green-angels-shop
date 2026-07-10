import type { CartItem } from '@/lib/types'

const PRODUCT_VARIANT_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isProductVariantUuid(value: string | null | undefined): boolean {
  const trimmed = value?.trim()
  return Boolean(trimmed && PRODUCT_VARIANT_UUID_RE.test(trimmed))
}

export function buildPricingQuoteLineItems(
  items: Array<Pick<CartItem, 'variantId' | 'quantity'>>,
): Array<{ productVariantId: string; quantity: number }> {
  return items
    .filter(
      (item): item is { variantId: string; quantity: number } =>
        Boolean(item.variantId && isProductVariantUuid(item.variantId) && item.quantity > 0),
    )
    .map((item) => ({
      productVariantId: item.variantId,
      quantity: item.quantity,
    }))
}
