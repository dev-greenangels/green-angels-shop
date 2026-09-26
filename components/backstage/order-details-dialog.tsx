'use client'

import { useEffect, useState } from 'react'
import { Eye, ExternalLink, Loader2 } from 'lucide-react'

import { OrderStatusBadge } from '@/components/backstage/order-status-select'
import { CountryDisplay } from '@/components/backstage/country-display'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatOrderCustomerName } from '@/lib/backstage/order-display'
import {
  formatOrderMoney,
} from '@/lib/backstage/order-detail-helpers'
import type { BackstageCountryLocale } from '@/lib/backstage/country-display'
import {
  fetchBackstageOrder,
  type BackstageOrderDetail,
  type BackstageOrderListItem,
} from '@/lib/backstage/orders'
import { formatDateTime } from '@/lib/i18n/format-datetime'

export function OrderDetailsDialog({
  orderId,
  onStatusUpdated,
  onDeleted: _onDeleted,
}: {
  orderId: string
  onStatusUpdated: (order: BackstageOrderListItem) => void
  onDeleted?: (orderId: string) => void
}) {
  const { locale } = useBackstageUiLocale()
  const countryLocale = (
    locale === 'uk' || locale === 'sk' ? locale : 'en'
  ) as BackstageCountryLocale
  const [open, setOpen] = useState(false)
  const [order, setOrder] = useState<BackstageOrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const detailHref = `/backstage/orders/${orderId}`

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchBackstageOrder(orderId)
      .then((detail) => {
        if (cancelled) return
        setOrder(detail)
        onStatusUpdated(detail)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення.')
        setOrder(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, orderId, onStatusUpdated])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Швидкий перегляд замовлення">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12 text-left">
          <DialogTitle className="font-serif text-xl">
            {order ? `Замовлення ${order.orderNumber}` : 'Замовлення'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {order
              ? formatDateTime(order.createdAt, locale, 'datetime')
              : 'Швидкий перегляд'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Завантаження...
          </div>
        ) : order ? (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} label={order.statusLabel} />
                {order.paymentStatus ? (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    Оплата: {order.paymentStatus}
                  </span>
                ) : null}
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                  ERP: {order.erpSyncStatus ?? 'NOT_REQUIRED'}
                </span>
              </div>

              <div className="space-y-1 rounded-lg bg-muted/40 p-3">
                <p className="font-medium">{formatOrderCustomerName(order)}</p>
                {order.customerEmail ? (
                  <p className="text-muted-foreground">{order.customerEmail}</p>
                ) : null}
                <p className="text-muted-foreground">{order.customerPhone}</p>
              </div>

              <div className="space-y-1">
                <p className="inline-flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">Країна доставки:</span>
                  <CountryDisplay
                    code={order.deliveryCountryCode}
                    locale={countryLocale}
                    variant="compact"
                  />
                </p>
                <p>
                  <span className="text-muted-foreground">Разом:</span>{' '}
                  {formatOrderMoney(order.totalAmount, order.currency)}
                </p>
                {order.trackingNumber ? (
                  <p>
                    <span className="text-muted-foreground">ТТН:</span> {order.trackingNumber}
                  </p>
                ) : (
                  <p className="text-muted-foreground">ТТН ще не вказано</p>
                )}
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
              <Button asChild className="w-full sm:w-auto">
                <a href={detailHref}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Відкрити замовлення
                </a>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            {error ?? 'Замовлення не знайдено.'}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
