'use client'

import { useTranslations } from 'next-intl'

import { useMinOrderCheckoutMessage } from '@/components/cart/min-order-info-banner'
import { useVatDisplayPolicy } from '@/components/providers/vat-display-provider'
import type { CheckoutTotalsBreakdown } from '@/lib/pricing/quote'
import {
  isReverseChargeCheckout,
  resolveCheckoutTaxRatePercent,
  shouldGrossUpCheckoutPrices,
} from '@/lib/pricing/checkout-tax-display'
import { netToGross, roundMoney } from '@/lib/pricing/vat-price'
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
  /** Top-level quote taxRegime when checkout omits it */
  taxRegime?: string | null
}

/**
 * Shelf totals: gross each line (products / delivery / packaging), then sum.
 * Reverse charge / 0% VAT: show net amounts, no gross-up.
 * Inc-VAT catalog: line amounts + grandTotal are already gross; “без ПДВ” = payable − VAT.
 */
function resolvePayableTotal(input: {
  checkout?: CheckoutTotalsBreakdown | null
  productsNet: number
  needsGrossDisplay: boolean
  taxRate: number
  fallbackGrandTotal?: number
}): { payable: number; vatAmount: number; amountExVat: number } {
  const { checkout, productsNet, needsGrossDisplay, taxRate, fallbackGrandTotal } = input
  const deliveryNet =
    checkout?.deliveryIncludedInTotal !== false ? (checkout?.deliveryAmount ?? 0) : 0
  const packagingNet = checkout?.packagingAmount ?? 0
  const codNet = checkout?.codFeeAmount ?? 0
  const feesInVatBase = needsGrossDisplay && checkout?.taxAppliesToFees !== false
  const linesSum = productsNet + deliveryNet + packagingNet
  const apiTotal = checkout?.grandTotal ?? fallbackGrandTotal ?? productsNet

  // Ex-VAT catalog → gross-up for shelf display.
  if (needsGrossDisplay && taxRate > 0) {
    if (feesInVatBase) {
      const productsGross = netToGross(productsNet, taxRate)
      const deliveryGross = deliveryNet > 0 ? netToGross(deliveryNet, taxRate) : 0
      const packagingGross = packagingNet > 0 ? netToGross(packagingNet, taxRate) : 0
      const payable = roundMoney(productsGross + deliveryGross + packagingGross + codNet)
      const vatAmount = roundMoney(payable - linesSum - codNet)
      return { payable, vatAmount, amountExVat: roundMoney(linesSum + codNet) }
    }

    const productsGross = netToGross(productsNet, taxRate)
    const payable = roundMoney(productsGross + deliveryNet + packagingNet + codNet)
    const vatAmount = roundMoney(productsGross - productsNet)
    return { payable, vatAmount, amountExVat: roundMoney(productsNet + deliveryNet + packagingNet + codNet) }
  }

  // Inc-VAT (or no VAT): API totals are already payable; extract net from taxAmount.
  const vatAmount = checkout?.taxAmount ?? 0
  const amountExVat =
    vatAmount > 0 ? roundMoney(apiTotal - vatAmount) : roundMoney(apiTotal)
  return { payable: apiTotal, vatAmount, amountExVat }
}

export function CartOrderTotalsBreakdown({
  checkout,
  productsSubtotal,
  discountAmount,
  grandTotal,
  quoteLoading = false,
  itemCount,
  divided = false,
  taxRegime,
}: CartOrderTotalsBreakdownProps) {
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const tCheckout = useTranslations('checkout')
  const vat = useVatDisplayPolicy()
  const formatShelf = useFormatPrice('shelf')
  const formatRaw = useFormatPrice('raw')

  const reverseCharge = isReverseChargeCheckout(checkout, { taxRegime: taxRegime ?? null })
  const taxRate = resolveCheckoutTaxRatePercent(checkout, null, vat.taxRatePercent)
  const needsGrossDisplay = shouldGrossUpCheckoutPrices({
    priceBasis: vat.priceBasis,
    storefrontPrimaryPrice: vat.storefrontPrimaryPrice,
    taxRatePercent: taxRate,
    reverseCharge,
  })
  const feesAreExVat = needsGrossDisplay && checkout?.taxAppliesToFees !== false
  const formatMoney = needsGrossDisplay ? formatShelf : formatRaw
  const formatFee = feesAreExVat ? formatShelf : formatRaw
  const minOrderMessage = useMinOrderCheckoutMessage({
    belowMinOrder: checkout?.belowMinOrder,
    canPlaceOrder: checkout?.canPlaceOrder,
    minOrderAmount: checkout?.minOrderAmount,
    belowMinOrderBehavior: checkout?.belowMinOrderBehavior,
    belowMinPackagingFee: checkout?.belowMinPackagingFee,
  })

  const formatShippingAndPackagingLabel = (checkoutTotals: CheckoutTotalsBreakdown) => {
    const deliveryNet =
      checkoutTotals.deliveryIncludedInTotal !== false ? checkoutTotals.deliveryAmount : 0
    const packagingNet = checkoutTotals.packagingAmount ?? 0
    const combined = roundMoney(deliveryNet + packagingNet)
    if (combined > 0) {
      return formatFee(combined)
    }
    if (checkoutTotals.showDelivery) {
      if (checkoutTotals.deliveryMode === 'free') return tc('free')
      return t('totals.deliveryCarrierRates')
    }
    return null
  }

  const productsNet = checkout?.productsSubtotal ?? productsSubtotal ?? 0
  const discount = checkout?.discountAmount ?? discountAmount ?? 0

  const { payable, vatAmount, amountExVat } = resolvePayableTotal({
    checkout,
    productsNet,
    needsGrossDisplay,
    taxRate,
    fallbackGrandTotal: grandTotal,
  })

  const shippingCombined =
    checkout != null ? formatShippingAndPackagingLabel(checkout) : null
  const showShippingRow =
    Boolean(checkout) &&
    (Boolean(checkout?.showDelivery) || (checkout?.packagingAmount ?? 0) > 0)

  const rowClassName = divided ? 'flex justify-between gap-3 py-2.5' : 'flex justify-between'
  const refRowClassName = divided
    ? 'flex justify-between gap-3 rounded-md bg-muted/70 px-2 py-1.5 text-xs text-muted-foreground'
    : 'flex justify-between rounded-md bg-muted/70 px-2 py-1.5 text-xs text-muted-foreground'

  return (
    <div className={divided ? 'divide-y divide-border/50 text-sm' : 'space-y-2 text-sm'}>
      <div className={rowClassName}>
        <span className="text-muted-foreground">
          {t('totals.products')}
          {itemCount != null ? ` (${itemCount})` : ''}
        </span>
        <span suppressHydrationWarning className="tabular-nums">
          {quoteLoading ? '...' : formatMoney(productsNet)}
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

      {showShippingRow && shippingCombined != null ? (
        <div className={cn(rowClassName, 'gap-2')}>
          <span className="text-muted-foreground">{t('totals.shippingAndPackaging')}</span>
          <span suppressHydrationWarning className="text-right tabular-nums">
            {shippingCombined}
          </span>
        </div>
      ) : null}

      {(checkout?.codFeeAmount ?? 0) > 0 ? (
        <div className={rowClassName}>
          <span className="text-muted-foreground">{t('totals.codFee')}</span>
          <span suppressHydrationWarning className="tabular-nums">
            {formatRaw(checkout!.codFeeAmount!)}
          </span>
        </div>
      ) : null}

      {minOrderMessage ? (
        <p
          className={cn(
            'rounded-md border border-amber-200/80 bg-amber-50 px-2 py-1.5 text-xs text-amber-950',
            checkout?.canPlaceOrder === false && 'border-destructive/40 bg-destructive/5 text-destructive',
            divided && 'my-1',
          )}
        >
          {minOrderMessage}
        </p>
      ) : null}

      <div className={cn(rowClassName, 'text-lg font-bold')}>
        <span>
          {checkout?.showDelivery && !checkout.deliveryIncludedInTotal
            ? t('totals.withoutDelivery')
            : tc('total')}
        </span>
        <span suppressHydrationWarning className="min-w-[fit-content] tabular-nums text-primary">
          {quoteLoading ? '...' : formatRaw(payable)}
        </span>
      </div>

      {reverseCharge ? (
        <p
          className={cn(
            'rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary',
            divided ? 'my-1' : 'mt-1',
          )}
        >
          {tCheckout('vatZeroDphApplied')}
        </p>
      ) : checkout?.showTax !== false && taxRate > 0 ? (
        <div className={cn('space-y-1', divided ? 'py-2' : 'mt-1')}>
          <div className={refRowClassName}>
            <span>
              {t('totals.vatOfWhich', {
                rate: Number.isFinite(taxRate) ? String(Math.round(taxRate)) : '0',
              })}
            </span>
            <span suppressHydrationWarning className="tabular-nums font-medium text-foreground/80">
              {formatRaw(vatAmount)}
            </span>
          </div>
          <div className={refRowClassName}>
            <span>{t('totals.paidWithoutVat')}</span>
            <span suppressHydrationWarning className="tabular-nums font-medium text-foreground/80">
              {formatRaw(Math.max(0, amountExVat))}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
