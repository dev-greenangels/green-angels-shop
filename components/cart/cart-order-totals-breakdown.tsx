'use client'

import { useTranslations } from 'next-intl'

import type { CheckoutTotalsBreakdown } from '@/lib/pricing/quote'
import { useFormatPrice } from '@/lib/commerce/use-format-price'
import { cn } from '@/lib/utils'

type CartOrderTotalsBreakdownProps = {
  checkout?: CheckoutTotalsBreakdown | null
  productsSubtotal?: number
  discountAmount?: number
  grandTotal?: number
  quoteLoading?: boolean
  itemCount?: number
  divided?: boolean
}

export function CartOrderTotalsBreakdown({
  checkout,
  productsSubtotal,
  discountAmount,
  grandTotal,
  quoteLoading = false,
  itemCount,
  divided = false,
}: CartOrderTotalsBreakdownProps) {
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const formatMoney = useFormatPrice()

  const formatDeliveryLabel = (checkoutTotals: CheckoutTotalsBreakdown) => {
    if (checkoutTotals.deliveryMode === 'carrier_rates') {
      return t('totals.deliveryCarrierRates')
    }
    if (checkoutTotals.deliveryMode === 'fixed' && checkoutTotals.deliveryAmount > 0) {
      return formatMoney(checkoutTotals.deliveryAmount)
    }
    return tc('free')
  }

  const products = checkout?.productsSubtotal ?? productsSubtotal ?? 0
  const discount = checkout?.discountAmount ?? discountAmount ?? 0
  const total = checkout?.grandTotal ?? grandTotal ?? products
  const rowClassName = divided ? 'flex justify-between gap-3 py-2.5' : 'flex justify-between'

  return (
    <div className={divided ? 'divide-y divide-border/50 text-sm' : 'space-y-2 text-sm'}>
      <div className={rowClassName}>
        <span className="text-muted-foreground">
          {t('totals.products')}
          {itemCount != null ? ` (${itemCount})` : ''}
        </span>
        <span suppressHydrationWarning className="tabular-nums">
          {quoteLoading ? '...' : formatMoney(products)}
        </span>
      </div>

      {discount > 0 ? (
        <div className={cn(rowClassName, 'text-primary')}>
          <span>{tc('discount')}</span>
          <span suppressHydrationWarning className="tabular-nums">
            −{formatMoney(discount)}
          </span>
        </div>
      ) : null}

      {checkout && checkout.packagingAmount > 0 ? (
        <div className={rowClassName}>
          <span className="text-muted-foreground">{t('totals.packaging')}</span>
          <span suppressHydrationWarning className="tabular-nums">
            {formatMoney(checkout.packagingAmount)}
          </span>
        </div>
      ) : null}

      {checkout?.showDelivery ? (
        <div className={cn(rowClassName, 'gap-2')}>
          <span className="text-muted-foreground">{t('totals.delivery')}</span>
          <span suppressHydrationWarning className="text-right tabular-nums">
            {formatDeliveryLabel(checkout)}
          </span>
        </div>
      ) : null}

      {checkout?.showTax && checkout.taxAmount > 0 ? (
        <div className={rowClassName}>
          <span className="text-muted-foreground">
            {t('totals.vat', {
              included: checkout.taxIncluded ? t('totals.vatIncluded') : '',
            })}
          </span>
          <span suppressHydrationWarning className="tabular-nums">
            {formatMoney(checkout.taxAmount)}
          </span>
        </div>
      ) : null}

      {checkout?.belowMinOrder && checkout.belowMinOrderMessage ? (
        <p className={cn('text-xs text-destructive', divided && 'py-2.5')}>
          {checkout.belowMinOrderMessage}
        </p>
      ) : null}

      <div className={cn(rowClassName, 'text-base font-semibold')}>
        <span>
          {checkout?.showDelivery && !checkout.deliveryIncludedInTotal
            ? t('totals.withoutDelivery')
            : tc('total')}
        </span>
        <span suppressHydrationWarning className="tabular-nums text-primary min-w-[fit-content]">
          {quoteLoading ? '...' : formatMoney(total)}
        </span>
      </div>
    </div>
  )
}
