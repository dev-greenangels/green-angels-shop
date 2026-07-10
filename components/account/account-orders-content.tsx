'use client'

import { useEffect, useState } from 'react'
import { Loader2, Package } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { fetchAccountOrders, type AccountOrderListItem } from '@/lib/account/api'
import {
  DELIVERY_METHOD_LABELS,
  normalizeOrderStatus,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
} from '@/lib/backstage/order-status'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import { cn } from '@/lib/utils'

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'en' ? 'en-GB' : locale === 'sk' ? 'sk-SK' : 'uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function AccountOrdersContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [orders, setOrders] = useState<AccountOrderListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchAccountOrders()
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : t('loadError')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tc('loading')}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!orders.length) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-foreground">{t('ordersEmptyTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('ordersEmptyBody')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = normalizeOrderStatus(order.status)
        return (
          <article
            key={order.id}
            className="rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.createdAt, locale)}</p>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  ORDER_STATUS_COLORS[status],
                )}
              >
                {ORDER_STATUS_LABELS[status]}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>{tc('itemCount', { count: order.itemCount })}</span>
              <FormattedPrice amount={order.totalAmount} />
              <span>{DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}</span>
              {order.deliveryCity ? <span>{order.deliveryCity}</span> : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
