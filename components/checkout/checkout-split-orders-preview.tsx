'use client'

import { useTranslations } from 'next-intl'
import { PenSquare } from 'lucide-react'
import type { ReactNode } from 'react'

import { CartOrderTotalsBreakdown } from '@/components/cart/cart-order-totals-breakdown'
import { ShipmentDateBadge } from '@/components/product/shipment-date-badge'
import { cn } from '@/lib/utils'
import { useFormatPrice } from '@/lib/commerce/use-format-price'
import type { CartItem } from '@/lib/types'
import type { PricingQuote } from '@/lib/pricing/quote'
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
  const formatMoney = useFormatPrice()
  const quoteByVariant = new Map(
    quote?.lines.map((line) => [line.productVariantId, line]) ?? [],
  )

  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item) => {
        const quoteLine = item.variantId ? quoteByVariant.get(item.variantId) : undefined
        const lineTotal =
          quoteLine?.lineTotal ??
          (item.unitPrice ?? item.plant.price) * item.quantity
        const key = item.variantId ? `${item.plant.id}:${item.variantId}` : item.plant.id

        const { plantName, variantSize } = getCartLineDisplay(item)

        return (
          <li
            key={key}
            className="flex items-start justify-between gap-3 rounded-md bg-muted/45 px-2.5 py-2"
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
              <span className="mt-1 inline-flex items-center rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
                × {item.quantity} {tc('pieceShort')}
              </span>
            </div>
            <span
              suppressHydrationWarning
              className="shrink-0 pt-0.5 tabular-nums text-sm font-medium text-foreground"
            >
              {formatMoney(lineTotal)}
            </span>
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
    <div className="rounded-xl bg-muted/35 p-4">
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
        <div className="mt-4 rounded-lg bg-background/70 p-3">
          <CartOrderTotalsBreakdown
            checkout={quote?.checkout}
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
