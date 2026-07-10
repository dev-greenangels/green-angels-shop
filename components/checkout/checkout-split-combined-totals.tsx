'use client'

import { useTranslations } from 'next-intl'

import { useFormatPrice } from '@/lib/commerce/use-format-price'
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
  const formatMoney = useFormatPrice()

  const combinedProducts =
    (immediateQuote?.checkout?.productsSubtotal ?? immediateQuote?.totalAmount ?? 0) +
    (datedQuote?.checkout?.productsSubtotal ?? datedQuote?.totalAmount ?? 0)
  const combinedPackaging =
    (immediateQuote?.checkout?.packagingAmount ?? 0) +
    (datedQuote?.checkout?.packagingAmount ?? 0)
  const combinedGrand =
    (immediateQuote?.checkout?.grandTotal ?? immediateQuote?.totalAmount ?? 0) +
    (datedQuote?.checkout?.grandTotal ?? datedQuote?.totalAmount ?? 0)

  return (
    <div className="space-y-2 rounded-lg bg-muted/30 p-3 text-sm">
      <p className="text-xs text-muted-foreground">{t('splitTotalsDetail')}</p>
      <div className="flex items-baseline justify-between gap-3 text-foreground">
        <span>{t('splitCombinedProducts')}</span>
        <span suppressHydrationWarning className="tabular-nums">
          {quoteLoading ? '...' : formatMoney(combinedProducts)}
        </span>
      </div>
      {!quoteLoading && combinedPackaging > 0.009 ? (
        <div className="flex items-baseline justify-between gap-3 text-foreground">
          <span>{t('splitCombinedPackaging')}</span>
          <span suppressHydrationWarning className="tabular-nums">
            {formatMoney(combinedPackaging)}
          </span>
        </div>
      ) : null}
      <div className="flex items-baseline justify-between gap-3 font-semibold text-foreground">
        <span>{t('splitCombinedPayable')}</span>
        <span suppressHydrationWarning className="tabular-nums text-primary">
          {quoteLoading ? '...' : formatMoney(combinedGrand)}
        </span>
      </div>
    </div>
  )
}
