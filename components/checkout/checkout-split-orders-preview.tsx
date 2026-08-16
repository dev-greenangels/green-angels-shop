'use client'

import { useTranslations } from 'next-intl'
import { PenSquare } from 'lucide-react'
import type { ReactNode } from 'react'

import { CartOrderTotalsBreakdown } from '@/components/cart/cart-order-totals-breakdown'
import { ShipmentDateBadge } from '@/components/product/shipment-date-badge'
import { cn } from '@/lib/utils'
import { useFormatPrice } from '@/lib/commerce/use-format-price'
import { findVariantOnPlant } from '@/lib/cart-limits'
import { resolveCartLinePricing } from '@/lib/cart-line-pricing'
import type { CartItem } from '@/lib/types'
import type { PricingQuote, PricingQuoteLine } from '@/lib/pricing/quote'
import { isReverseChargeCheckout, toReverseChargeLineAmount } from '@/lib/pricing/checkout-tax-display'
import { Button } from '@/components/ui/button'

type CheckoutSplitOrdersPreviewProps = {
  immediateItems: CartItem[]
  datedItems: CartItem[]
  immediateQuote?: PricingQuote | null
  datedQuote?: PricingQuote | null
  quoteLoading?: boolean
  latestDate: string
  className?: string
  onEditOrder?: (part: 'immediate' | 'dated' | 'together') => void
  immediateDeliverySection?: ReactNode
  datedDeliverySection?: ReactNode
}

function getCartLineDisplay(item: CartItem): { plantName: string; variantSize: string | null } {
  const plantName = item.plant.name
  const variantLabel = item.variantLabel?.trim()
  if (!variantLabel || variantLabel === plantName) {
    return { plantName, variantSize: null }
  }
  return { plantName, variantSize: variantLabel }
}

function resolveCheckoutLineTotal(
  item: CartItem,
  quoteLine?: PricingQuoteLine | null,
): number {
  const variant = item.variantId ? findVariantOnPlant(item.plant, item.variantId) : null
  if (variant) {
    const pricing = resolveCartLinePricing(item, variant, quoteLine ?? null)
    if (pricing.saleLineTotal > 0) return pricing.saleLineTotal
  }
  const cartFallback = (item.unitPrice ?? item.plant.price) * item.quantity
  if (cartFallback > 0) return cartFallback
  if (quoteLine && typeof quoteLine.lineTotal === 'number') return quoteLine.lineTotal
  return 0
}

function sumItemPieces(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

function OrderItemsList({
  items,
  quote,
}: {
  items: CartItem[]
  quote?: PricingQuote | null
}) {
  const tc = useTranslations('common')
  const formatShelf = useFormatPrice('shelf')
  const formatRaw = useFormatPrice('raw')
  const reverseCharge = isReverseChargeCheckout(quote?.checkout, quote)
  const quoteByVariant = new Map(
    quote?.lines.map((line) => [line.productVariantId, line]) ?? [],
  )

  const formatLineAmount = (grossLineTotal: number) => {
    const amount = toReverseChargeLineAmount(grossLineTotal, {
      reverseCharge,
      taxIncluded: quote?.checkout?.taxIncluded !== false,
      stripVatRatePercent: quote?.checkout?.stripVatRatePercent,
    })
    return reverseCharge ? formatRaw(amount) : formatShelf(grossLineTotal)
  }

  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item) => {
        const quoteLine = item.variantId ? quoteByVariant.get(item.variantId) : undefined
        const lineTotal = resolveCheckoutLineTotal(item, quoteLine)
        const key = item.variantId ? `${item.plant.id}:${item.variantId}` : item.plant.id

        const { plantName, variantSize } = getCartLineDisplay(item)

        return (
          <li
            key={key}
            className="flex items-start justify-between gap-3 rounded-md bg-muted px-2.5 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-snug text-foreground">
                {plantName}
              </p>
              {variantSize ? (
                <p className="mt-0.5 truncate text-xs font-medium leading-snug text-primary/90">
                  {variantSize}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p
                suppressHydrationWarning
                className="tabular-nums text-sm font-medium text-foreground"
              >
                {formatLineAmount(lineTotal)}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                × {item.quantity} {tc('pieceShort')}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function SplitOrderPanel({
  title,
  shipmentDate,
  items,
  quote,
  quoteLoading,
  showTotals = true,
  showEditOrderButton = false,
  onEditOrder,
  deliverySection,
}: {
  title: string
  shipmentDate?: string | null
  items: CartItem[]
  quote?: PricingQuote | null
  quoteLoading?: boolean
  showTotals?: boolean
  showEditOrderButton?: boolean
  onEditOrder?: () => void
  deliverySection?: ReactNode
}) {
  const t = useTranslations('checkout.shipmentSplit.splitPreview')
  const tCart = useTranslations('cart')

  return (
    <div className="rounded-xl bg-muted p-4">
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <p className="text-base font-bold leading-snug text-foreground">{title}</p>
          {shipmentDate ? <ShipmentDateBadge date={shipmentDate} className="shrink-0" /> : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('itemsCount', { lines: items.length, pieces: sumItemPieces(items) })}
        </p>
      </div>

      <OrderItemsList items={items} quote={quote} />

      {deliverySection ? <div className="mt-4 space-y-4">{deliverySection}</div> : null}

      {showTotals ? (
        <div className="mt-4 rounded-lg bg-background p-3">
          <CartOrderTotalsBreakdown
            checkout={quote?.checkout}
            taxRegime={quote?.taxRegime}
            productsSubtotal={quote?.totalAmount}
            discountAmount={Math.max(
              0,
              (quote?.subtotalBeforeDiscount ?? quote?.totalAmount ?? 0) -
                (quote?.totalAmount ?? 0),
            )}
            grandTotal={quote?.checkout?.grandTotal ?? quote?.totalAmount}
            quoteLoading={quoteLoading}
            itemCount={items.length}
            divided
          />
        </div>
      ) : null}

      {showTotals && quote?.checkout && !quote.checkout.canPlaceOrder && quote.checkout.belowMinOrderMessage ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {t('cannotPlace', { message: quote.checkout.belowMinOrderMessage })}
        </p>
      ) : null}
      {showEditOrderButton ? (
        <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={onEditOrder}>
          <PenSquare className="mr-2 h-4 w-4" />
          {tCart('editOrder')}
        </Button>
      ) : null}
    </div>
  )
}

export function CheckoutTogetherOrderPreview({
  items,
  quote,
  quoteLoading = false,
  latestDate,
  className,
  onEditOrder,
}: {
  items: CartItem[]
  quote?: PricingQuote | null
  quoteLoading?: boolean
  latestDate: string
  className?: string
  onEditOrder?: (part: 'immediate' | 'dated' | 'together') => void
}) {
  const t = useTranslations('checkout.shipmentSplit.splitPreview')

  return (
    <div className={cn('mt-4', className)}>
      <SplitOrderPanel
        title={t('togetherOrderTitle')}
        shipmentDate={latestDate}
        items={items}
        quote={quote}
        quoteLoading={quoteLoading}
        showTotals={false}
        showEditOrderButton
        onEditOrder={() => onEditOrder?.('together')}
      />
    </div>
  )
}

export function CheckoutSplitOrdersPreview({
  immediateItems,
  datedItems,
  immediateQuote,
  datedQuote,
  quoteLoading = false,
  latestDate,
  className,
  onEditOrder,
  immediateDeliverySection,
  datedDeliverySection,
}: CheckoutSplitOrdersPreviewProps) {
  const t = useTranslations('checkout.shipmentSplit.splitPreview')

  return (
    <div className={cn('mt-4 space-y-3', className)}>
      <SplitOrderPanel
        title={t('orderOneTitle')}
        items={immediateItems}
        quote={immediateQuote}
        quoteLoading={quoteLoading}
        showTotals
        showEditOrderButton
        onEditOrder={() => onEditOrder?.('immediate')}
        deliverySection={immediateDeliverySection}
      />
      <SplitOrderPanel
        title={t('orderTwoTitle')}
        shipmentDate={latestDate}
        items={datedItems}
        quote={datedQuote}
        quoteLoading={quoteLoading}
        showTotals
        showEditOrderButton
        onEditOrder={() => onEditOrder?.('dated')}
        deliverySection={datedDeliverySection}
      />
    </div>
  )
}
