'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from '@/lib/backstage/order-status'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import {
  formatOrderDeliveryLines,
  formatOrderReceiverName,
} from '@/lib/backstage/order-display'
import { formatStoreAddress } from '@/lib/settings/store-helpers'
import type { BackstageUserOrderSummary } from '@/lib/backstage/users'
import { cn } from '@/lib/utils'

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
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>
  onDelete: (orderId: string) => Promise<void>
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status as OrderStatus)
  const [savingStatus, setSavingStatus] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const store = useStoreSettings()
  const pickupAddress = formatStoreAddress(store)

  const deliveryLines = formatOrderDeliveryLines(order, pickupAddress)

  const handleStatusSave = async () => {
    if (status === order.status) return
    setSavingStatus(true)
    try {
      await onStatusChange(order.id, status)
      toast.success('Статус замовлення оновлено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося оновити статус.')
      setStatus(order.status as OrderStatus)
    } finally {
      setSavingStatus(false)
    }
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
              {new Date(order.createdAt).toLocaleString('uk-UA')}
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
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                ORDER_STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {ORDER_STATUS_LABELS[status] ?? order.status}
            </span>
            <span className="text-sm text-muted-foreground">
              {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ORDER_STATUS_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Отримувач
          </p>
          <p className="font-medium">{formatOrderReceiverName(order)}</p>
          <p className="mt-1 text-muted-foreground">{order.receiverPhone}</p>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Доставка
          </p>
          {deliveryLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Товари
          </p>
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-background/60">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.productName}</p>
                  {item.variantLabel ? (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  ) : null}
                </div>
                <div className="text-right tabular-nums">
                  <p>
                    {item.quantity} × {formatMoney(item.priceAtPurchase, order.currency)}
                  </p>
                  <p className="font-medium">{formatMoney(item.lineTotal, order.currency)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити замовлення?</AlertDialogTitle>
            <AlertDialogDescription>
              Замовлення <span className="font-medium">{order.orderNumber}</span> буде повністю
              видалено з бази даних. Цю дію не можна скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? 'Видалення…' : 'Видалити назавжди'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
