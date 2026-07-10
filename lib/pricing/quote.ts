export type PricingQuoteLine = {
  productVariantId: string
  quantity: number
  baseUnitPrice: number
  unitPrice: number
  lineTotal: number
  appliedSource: string
  appliedLabel: string | null
}

export type DeliveryMode = 'free' | 'carrier_rates' | 'fixed'

export type CheckoutTotalsBreakdown = {
  productsSubtotal: number
  discountAmount: number
  deliveryAmount: number
  deliveryMode: DeliveryMode
  deliveryIncludedInTotal: boolean
  packagingAmount: number
  taxAmount: number
  grandTotal: number
  minOrderAmount: number | null
  belowMinOrder: boolean
  canPlaceOrder: boolean
  belowMinOrderMessage: string | null
  showDelivery: boolean
  showPackaging: boolean
  showTax: boolean
  taxIncluded: boolean
}

export type PricingQuote = {
  lines: PricingQuoteLine[]
  giftLines: PricingGiftLine[]
  subtotalBeforeDiscount: number
  totalAmount: number
  promoCodeId: string | null
  promoCode: string | null
  promoCodeIds?: string[]
  promoCodes?: string[]
  appliedPromos?: AppliedPromoSummary[]
  promoMessage: string | null
  promoMessages?: string[] | null
  promoInfoMessages?: string[] | null
  promoSkipped?: PromoSkippedSummary[]
  checkout?: CheckoutTotalsBreakdown
}

export type PricingGiftLine = {
  productVariantId: string
  productSlug: string
  quantity: number
  label: string
}

export type AppliedPromoSummary = {
  code: string
  name: string
  appliedDiscountAmount?: number | null
  unusedDiscountAmount?: number | null
  infoMessage?: string | null
}

export type PromoSkipReason = 'no_additional_discount'

export type PromoSkippedSummary = {
  code: string
  reason: PromoSkipReason
}

export function quoteLinesByVariantId(quote?: PricingQuote | null) {
  const map = new Map<string, PricingQuoteLine>()
  quote?.lines.forEach((line) => {
    map.set(line.productVariantId, line)
  })
  return map
}

export async function fetchPricingQuote(input: {
  items: Array<{ productVariantId: string; quantity: number }>
  customerPhone?: string
  userId?: string
  promoCode?: string
  promoCodes?: string[]
  deliveryMethod?: string
  splitOrderParts?: number
  splitOrderPartIndex?: number
}): Promise<PricingQuote> {
  const res = await fetch('/api/pricing/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Не вдалося розрахувати суму.')
  }
  return data as PricingQuote
}
