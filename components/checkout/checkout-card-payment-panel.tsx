'use client'

import { useEffect, useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { StripePaymentForm } from '@/components/checkout/stripe-payment-form'
import { checkoutPanelClassName } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { formatMoneyAmount } from '@/lib/commerce/format'
import type { StripePendingPayment } from '@/lib/checkout/stripe-pending'
import { cn } from '@/lib/utils'

function formatDeadline(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

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
  const [cancelling, setCancelling] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [payment.clientSecret, payment.orderNumber])

  const deadlineLabel = formatDeadline(paymentExpiresAt, locale)
  const amountLabel = formatMoneyAmount(
    payment.totalAmount,
    {
      code: payment.currency.trim().toUpperCase() || 'EUR',
      symbol: payment.currency.trim().toUpperCase() || 'EUR',
      decimals: payment.currency.trim().toUpperCase() === 'HUF' ? 0 : 2,
    },
    locale,
  )

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
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('orderCreatedBadge')}
        </p>
        <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {t('orderNumber', { number: payment.orderNumber })}
        </h2>
        <p className="text-lg font-semibold text-foreground tabular-nums">
          {t('amountDue', { amount: amountLabel })}
        </p>
        {deadlineLabel ? (
          <div className="rounded-md border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">{t('deadline', { time: deadlineLabel })}</p>
            <p className="mt-1 text-xs opacity-90">{t('deadlineHint')}</p>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-sm font-medium text-foreground">{t('itemsTitle')}</p>
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li
                  key={`${item.productName}-${i}`}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 flex-1 text-foreground">
                    {item.productName}
                    {item.variantLabel ? (
                      <span className="text-muted-foreground"> ({item.variantLabel})</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    ×{item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('summaryHint')}</p>
        )}
      </aside>

      <div className="space-y-4">
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
