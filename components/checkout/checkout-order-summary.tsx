'use client'

import { memo, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

import { CartOrderTotalsBreakdown } from '@/components/cart/cart-order-totals-breakdown'
import { CartPromoGiftLines } from '@/components/cart/cart-promo-gift-lines'
import { checkoutPanelClassName } from '@/components/checkout/checkout-utils'
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
import type { PricingQuote } from '@/lib/pricing/quote'

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
  privacyConsentChecked?: boolean
  privacyConsentError?: boolean
  privacyConsentLabel?: string | null
  onPrivacyConsentChange?: (checked: boolean) => void
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
  privacyConsentChecked = false,
  privacyConsentError = false,
  privacyConsentLabel = null,
  onPrivacyConsentChange,
}: CheckoutOrderSummaryProps) {
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const items = useCartItems()
  const inStockItems = getInStockCartItems(items)
  const hasCheckoutable = useCartHasCheckoutableItems()

  const subtotal = quote?.subtotalBeforeDiscount ?? inStockItems.reduce((sum, item) => {
    const price = item.unitPrice ?? item.plant.price
    return sum + price * item.quantity
  }, 0)

  const totalPrice = quote?.totalAmount ?? subtotal
  const discountAmount = Math.max(0, subtotal - totalPrice)
  const unavailableCount = items.length - inStockItems.length
  const canSubmit =
    !isLoading && !checkoutDisabled && hasCheckoutable && privacyConsentChecked

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

        {shipmentSplitSection ? (
          <div className="mt-4 border-y border-border/40 py-4">{shipmentSplitSection}</div>
        ) : null}

        <CartPromoGiftLines gifts={quote?.giftLines} className="mt-4" />

        <Separator className="my-4" />

        {totalsSection ?? (
          <CartOrderTotalsBreakdown
            checkout={quote?.checkout}
            productsSubtotal={quote?.totalAmount ?? totalPrice}
            discountAmount={discountAmount}
            grandTotal={quote?.checkout?.grandTotal ?? totalPrice}
            quoteLoading={quoteLoading}
            itemCount={inStockItems.length}
            divided
          />
        )}

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

      <div className="shrink-0 space-y-3 border-t border-border/50 bg-background/95 px-4 py-3 shadow-[0_-6px_16px_rgba(0,0,0,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-background/75 sm:px-6">
        <Button
          type="submit"
          form={formId}
          size="lg"
          disabled={!canSubmit}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('placingOrder')}
            </>
          ) : (
            t('checkoutGdpr')
          )}
        </Button>
        <div className="flex items-start gap-3">
          <Checkbox
            id="checkout-privacy-consent"
            checked={privacyConsentChecked}
            onCheckedChange={(checked) => onPrivacyConsentChange?.(checked === true)}
            aria-invalid={privacyConsentError}
            className={cn(privacyConsentError && 'border-destructive')}
          />
          <Label
            htmlFor="checkout-privacy-consent"
            className="cursor-pointer text-xs font-normal leading-relaxed text-muted-foreground"
          >
            {privacyConsentLabel?.trim() ? (
              privacyConsentLabel
            ) : (
              t.rich('privacyConsent', {
                terms: (chunks) => (
                  <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                    {chunks}
                  </Link>
                ),
              })
            )}
          </Label>
        </div>
        {privacyConsentError ? (
          <p className="text-xs text-destructive">{t('privacyConsentRequired')}</p>
        ) : null}
      </div>
    </div>
  )
})
