'use client'

import { useEffect, useMemo, useState } from 'react'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from '@stripe/react-stripe-js/checkout'
import { Loader2, Lock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import {
  checkoutPanelClassName,
  shopPublicBaseUrl,
} from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import {
  stripeReturnQuery,
  type StripePendingPayment,
} from '@/lib/checkout/stripe-pending'
import { formatMoneyAmount } from '@/lib/commerce/format'
import { cn } from '@/lib/utils'

const stripePromises = new Map<string, Promise<Stripe | null>>()

function getStripe(publishableKey: string): Promise<Stripe | null> {
  const existing = stripePromises.get(publishableKey)
  if (existing) return existing
  const promise = loadStripe(publishableKey)
  stripePromises.set(publishableKey, promise)
  return promise
}

function formatPayAmount(amount: number, currency: string, locale: string): string {
  const code = currency.trim().toUpperCase() || 'EUR'
  const decimals = code === 'HUF' ? 0 : 2
  return formatMoneyAmount(amount, { code, symbol: code, decimals }, locale)
}

const STRIPE_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#4c9d1a',
    colorBackground: '#FFFFFF',
    colorText: '#2A2A28',
    colorDanger: '#DC2626',
    fontFamily: 'Source Sans 3, system-ui, sans-serif',
    borderRadius: '8px',
  },
}

const STRIPE_FONTS = [
  {
    cssSrc:
      'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600&display=swap',
  },
]

function StripePaymentFormInner({
  payment,
  index,
  total,
  onPaid,
  onSessionInvalid,
}: {
  payment: StripePendingPayment
  index: number
  total: number
  onPaid: () => void
  onSessionInvalid?: () => void
}) {
  const t = useTranslations('checkout.stripe')
  const locale = useLocale()
  const checkoutState = useCheckoutElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amountLabel = formatPayAmount(payment.totalAmount, payment.currency, locale)
  const ready = checkoutState.type === 'success'
  const checkout = checkoutState.type === 'success' ? checkoutState.checkout : null

  useEffect(() => {
    if (checkoutState.type !== 'error') return
    onSessionInvalid?.()
  }, [checkoutState.type, onSessionInvalid])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!checkout || submitting || !checkout.canConfirm) return
    setSubmitting(true)
    setError(null)
    try {
      const shopBase = shopPublicBaseUrl(locale)
      const returnUrl = shopBase
        ? `${shopBase}/checkout?${stripeReturnQuery(payment)}`
        : undefined
      const result = await checkout.confirm({
        redirect: 'if_required',
        ...(returnUrl ? { returnUrl } : {}),
      })
      if (result.type === 'error') {
        setError(result.error.message || t('error'))
        setSubmitting(false)
        return
      }
      onPaid()
    } catch {
      setError(t('error'))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      {total > 1 ? (
        <p className="text-sm text-muted-foreground">
          {t('splitProgress', { current: index + 1, total })}
        </p>
      ) : null}

      {checkoutState.type === 'loading' ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t('loading')}</span>
        </div>
      ) : null}

      {checkoutState.type === 'error' ? (
        <p className="text-sm text-destructive" role="alert">
          {checkoutState.error.message || t('error')}
        </p>
      ) : null}

      {ready ? <PaymentElement /> : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!ready || submitting || !checkout?.canConfirm}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('processing')}
          </>
        ) : (
          t('pay', { amount: amountLabel })
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        {t('secureHint')}
      </p>
    </form>
  )
}

export function StripePaymentForm({
  payment,
  index,
  total,
  onPaid,
  onSessionInvalid,
  embedded,
}: {
  payment: StripePendingPayment
  index: number
  total: number
  onPaid: () => void
  onSessionInvalid?: () => void
  embedded?: boolean
}) {
  const t = useTranslations('checkout.stripe')
  const stripePromise = useMemo(
    () => getStripe(payment.publishableKey),
    [payment.publishableKey],
  )
  const options = useMemo(
    () => ({
      clientSecret: payment.clientSecret,
      elementsOptions: {
        appearance: STRIPE_APPEARANCE,
        fonts: STRIPE_FONTS,
      },
    }),
    [payment.clientSecret],
  )

  const body = (
    <CheckoutElementsProvider
      key={payment.clientSecret}
      stripe={stripePromise}
      options={options}
    >
      <StripePaymentFormInner
        payment={payment}
        index={index}
        total={total}
        onPaid={onPaid}
        onSessionInvalid={onSessionInvalid}
      />
    </CheckoutElementsProvider>
  )

  return (
    <div className={cn(checkoutPanelClassName, embedded ? undefined : 'mx-auto max-w-lg')}>
      <h1 className="mb-1 font-serif text-2xl font-bold text-foreground">{t('title')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('subtitle')}</p>
      {body}
    </div>
  )
}
