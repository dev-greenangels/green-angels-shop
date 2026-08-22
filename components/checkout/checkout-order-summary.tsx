'use client'

import { memo, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, PenSquare } from 'lucide-react'

import { CartOrderTotalsBreakdown } from '@/components/cart/cart-order-totals-breakdown'
import { CartPromoGiftLines } from '@/components/cart/cart-promo-gift-lines'
import { checkoutPanelClassName } from '@/components/checkout/checkout-utils'
import { VariantSizeLabel } from '@/components/product/variant-size-label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { getInStockCartItems } from '@/lib/cart-availability'
import {
  useCartHasCheckoutableItems,
  useCartItems,
} from '@/lib/cart-store'
import { useFormatPrice } from '@/lib/commerce/use-format-price'
import { findVariantOnPlant } from '@/lib/cart-limits'
import { resolveCartLinePricing } from '@/lib/cart-line-pricing'
import type { CartItem } from '@/lib/types'
import type { PricingQuote, PricingQuoteLine } from '@/lib/pricing/quote'
import { isReverseChargeCheckout, toReverseChargeLineAmount } from '@/lib/pricing/checkout-tax-display'

type CheckoutOrderSummaryProps = {
  quote?: PricingQuote | null
  quoteLoading?: boolean
  comment: string
  onCommentChange: (value: string) => void
  isLoading?: boolean
  checkoutDisabled?: boolean
  submitError?: string | null
  checkoutBlockedMessage?: string | null
  shipmentSplitError?: string | null
  formId?: string
  promoSection?: ReactNode
  shipmentSplitSection?: ReactNode
  totalsSection?: ReactNode
  onEditOrder?: () => void
  privacyConsentChecked?: boolean
  privacyConsentError?: boolean
  privacyConsentLabel?: string | null
  onPrivacyConsentChange?: (checked: boolean) => void
  showCreateAccountOption?: boolean
  createAccountChecked?: boolean
  onCreateAccountChange?: (checked: boolean) => void
  /** Optional ETA line under totals (SK carrier estimate) */
  deliveryEstimate?: string | null
  /** SK/EU: button must state obligation to pay (CRD) */
  useObligationToPayLabel?: boolean
}

function getCartLineDisplay(item: CartItem): { plantName: string; variantSize: string | null } {
  const plantName = item.plant.name
  const variantLabel = item.variantLabel?.trim()
  if (!variantLabel || variantLabel === plantName) {
    return { plantName, variantSize: null }
  }
  return { plantName, variantSize: variantLabel }
}

/** Same final price as cart/product card — never treat C2 label as money; ignore quote zeros. */
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

export const CheckoutOrderSummary = memo(function CheckoutOrderSummary({
  quote,
  quoteLoading = false,
  comment,
  onCommentChange,
  isLoading = false,
  checkoutDisabled = false,
  submitError,
  checkoutBlockedMessage,
  shipmentSplitError,
  formId = 'checkout-form',
  promoSection,
  shipmentSplitSection,
  totalsSection,
  onEditOrder,
  privacyConsentChecked = false,
  privacyConsentError = false,
  privacyConsentLabel: _privacyConsentLabel = null,
  onPrivacyConsentChange,
  showCreateAccountOption = false,
  createAccountChecked = false,
  onCreateAccountChange,
  deliveryEstimate = null,
  useObligationToPayLabel = false,
}: CheckoutOrderSummaryProps) {
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const reverseCharge = isReverseChargeCheckout(quote?.checkout, quote)
  const formatMoney = useFormatPrice('raw')
  const formatShelf = useFormatPrice('shelf')
  const items = useCartItems()
  const inStockItems = getInStockCartItems(items)
  const hasCheckoutable = useCartHasCheckoutableItems()
  const quoteByVariant = new Map(
    quote?.lines.map((line) => [line.productVariantId, line]) ?? [],
  )

  const formatLineAmount = (grossLineTotal: number) => {
    const amount = toReverseChargeLineAmount(grossLineTotal, {
      reverseCharge,
      taxIncluded: quote?.checkout?.taxIncluded !== false,
      stripVatRatePercent: quote?.checkout?.stripVatRatePercent,
    })
    return reverseCharge ? formatMoney(amount) : formatShelf(grossLineTotal)
  }

  const subtotal =
    quote?.subtotalBeforeDiscount ??
    inStockItems.reduce((sum, item) => {
      return sum + resolveCheckoutLineTotal(item, null)
    }, 0)

  const totalPrice = quote?.totalAmount ?? subtotal
  const discountAmount = Math.max(0, subtotal - totalPrice)
  const unavailableCount = items.length - inStockItems.length
  const canSubmit =
    !isLoading && !checkoutDisabled && hasCheckoutable && privacyConsentChecked
  const showInlineItems = !shipmentSplitSection && inStockItems.length > 0

  const consentRich = t.rich('privacyConsent', {
    privacy: (chunks) => (
      <Link
        href="/privacy"
        className="inline underline underline-offset-2 hover:text-foreground"
      >
        {chunks}
      </Link>
    ),
    terms: (chunks) => (
      <Link href="/terms" className="inline underline underline-offset-2 hover:text-foreground">
        {chunks}
      </Link>
    ),
  })

  return (
    <div
      className={cn(
        checkoutPanelClassName,
        'flex flex-col !bg-background !p-0',
        'lg:h-full lg:min-h-0 lg:max-h-[inherit] lg:overflow-hidden',
      )}
    >
      <div className="p-4 text-[15px] sm:p-6 sm:text-base lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {promoSection ? (
          <div className="mb-4 border-b border-border/40 pb-4">{promoSection}</div>
        ) : null}

        <h3 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
          {t('orderSummary')}
        </h3>

        {unavailableCount > 0 ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {unavailableCount === 1
              ? t('unavailableOne')
              : t('unavailableMany', { count: unavailableCount })}{' '}
            {t('openCartForReplacement')}
          </p>
        ) : null}

        {showInlineItems ? (
          <div className="mt-4 space-y-3">
            <ul className="space-y-1.5 text-sm">
              {inStockItems.map((item) => {
                const quoteLine = item.variantId
                  ? quoteByVariant.get(item.variantId)
                  : undefined
                const lineTotal = resolveCheckoutLineTotal(item, quoteLine)
                const key = item.variantId
                  ? `${item.plant.id}:${item.variantId}`
                  : item.plant.id
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
                        <VariantSizeLabel
                          as="p"
                          label={variantSize}
                          variant={
                            item.variantId
                              ? findVariantOnPlant(item.plant, item.variantId)
                              : null
                          }
                          className="mt-0.5 truncate text-xs font-medium leading-snug text-primary/90"
                        />
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        suppressHydrationWarning
                        className="tabular-nums text-sm font-medium text-foreground"
                      >
                        {quoteLoading ? '...' : formatLineAmount(lineTotal)}
                      </p>
                      <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        × {item.quantity} {tc('pieceShort')}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
            {onEditOrder ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onEditOrder}
              >
                <PenSquare className="mr-2 h-4 w-4" />
                {t('editOrder')}
              </Button>
            ) : null}
          </div>
        ) : null}

        {shipmentSplitSection ? (
          <div className="mt-4 border-y border-border/40 py-4">{shipmentSplitSection}</div>
        ) : null}

        <CartPromoGiftLines gifts={quote?.giftLines} className="mt-4" />

        <Separator className="my-4" />

        {totalsSection ?? (
          <CartOrderTotalsBreakdown
            checkout={quote?.checkout}
            taxRegime={quote?.taxRegime}
            productsSubtotal={quote?.checkout?.productsSubtotal ?? quote?.totalAmount ?? totalPrice}
            discountAmount={discountAmount}
            grandTotal={quote?.checkout?.grandTotal ?? totalPrice}
            quoteLoading={quoteLoading}
            itemCount={inStockItems.length}
            divided
          />
        )}

        {deliveryEstimate ? (
          <p className="mt-3 text-sm text-muted-foreground">{deliveryEstimate}</p>
        ) : null}

        {!hasCheckoutable ? (
          <p className="mt-3 text-sm text-destructive">
            {t('checkoutBlocked')}
          </p>
        ) : null}

        <Separator className="my-4" />

        <div className="space-y-2">
          <Label htmlFor="checkout-comment">{t('orderComment')}</Label>
          <Textarea
            id="checkout-comment"
            placeholder={t('orderCommentPlaceholder')}
            rows={3}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            className="border-border/90 bg-background shadow-sm ring-1 ring-border/35 focus-visible:ring-primary/25"
          />
        </div>

        {shipmentSplitError ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {shipmentSplitError}
          </p>
        ) : null}

        {checkoutBlockedMessage ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {checkoutBlockedMessage}
          </p>
        ) : null}

        {submitError ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 space-y-3 border-t border-border bg-background px-4 py-3 shadow-[0_-6px_16px_rgba(0,0,0,0.08)] sm:px-6">
        {showCreateAccountOption ? (
          <div className="flex items-start gap-3">
            <Checkbox
              id="checkout-create-account"
              checked={createAccountChecked}
              onCheckedChange={(checked) => onCreateAccountChange?.(checked === true)}
              className="mt-0.5 size-4 rounded-[4px] border-2"
            />
            <Label
              htmlFor="checkout-create-account"
              className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground"
            >
              {t('createAccount')}
            </Label>
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          <Checkbox
            id="checkout-privacy-consent"
            checked={privacyConsentChecked}
            onCheckedChange={(checked) => onPrivacyConsentChange?.(checked === true)}
            aria-invalid={privacyConsentError}
            className={cn(
              'mt-0.5 size-4 shrink-0 rounded-[4px] border-2',
              privacyConsentError && 'border-destructive',
            )}
          />
          <Label
            htmlFor="checkout-privacy-consent"
            className="block min-w-0 flex-1 cursor-pointer gap-0 text-xs font-normal leading-snug text-muted-foreground"
          >
            <span className="whitespace-normal [&>a]:inline [&>a]:whitespace-nowrap">
              {consentRich}
            </span>
          </Label>
        </div>
        {privacyConsentError ? (
          <p className="text-xs text-destructive">{t('privacyConsentRequired')}</p>
        ) : null}
        <Button type="submit" form={formId} size="lg" disabled={!canSubmit} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('placingOrder')}
            </>
          ) : (
            t(useObligationToPayLabel ? 'placeOrderWithObligation' : 'placeOrder')
          )}
        </Button>
      </div>
    </div>
  )
})
