'use client'

import { useEffect, useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { BrandLogo } from '@/components/brand-logo'
import { useMarketRegion } from '@/components/providers/market-region-provider'
import { PaymentDeadlineCountdown } from '@/components/checkout/payment-deadline-countdown'
import { StripePaymentForm } from '@/components/checkout/stripe-payment-form'
import { checkoutPanelClassName } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { formatMoneyAmount } from '@/lib/commerce/format'
import { getMarketBranding } from '@/lib/branding/market-branding'
import type { StripePendingPayment } from '@/lib/checkout/stripe-pending'
import { cn } from '@/lib/utils'

export function CheckoutCardPaymentPanel({
  payment,
  index,
  total,
  paymentExpiresAt,
  onPaid,
  onCancelOrder,
  onRetry,
  onSessionInvalid,
}: {
  payment: StripePendingPayment
  index: number
  total: number
  paymentExpiresAt?: string | null
  onPaid: () => void
  onCancelOrder: () => Promise<void>
  onRetry: () => Promise<void>
  onSessionInvalid: () => void
}) {
  const t = useTranslations('checkout.stripe')
  const locale = useLocale()
  const marketRegion = useMarketRegion()
  const brandAlt = getMarketBranding(marketRegion).applicationName
  const [cancelling, setCancelling] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [payment.clientSecret, payment.orderNumber])

  const moneyOpts = {
    code: payment.currency.trim().toUpperCase() || 'EUR',
    symbol: payment.currency.trim().toUpperCase() || 'EUR',
    decimals: payment.currency.trim().toUpperCase() === 'HUF' ? 0 : 2,
  }
  const amountLabel = formatMoneyAmount(payment.totalAmount, moneyOpts, locale)

  const handleCancelOrder = async () => {
    if (cancelling) return
    const ok = window.confirm(t('cancelPaymentConfirm'))
    if (!ok) return
    setCancelling(true)
    setActionError(null)
    try {
      await onCancelOrder()
    } catch {
      setActionError(t('cancelPaymentFailed'))
      setCancelling(false)
    }
  }

  const handleRetry = async () => {
    if (retrying) return
    setRetrying(true)
    setActionError(null)
    try {
      await onRetry()
    } catch {
      setActionError(t('refreshFormFailed'))
    } finally {
      setRetrying(false)
    }
  }

  const items = payment.items ?? []

  return (
    <div
      id="checkout-card-payment"
      className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]"
    >
      <aside className={cn(checkoutPanelClassName, 'h-fit space-y-4')}>
        <BrandLogo alt={brandAlt} imgClassName="max-h-10 md:max-h-11" />

        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{t('orderCreatedBadge')}</p>
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {t('orderNumber', { number: payment.orderNumber })}
          </h2>
        </div>

        <PaymentDeadlineCountdown paymentExpiresAt={paymentExpiresAt} />

        {items.length > 0 ? (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-sm font-medium text-foreground">{t('itemsTitle')}</p>
            <ul className="space-y-3">
              {items.map((item, i) => {
                const lineLabel =
                  typeof item.lineTotal === 'number'
                    ? formatMoneyAmount(item.lineTotal, moneyOpts, locale)
                    : null
                return (
                  <li
                    key={`${item.productName}-${i}`}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 flex-1 text-foreground">
                      {item.productName}
                      {item.variantLabel ? (
                        <span className="text-muted-foreground"> ({item.variantLabel})</span>
                      ) : null}
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    </span>
                    {lineLabel ? (
                      <span className="shrink-0 tabular-nums font-medium text-foreground">
                        {lineLabel}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('summaryHint')}</p>
        )}

        <div className="border-t border-border/60 pt-4">
          <p className="text-lg font-semibold text-foreground tabular-nums">
            {t('amountDue', { amount: amountLabel })}
          </p>
        </div>
      </aside>

      <div className="space-y-4">
        <BrandLogo alt={brandAlt} className="lg:hidden" imgClassName="max-h-9" />

        <StripePaymentForm
          payment={payment}
          index={index}
          total={total}
          onPaid={onPaid}
          onSessionInvalid={onSessionInvalid}
          embedded
        />

        {actionError ? (
          <p className="text-sm text-destructive" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={cancelling || retrying}
            onClick={() => void handleRetry()}
          >
            {retrying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('refreshingForm')}
              </>
            ) : (
              t('refreshPaymentForm')
            )}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            disabled={cancelling || retrying}
            onClick={() => void handleCancelOrder()}
          >
            {cancelling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('cancelling')}
              </>
            ) : (
              t('cancelPayment')
            )}
          </Button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          {t('cancelPaymentHint')}
        </p>
      </div>
    </div>
  )
}
