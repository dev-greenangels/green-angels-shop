'use client'

import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import {
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { ContractWithdrawalAccountDialog } from '@/components/legal/contract-withdrawal-account-dialog'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import { Link } from '@/i18n/navigation'
import {
  fetchAccountOrder,
  type AccountOrderDetail,
} from '@/lib/account/api'
import {
  normalizeOrderStatus,
  orderStatusBadgeClass,
  orderStatusLabel,
} from '@/lib/backstage/order-status'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { buildTrackingUrl } from '@/lib/shipping/tracking'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Props = {
  orderId: string
}

export function AccountOrderDetailContent({ orderId }: Props) {
  const t = useTranslations('account')
  const tCheckout = useTranslations('checkout')
  const tWithdrawal = useTranslations('contractWithdrawal')
  const locale = useLocale()
  const [order, setOrder] = useState<AccountOrderDetail | null>(null)
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchAccountOrder(orderId)
      .then((data) => {
        if (cancelled) return
        setOrder(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : t('loadError')
        setError(message || t('orderNotFound'))
        setOrder(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [orderId, reloadToken, t])

  if (loading) {
    return <AccountPageLoading />
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <AccountPageError
          message={error || t('orderNotFound')}
          onRetry={() => setReloadToken((n) => n + 1)}
        />
        <Link
          href="/account/orders"
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('backToOrders')}
        </Link>
      </div>
    )
  }

  const status = normalizeOrderStatus(order.status)
  const deliveryKey =
    `deliveryMethods.${order.deliveryMethod}` as Parameters<typeof tCheckout>[0]
  const paymentKey =
    `paymentMethods.${order.paymentMethod}.title` as Parameters<
      typeof tCheckout
    >[0]
  const deliveryLabel = tCheckout.has(deliveryKey)
    ? tCheckout(deliveryKey)
    : order.deliveryMethod
  const paymentLabel = tCheckout.has(paymentKey)
    ? tCheckout(paymentKey)
    : order.paymentMethod
  const addressLine = [order.deliveryStreet, order.deliveryHouseNumber]
    .filter(Boolean)
    .join(', ')
  const trackingUrl = order.trackingNumber
    ? buildTrackingUrl(order.trackingNumber, {
        trackingCarrier: order.trackingCarrier,
        deliveryMethod: order.deliveryMethod,
      })
    : null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/account/orders"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t('backToOrders')}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {order.withdrawalActionVisible ? (
            <>
              <Button type="button" variant="outline" onClick={() => setWithdrawalOpen(true)}>
                {tWithdrawal('accountCta')}
              </Button>
              <ContractWithdrawalAccountDialog
                orderId={order.id}
                open={withdrawalOpen}
                onOpenChange={setWithdrawalOpen}
              />
            </>
          ) : null}
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              orderStatusBadgeClass(status),
            )}
          >
            {orderStatusLabel(status, order.statusLabel)}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="break-words font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {t('orderNumberLabel', { number: order.orderNumber })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t('orderPlacedAt', {
            date: formatDateTime(order.createdAt, locale, 'dateLong'),
          })}
        </p>
      </div>

      <section className="space-y-3" aria-labelledby="account-order-items">
        <h2
          id="account-order-items"
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {t('orderItems')}
        </h2>
        <ul className="divide-y divide-border/60 border-y border-border/60">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium text-foreground">
                  {item.productName}
                  {item.variantLabel ? (
                    <span className="text-muted-foreground">
                      {' '}
                      · {item.variantLabel}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t('orderItemQty', { qty: item.quantity })}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums">
                <FormattedPrice amount={item.lineTotal} mode="raw" />
              </p>
            </li>
          ))}
        </ul>
        <div className="flex justify-between gap-4 text-base font-semibold">
          <span>{t('orderTotal')}</span>
          <FormattedPrice amount={order.totalAmount} mode="raw" />
        </div>
      </section>

      <section
        className="grid gap-6 sm:grid-cols-2"
        aria-labelledby="account-order-meta"
      >
        <h2 id="account-order-meta" className="sr-only">
          {t('orderDetails')}
        </h2>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('orderDelivery')}
          </p>
          <p className="text-sm text-foreground">{deliveryLabel}</p>
          {order.deliveryCity ? (
            <p className="text-sm text-muted-foreground">{order.deliveryCity}</p>
          ) : null}
          {order.deliveryBranch ? (
            <p className="text-sm text-muted-foreground">{order.deliveryBranch}</p>
          ) : null}
          {addressLine ? (
            <p className="text-sm text-muted-foreground">{addressLine}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('orderPayment')}
          </p>
          <p className="text-sm text-foreground">{paymentLabel}</p>
          {order.trackingNumber ? (
            <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
              <Package className="size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">
                {t('trackingLabel')}:{' '}
                {trackingUrl ? (
                  <a
                    className="break-all font-medium text-primary underline-offset-2 hover:underline"
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {order.trackingNumber}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">
                    {order.trackingNumber}
                  </span>
                )}
              </span>
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
