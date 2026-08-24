'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { CheckoutCardPaymentPanel } from '@/components/checkout/checkout-card-payment-panel'
import {
  checkoutPageContentClassName,
  checkoutPageShellClassName,
} from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import type { StripePendingPayment } from '@/lib/checkout/stripe-pending'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { checkoutSuccessSearch, checkoutCancelledSearch } from '@/lib/orders/create-order'
import {
  cancelUnpaidOrder,
  fetchOrderConfirmation,
  retryOrderPayment,
  syncStripePayment,
  type PublicOrderConfirmation,
} from '@/lib/orders/fetch-order-confirmation'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

function confirmationFromQuery(
  order: PublicOrderConfirmation,
  confirmationToken: string,
): StripePendingPayment | null {
  const clientSecret = order.clientSecret?.trim() ?? ''
  const publishableKey = order.publishableKey?.trim() ?? ''
  if (!clientSecret || !publishableKey) return null
  return {
    orderNumber: order.orderNumber,
    confirmationToken,
    clientSecret,
    publishableKey,
    totalAmount: order.totalAmount,
    currency: order.currency,
    paymentExpiresAt: order.paymentExpiresAt ?? null,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
    })),
  }
}

function CheckoutPayInner() {
  const t = useTranslations('checkout.stripe')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')?.trim() ?? ''
  const confirmationToken = searchParams.get('confirmation')?.trim() ?? ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<StripePendingPayment | null>(null)
  const [statusHint, setStatusHint] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orderNumber || !confirmationToken) {
      setError(t('resumeMissingParams'))
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await syncStripePayment(orderNumber, confirmationToken).catch(() => null)
      let order = await fetchOrderConfirmation(orderNumber, confirmationToken)
      if (!order) {
        setError(t('resumeNotFound'))
        setPayment(null)
        return
      }

      if (order.status === 'CANCELLED') {
        setStatusHint(t('resumeCancelled'))
        setPayment(null)
        return
      }

      if (order.paymentStatus === 'success' || order.status !== 'AWAITING_PAYMENT') {
        router.replace(
          `/checkout/success?${checkoutSuccessSearch([{ orderNumber: order.orderNumber, confirmationToken }])}`,
        )
        return
      }

      if (order.paymentPageUrl) {
        window.location.href = order.paymentPageUrl
        return
      }

      let pending = confirmationFromQuery(order, confirmationToken)
      if (!pending && order.canRetry) {
        const retried = await retryOrderPayment(
          orderNumber,
          confirmationToken,
          typeof window !== 'undefined' ? window.location.origin : undefined,
        )
        if (retried?.paymentPageUrl) {
          window.location.href = retried.paymentPageUrl
          return
        }
        if (retried?.clientSecret && retried.publishableKey) {
          order = {
            ...order,
            clientSecret: retried.clientSecret,
            publishableKey: retried.publishableKey,
            paymentExpiresAt: retried.paymentExpiresAt ?? order.paymentExpiresAt,
          }
          pending = confirmationFromQuery(order, confirmationToken)
        }
      }

      if (!pending) {
        setError(t('resumeNoPaymentSession'))
        setPayment(null)
        return
      }
      setPayment(pending)
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    } catch {
      setError(t('resumeLoadFailed'))
      setPayment(null)
    } finally {
      setLoading(false)
    }
  }, [confirmationToken, orderNumber, router, t])

  useEffect(() => {
    void load()
  }, [load])

  const handlePaid = useCallback(() => {
    if (!payment) return
    router.replace(
      `/checkout/success?${checkoutSuccessSearch([
        { orderNumber: payment.orderNumber, confirmationToken: payment.confirmationToken },
      ])}`,
    )
  }, [payment, router])

  const handleCancel = useCallback(async () => {
    if (!payment) return
    const orderNumber = payment.orderNumber
    const result = await cancelUnpaidOrder(orderNumber, payment.confirmationToken)
    if (!result.ok) throw new Error(result.error || 'cancel failed')
    router.replace(`/checkout/cancelled?${checkoutCancelledSearch(orderNumber)}`)
  }, [payment, router])

  const handleRetry = useCallback(async () => {
    if (!payment) return
    const retried = await retryOrderPayment(
      payment.orderNumber,
      payment.confirmationToken,
      typeof window !== 'undefined' ? window.location.origin : undefined,
    )
    if (!retried?.clientSecret || !retried.publishableKey) {
      throw new Error('retry failed')
    }
    setPayment({
      ...payment,
      confirmationToken: retried.confirmationToken ?? payment.confirmationToken,
      clientSecret: retried.clientSecret,
      publishableKey: retried.publishableKey,
      paymentExpiresAt: retried.paymentExpiresAt ?? payment.paymentExpiresAt,
    })
  }, [payment])

  const handleSessionInvalid = useCallback(() => {
    void handleRetry().catch(() => {
      setError(t('refreshFormFailed'))
    })
  }, [handleRetry, t])

  return (
    <div className={checkoutPageShellClassName}>
      <div className={cn(checkoutPageContentClassName, siteContentShellClassName, 'py-10 sm:py-16')}>
        {loading ? (
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <Loader2 className="mb-6 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        ) : payment ? (
          <CheckoutCardPaymentPanel
            payment={payment}
            index={0}
            total={1}
            paymentExpiresAt={payment.paymentExpiresAt}
            onPaid={handlePaid}
            onCancelOrder={handleCancel}
            onRetry={handleRetry}
            onSessionInvalid={handleSessionInvalid}
          />
        ) : (
          <div className="mx-auto max-w-md space-y-4 text-center">
            <h1 className="font-serif text-2xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{statusHint || error}</p>
            <Button asChild variant="outline">
              <Link href="/">{tCommon('continueShopping')}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPayPage() {
  return (
    <Suspense
      fallback={
        <div className={checkoutPageShellClassName}>
          <div className={cn(checkoutPageContentClassName, siteContentShellClassName, 'py-24')}>
            <div className="mx-auto flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          </div>
        </div>
      }
    >
      <CheckoutPayInner />
    </Suspense>
  )
}
