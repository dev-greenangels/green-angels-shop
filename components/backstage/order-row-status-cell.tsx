'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'

import { CancelOrderDialog } from '@/components/backstage/cancel-order-dialog'
import { OrderStatusSelect } from '@/components/backstage/order-status-select'
import type { OrderStatus } from '@/lib/backstage/order-status'
import {
  patchBackstageOrderStatus,
  type BackstageOrderListItem,
} from '@/lib/backstage/orders'

export function OrderRowStatusCell({
  order,
  onUpdated,
}: {
  order: BackstageOrderListItem
  onUpdated: (order: BackstageOrderListItem) => void
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [saving, setSaving] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    setStatus(order.status)
  }, [order.status])

  const applyStatus = async (
    next: OrderStatus,
    options?: { cancellationReasonId?: string; cancellationNote?: string | null },
  ) => {
    const previous = order.status
    setStatus(next)
    setSaving(true)
    try {
      const updated = await patchBackstageOrderStatus(order.id, next, options)
      onUpdated(updated)
      toast.success(`Статус ${order.orderNumber} оновлено.`)
    } catch (err) {
      setStatus(previous)
      toast.error(err instanceof Error ? err.message : 'Не вдалося змінити статус.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (next: OrderStatus) => {
    if (next === order.status) return
    if (next === 'CANCELLED') {
      setCancelOpen(true)
      return
    }
    void applyStatus(next)
  }

  return (
    <>
      <OrderStatusSelect
        value={status}
        onValueChange={handleChange}
        saving={saving}
      />
      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        saving={saving}
        onConfirm={({ cancellationReasonId, cancellationNote }) => {
          setCancelOpen(false)
          void applyStatus('CANCELLED', { cancellationReasonId, cancellationNote })
        }}
      />
    </>
  )
}
