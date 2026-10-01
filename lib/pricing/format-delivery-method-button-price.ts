import type { DeliveryMethodPriceSnapshot } from '@/lib/pricing/use-delivery-method-prices'
import {
  isReverseChargeCheckout,
  resolveCheckoutTaxRatePercent,
  shouldGrossUpCheckoutPrices,
} from '@/lib/pricing/checkout-tax-display'
import { roundMoney } from '@/lib/pricing/vat-price'
import type { VatDisplayPolicy } from '@/lib/pricing/vat-price'

/**
 * Price on delivery-method buttons — same combined amount as order summary
 * «Доставка та пакування» (delivery + packaging when delivery is included).
 */
export function formatDeliveryMethodButtonPrice(
  snapshot: DeliveryMethodPriceSnapshot | null | undefined,
  opts: {
    formatShelf: (amount: number) => string
    formatRaw: (amount: number) => string
    vat: Pick<VatDisplayPolicy, 'priceBasis' | 'storefrontPrimaryPrice' | 'taxRatePercent'>
  },
): string | null {
  if (!snapshot) return null
  if (
    !snapshot.deliveryIncludedInTotal ||
    snapshot.deliveryUnavailableReason === 'missing_weight' ||
    snapshot.deliveryUnavailableReason === 'no_tariff'
  ) {
    return null
  }

  const amount = roundMoney(
    Math.max(0, snapshot.deliveryAmount) + Math.max(0, snapshot.packagingAmount ?? 0),
  )
  const reverseCharge = isReverseChargeCheckout(
    {
      taxRegime: snapshot.taxRegime,
      taxRatePercent: snapshot.taxRatePercent,
    },
    { taxRegime: snapshot.taxRegime },
  )
  const taxRate = resolveCheckoutTaxRatePercent(
    { taxRatePercent: snapshot.taxRatePercent },
    null,
    opts.vat.taxRatePercent,
  )
  const needsGrossDisplay = shouldGrossUpCheckoutPrices({
    priceBasis: opts.vat.priceBasis,
    storefrontPrimaryPrice: opts.vat.storefrontPrimaryPrice,
    taxRatePercent: taxRate,
    reverseCharge,
  })
  const feesAreExVat = needsGrossDisplay && snapshot.taxAppliesToFees !== false
  return feesAreExVat ? opts.formatShelf(amount) : opts.formatRaw(amount)
}
