'use client'

import { useEffect, useState } from 'react'
import { Eye, Loader2, Package } from 'lucide-react'
import { toast } from 'sonner'

import { OrderStatusBadge, OrderStatusSelect } from '@/components/backstage/order-status-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
} from '@/lib/backstage/order-status'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import {
  formatOrderCustomerName,
  formatOrderDeliveryLines,
  isOrderReceiverDifferent,
} from '@/lib/backstage/order-display'
import { formatStoreAddress } from '@/lib/settings/store-helpers'
import {
  fetchBackstageOrder,
  patchBackstageOrderStatus,
  type BackstageOrderDetail,
  type BackstageOrderListItem,
} from '@/lib/backstage/orders'

function formatMoney(amount: number, currency = 'UAH') {
  if (currency === 'UAH') return `${amount.toLocaleString('uk-UA')} ₴`
  return `${amount.toLocaleString('uk-UA')} ${currency}`
}

export function OrderDetailsDialog({
  orderId,
  onStatusUpdated,
}: {
  orderId: string
  onStatusUpdated: (order: BackstageOrderListItem) => void
}) {
  const store = useStoreSettings()
  const pickupAddress = formatStoreAddress(store)
  const [open, setOpen] = useState(false)
  const [order, setOrder] = useState<BackstageOrderDetail | null>(null)
  const [status, setStatus] = useState<OrderStatus>('PENDING')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchBackstageOrder(orderId)
      .then((detail) => {
        if (cancelled) return
        setOrder(detail)
        setStatus(detail.status)
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
  }, [open, orderId])

  const handleSaveStatus = async () => {
    if (!order || status === order.status) return
    setSaving(true)
    setError(null)
    try {
      const updated = await patchBackstageOrderStatus(order.id, status)
      setOrder((prev) => (prev ? { ...prev, status: updated.status } : prev))
      setStatus(updated.status)
      onStatusUpdated(updated)
      toast.success(`Статус ${order.orderNumber} оновлено.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти статус.')
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти статус.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Переглянути замовлення">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,48rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12 text-left">
          <DialogTitle className="font-serif text-xl">
            {order ? `Замовлення ${order.orderNumber}` : 'Замовлення'}
          </DialogTitle>
          {order ? (
            <p className="text-sm text-muted-foreground">
              {formatOrderCustomerName(order)} ·{' '}
              {new Date(order.createdAt).toLocaleString('uk-UA')}
            </p>
          ) : null}
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Завантаження...
          </div>
        ) : order ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Статус замовлення</span>
                  <OrderStatusBadge status={order.status} className="px-3 py-1 text-sm" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Замовник</h4>
                  <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
                    <p>
                      <span className="text-muted-foreground">Прізвище:</span> {order.customerLastName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Ім&apos;я:</span> {order.customerFirstName}
                    </p>
                    {order.customerPatronymic ? (
                      <p>
                        <span className="text-muted-foreground">По батькові:</span>{' '}
                        {order.customerPatronymic}
                      </p>
                    ) : null}
                    {order.customerEmail ? (
                      <p>
                        <span className="text-muted-foreground">Email:</span> {order.customerEmail}
                      </p>
                    ) : null}
                    <p>
                      <span className="text-muted-foreground">Телефон:</span> {order.customerPhone}
                    </p>
                  </div>
                </div>

                {isOrderReceiverDifferent(order) ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Отримувач</h4>
                    <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
                      <p>
                        <span className="text-muted-foreground">Прізвище:</span> {order.receiverLastName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Ім&apos;я:</span> {order.receiverFirstName}
                      </p>
                      {order.receiverPatronymic ? (
                        <p>
                          <span className="text-muted-foreground">По батькові:</span>{' '}
                          {order.receiverPatronymic}
                        </p>
                      ) : null}
                      <p>
                        <span className="text-muted-foreground">Телефон:</span> {order.receiverPhone}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <h4 className="font-semibold">Доставка та оплата</h4>
                  <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
                    <p>
                      <span className="text-muted-foreground">Спосіб:</span>{' '}
                      {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
                    </p>
                    {formatOrderDeliveryLines(order, pickupAddress).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    <p>
                      <span className="text-muted-foreground">Оплата:</span>{' '}
                      {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </p>
                    {order.comment ? (
                      <p>
                        <span className="text-muted-foreground">Коментар:</span> {order.comment}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Товари ({order.items.length})</h4>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">Назва</th>
                            <th className="px-4 py-2 text-center text-sm font-medium">К-сть</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Сума</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} className="border-t border-border">
                              <td className="px-4 py-2 text-sm">
                                <p>{item.productName}</p>
                                {item.variantLabel ? (
                                  <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                                ) : null}
                              </td>
                              <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatMoney(item.lineTotal, order.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2 text-sm font-semibold">
                      <span>Разом</span>
                      <span>{formatMoney(order.totalAmount, order.currency)}</span>
                    </div>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full flex-col gap-1.5 sm:w-auto">
                <span className="text-xs font-medium text-muted-foreground">Новий статус</span>
                <OrderStatusSelect
                  value={status}
                  onValueChange={setStatus}
                  disabled={saving}
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleSaveStatus()}
                disabled={saving || status === order.status}
                className="w-full sm:w-auto"
              >
                <Package className="mr-2 h-4 w-4" />
                {saving ? 'Збереження...' : 'Зберегти статус'}
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
