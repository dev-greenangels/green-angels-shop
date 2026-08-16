import { getUnitPriceForQuantity } from '@/lib/product-pricing'
import type { PricingQuoteLine } from '@/lib/pricing/quote'
import type { CartItem, ProductVariant } from '@/lib/types'

export type CartLinePricing = {
  originalUnitPrice: number
  saleUnitPrice: number
  hasDiscount: boolean
  originalLineTotal: number
  saleLineTotal: number
}

export function resolveCartLinePricing(
  item: CartItem,
  variant: ProductVariant,
  quoteLine?: PricingQuoteLine | null,
): CartLinePricing {
  const quoteUsable =
    quoteLine != null &&
    ((typeof quoteLine.unitPrice === 'number' && quoteLine.unitPrice > 0) ||
      (typeof quoteLine.lineTotal === 'number' && quoteLine.lineTotal > 0))

  if (quoteUsable && quoteLine) {
    const originalUnitPrice =
      quoteLine.baseUnitPrice > 0 ? quoteLine.baseUnitPrice : variant.basePrice
    const saleUnitPrice =
      quoteLine.unitPrice > 0
        ? quoteLine.unitPrice
        : quoteLine.lineTotal > 0
          ? quoteLine.lineTotal / Math.max(1, item.quantity)
          : getUnitPriceForQuantity(variant, item.quantity)
    const hasDiscount = saleUnitPrice < originalUnitPrice - 0.001
    return {
      originalUnitPrice,
      saleUnitPrice,
      hasDiscount,
      originalLineTotal: originalUnitPrice * item.quantity,
      saleLineTotal: saleUnitPrice * item.quantity,
    }
  }

  const originalUnitPrice = variant.basePrice
  const saleUnitPrice = getUnitPriceForQuantity(variant, item.quantity)
  const hasDiscount = saleUnitPrice < originalUnitPrice - 0.001

  return {
    originalUnitPrice,
    saleUnitPrice,
    hasDiscount,
    originalLineTotal: originalUnitPrice * item.quantity,
    saleLineTotal: saleUnitPrice * item.quantity,
  }
}
