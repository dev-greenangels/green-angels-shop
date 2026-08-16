'use client'

import { useTranslations } from 'next-intl'

import { useFormatPrice } from '@/lib/commerce/use-format-price'
import { isReverseChargeCheckout } from '@/lib/pricing/checkout-tax-display'
import type { PricingQuote } from '@/lib/pricing/quote'

type CheckoutSplitCombinedTotalsProps = {
  immediateQuote?: PricingQuote | null
  datedQuote?: PricingQuote | null
  quoteLoading?: boolean
}

export function CheckoutSplitCombinedTotals({
  immediateQuote,
  datedQuote,
  quoteLoading = false,
}: CheckoutSplitCombinedTotalsProps) {
  const t = useTranslations('checkout.shipmentSplit')
  const tCheckout = useTranslations('checkout')
  const formatShelf = useFormatPrice('shelf')
  const formatRaw = useFormatPrice('raw')
  const reverseCharge =
    isReverseChargeCheckout(immediateQuote?.checkout, immediateQuote) ||
    isReverseChargeCheckout(datedQuote?.checkout, datedQuote)
  const formatProducts = reverseCharge ? formatRaw : formatShelf

  const combinedProducts =
    (immediateQuote?.checkout?.productsSubtotal ?? immediateQuote?.totalAmount ?? 0) +
    (datedQuote?.checkout?.productsSubtotal ?? datedQuote?.totalAmount ?? 0)
  const combinedShipping =
    (immediateQuote?.checkout?.packagingAmount ?? 0) +
    (datedQuote?.checkout?.packagingAmount ?? 0) +
    (immediateQuote?.checkout?.deliveryIncludedInTotal !== false
      ? (immediateQuote?.checkout?.deliveryAmount ?? 0)
      : 0) +
    (datedQuote?.checkout?.deliveryIncludedInTotal !== false
      ? (datedQuote?.checkout?.deliveryAmount ?? 0)
      : 0)
  const combinedGrand =
    (immediateQuote?.checkout?.grandTotal ?? immediateQuote?.totalAmount ?? 0) +
    (datedQuote?.checkout?.grandTotal ?? datedQuote?.totalAmount ?? 0)

  return (
    <div className="space-y-2 rounded-lg bg-muted p-3 text-sm">
      <p className="text-xs text-muted-foreground">{t('splitTotalsDetail')}</p>
      <div className="flex items-baseline justify-between gap-3 text-foreground">
        <span>{t('splitCombinedProducts')}</span>
        <span suppressHydrationWarning className="tabular-nums">
          {quoteLoading ? '...' : formatProducts(combinedProducts)}
        </span>
      </div>
      {!quoteLoading && combinedShipping > 0.009 ? (
        <div className="flex items-baseline justify-between gap-3 text-foreground">
          <span>{t('splitCombinedShipping')}</span>
          <span suppressHydrationWarning className="tabular-nums">
            {formatRaw(combinedShipping)}
          </span>
        </div>
      ) : null}
      <div className="flex items-baseline justify-between gap-3 font-semibold text-foreground">
        <span>{t('splitCombinedPayable')}</span>
        <span suppressHydrationWarning className="tabular-nums text-primary">
          {quoteLoading ? '...' : formatRaw(combinedGrand)}
        </span>
      </div>
      {reverseCharge ? (
        <p className="text-xs font-medium text-primary">{tCheckout('vatZeroDphApplied')}</p>
      ) : null}
    </div>
  )
}
