'use client'

import { useCallback, useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import {
  AccountPageEmpty,
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { AccountListPagination } from '@/components/account/account-list-pagination'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { fetchAccountOrders, type AccountOrderListItem } from '@/lib/account/api'
import {
  normalizeOrderStatus,
  orderStatusBadgeClass,
  orderStatusLabel,
} from '@/lib/backstage/order-status'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { buildTrackingUrl } from '@/lib/shipping/tracking'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

function useCheckoutMethodLabel() {
  const tCheckout = useTranslations('checkout')
  return (kind: 'delivery' | 'payment', slug: string) => {
    if (kind === 'delivery') {
      const key = `deliveryMethods.${slug}` as Parameters<typeof tCheckout>[0]
      return tCheckout.has(key) ? tCheckout(key) : slug
    }
    const key = `paymentMethods.${slug}.title` as Parameters<typeof tCheckout>[0]
    return tCheckout.has(key) ? tCheckout(key) : slug
  }
}

export function AccountOrdersContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const methodLabel = useCheckoutMethodLabel()
  const locale = useLocale()
  const [orders, setOrders] = useState<AccountOrderListItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    void fetchAccountOrders({ page, pageSize: PAGE_SIZE })
      .then((data) => {
        setOrders(data.items)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('loadError')))
      .finally(() => setLoading(false))
  }, [page, t])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <AccountPageLoading />
  }

  if (error) {
    return <AccountPageError message={error} onRetry={load} />
  }

  if (!orders.length) {
    return (
      <AccountPageEmpty
        icon={Package}
        title={t('ordersEmptyTitle')}
        body={t('ordersEmptyBody')}
        action={
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/account/claim-order">{t('claimOrderCta')}</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = normalizeOrderStatus(order.status)
        const trackingUrl = order.trackingNumber
          ? buildTrackingUrl(order.trackingNumber, {
              trackingCarrier: order.trackingCarrier,
              deliveryMethod: order.deliveryMethod,
            })
          : null
        return (
          <article
            key={order.id}
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-colors hover:border-primary/30 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/account/orders/${order.id}`}
                  className="break-words font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {order.orderNumber}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(order.createdAt, locale, 'dateLong')}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  orderStatusBadgeClass(status),
                )}
              >
                {orderStatusLabel(status, order.statusLabel)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 break-words text-sm text-muted-foreground">
              <span>{tc('itemCount', { count: order.itemCount })}</span>
              <FormattedPrice amount={order.totalAmount} mode="raw" />
              <span>{methodLabel('delivery', order.deliveryMethod)}</span>
              {order.deliveryCity ? <span>{order.deliveryCity}</span> : null}
              {order.trackingNumber ? (
                <span className="break-all">
                  {t('trackingLabel')}:{' '}
                  {trackingUrl ? (
                    <a
                      className="font-medium text-primary underline-offset-2 hover:underline"
                      href={trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {order.trackingNumber}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">
                      {order.trackingNumber}
                    </span>
                  )}
                </span>
              ) : null}
            </div>
            <div className="mt-3">
              <Link
                href={`/account/orders/${order.id}`}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('viewOrder')}
              </Link>
            </div>
          </article>
        )
      })}
      <AccountListPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
        onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
      />
    </div>
  )
}
