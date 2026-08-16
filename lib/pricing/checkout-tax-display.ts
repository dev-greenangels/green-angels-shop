import type { CheckoutTotalsBreakdown, PricingQuote } from '@/lib/pricing/quote'
import { grossToNet } from '@/lib/pricing/vat-price'

export type CheckoutTaxRegime = 'seller' | 'destination' | 'reverse_charge'

/** EU B2B reverse charge: company + valid VIES + non-SK VAT country. */
export function isReverseChargeCheckout(
  checkout?: CheckoutTotalsBreakdown | null,
  quote?: Pick<PricingQuote, 'taxRegime'> | null,
): boolean {
  const regime = checkout?.taxRegime ?? quote?.taxRegime
  return regime === 'reverse_charge'
}

/**
 * Effective checkout VAT % for display.
 * Uses quote/checkout rate including explicit 0 (reverse charge) — never falls back
 * to B2C shelf rate when the API already resolved tax.
 */
export function resolveCheckoutTaxRatePercent(
  checkout: CheckoutTotalsBreakdown | null | undefined,
  quote: Pick<PricingQuote, 'taxRatePercent'> | null | undefined,
  fallbackShelfRate: number,
): number {
  if (typeof checkout?.taxRatePercent === 'number') {
    return Math.max(0, checkout.taxRatePercent)
  }
  if (typeof quote?.taxRatePercent === 'number') {
    return Math.max(0, quote.taxRatePercent)
  }
  return Math.max(0, fallbackShelfRate)
}

/** Shelf gross-up only for B2C/B2B-with-VAT when catalog is ex_vat. */
export function shouldGrossUpCheckoutPrices(input: {
  priceBasis: 'ex_vat' | 'inc_vat'
  storefrontPrimaryPrice: 'inc_vat' | 'ex_vat'
  taxRatePercent: number
  reverseCharge: boolean
}): boolean {
  if (input.reverseCharge || input.taxRatePercent <= 0) return false
  return input.priceBasis === 'ex_vat' && input.storefrontPrimaryPrice === 'inc_vat'
}

/**
 * Reverse charge + tax-inclusive catalog: strip embedded seller VAT so line
 * prices match net productsSubtotal / grandTotal.
 */
export function toReverseChargeLineAmount(
  grossOrNetAmount: number,
  opts: {
    reverseCharge: boolean
    taxIncluded: boolean
    stripVatRatePercent?: number | null
  },
): number {
  if (!opts.reverseCharge || !opts.taxIncluded) return grossOrNetAmount
  const rate = opts.stripVatRatePercent ?? 0
  if (rate <= 0 || !Number.isFinite(grossOrNetAmount)) return grossOrNetAmount
  return grossToNet(grossOrNetAmount, rate)
}
