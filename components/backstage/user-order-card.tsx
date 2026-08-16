'use client'

import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CancelOrderDialog } from '@/components/backstage/cancel-order-dialog'
import { OrderStatusBadge, OrderStatusSelect } from '@/components/backstage/order-status-select'
import { Button } from '@/components/ui/button'
import { DELIVERY_METHOD_LABELS, type OrderStatus } from '@/lib/backstage/order-status'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import {
  formatOrderDeliveryLines,
  formatOrderReceiverName,
} from '@/lib/backstage/order-display'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { formatStoreAddress } from '@/lib/settings/store-helpers'
import type { BackstageUserOrderSummary } from '@/lib/backstage/users'

function formatMoney(amount: number, currency = 'UAH') {
  if (currency === 'UAH') return `${amount.toLocaleString('uk-UA')} ₴`
  return `${amount.toLocaleString('uk-UA')} ${currency}`
}

export function UserOrderCard({
  order,
  onStatusChange,
  onDelete,
}: {
  order: BackstageUserOrderSummary
  onStatusChange: (
    orderId: string,
    status: OrderStatus,
    options?: { cancellationReasonId?: string; cancellationNote?: string | null },
  ) => Promise<void>
  onDelete: (orderId: string) => Promise<void>
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status as OrderStatus)
  const [savingStatus, setSavingStatus] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const store = useStoreSettings()
  const { locale } = useBackstageUiLocale()
  const pickupAddress = formatStoreAddress(store)

  useEffect(() => {
    setStatus(order.status as OrderStatus)
  }, [order.status])

  const deliveryLines = formatOrderDeliveryLines(order, pickupAddress)

  const applyStatus = async (
    next: OrderStatus,
    options?: { cancellationReasonId?: string; cancellationNote?: string | null },
  ) => {
    setSavingStatus(true)
    try {
      await onStatusChange(order.id, next, options)
      setStatus(next)
      toast.success('Статус замовлення оновлено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося оновити статус.')
      setStatus(order.status as OrderStatus)
    } finally {
      setSavingStatus(false)
    }
  }

  const handleStatusSave = async () => {
    if (status === order.status) return
    if (status === 'CANCELLED') {
      setCancelOpen(true)
      return
    }
    await applyStatus(status)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(order.id)
      toast.success('Замовлення видалено.')
      setDeleteOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити замовлення.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-4 rounded-lg border border-border/80 bg-background/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <p className="text-base font-semibold">{order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(order.createdAt, locale, 'datetime')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">
              {formatMoney(order.totalAmount, order.currency)}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">{order.itemCount} шт.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={status} />
            <span className="text-sm text-muted-foreground">
              {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
            </span>
            {order.trackingNumber ? (
              <span className="text-sm font-medium">ТТН: {order.trackingNumber}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusSelect value={status} onValueChange={setStatus} disabled={savingStatus} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingStatus || status === order.status}
              onClick={() => void handleStatusSave()}
            >
              {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Зберегти статус'}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Видалити
            </Button>
          </div>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Отримувач
            </p>
            <p>{formatOrderReceiverName(order)}</p>
            <p className="text-muted-foreground">{order.receiverPhone}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Доставка
            </p>
            {deliveryLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        saving={savingStatus}
        onConfirm={({ cancellationReasonId, cancellationNote }) => {
          setCancelOpen(false)
          void applyStatus('CANCELLED', { cancellationReasonId, cancellationNote })
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити замовлення?</AlertDialogTitle>
            <AlertDialogDescription>
              Замовлення {order.orderNumber} буде видалено без можливості відновлення.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Видалити'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
