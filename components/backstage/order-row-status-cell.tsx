'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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

  useEffect(() => {
    setStatus(order.status)
  }, [order.status])

  const handleChange = async (next: OrderStatus) => {
    if (next === order.status) return

    const previous = order.status
    setStatus(next)
    setSaving(true)

    try {
      const updated = await patchBackstageOrderStatus(order.id, next)
      onUpdated(updated)
      toast.success(`Статус ${order.orderNumber} оновлено.`)
    } catch (err) {
      setStatus(previous)
      toast.error(err instanceof Error ? err.message : 'Не вдалося змінити статус.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <OrderStatusSelect
      value={status}
      onValueChange={(value) => void handleChange(value)}
      saving={saving}
    />
  )
}
