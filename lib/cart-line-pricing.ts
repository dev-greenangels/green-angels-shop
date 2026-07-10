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
  if (quoteLine) {
    const originalUnitPrice = quoteLine.baseUnitPrice
    const saleUnitPrice = quoteLine.unitPrice
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
