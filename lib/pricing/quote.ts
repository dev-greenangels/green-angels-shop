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
  packagingBoxCount?: number
  packagingPalletCount?: number
  taxAmount: number
  codFeeAmount?: number
  grandTotal: number
  minOrderAmount: number | null
  belowMinOrder: boolean
  canPlaceOrder: boolean
  belowMinOrderMessage: string | null
  showDelivery: boolean
  showPackaging: boolean
  showTax: boolean
  taxIncluded: boolean
  /** Effective VAT % used for this quote (when returned by API); 0 = reverse charge / no VAT */
  taxRatePercent?: number
  /** seller | destination | reverse_charge */
  taxRegime?: string | null
  taxCountryCode?: string | null
  /** Reverse charge + tax-inclusive: seller VAT % stripped from gross lines */
  stripVatRatePercent?: number | null
  /** When true, delivery/packaging amounts are ex-VAT; VAT is in taxAmount/grandTotal */
  taxAppliesToFees?: boolean
  allowedDeliveryMethods?: string[]
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
  /** Echo of resolveCheckoutTax for clients that do not dig into checkout */
  taxRegime?: string | null
  taxCountryCode?: string | null
  taxRatePercent?: number
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
  promoCode?: string
  promoCodes?: string[]
  deliveryMethod?: string
  paymentMethod?: string
  splitOrderParts?: number
  splitOrderPartIndex?: number
  countryCode?: 'sk' | 'hu' | 'at'
  deliveryCountryCode?: string
  buyerType?: 'individual' | 'company'
  vatCountryCode?: string
  viesValid?: boolean
}): Promise<PricingQuote> {
  const res = await fetch('/api/pricing/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Не вдалося розрахувати суму.')
  }
  return data as PricingQuote
}
