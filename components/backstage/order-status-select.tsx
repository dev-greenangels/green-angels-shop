'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  orderStatusBadgeClass,
  orderStatusLabel,
  type OrderStatus,
} from '@/lib/backstage/order-status'
import {
  fetchOrderStatuses,
  type OrderStatusDefinition,
} from '@/lib/backstage/order-statuses'
import { cn } from '@/lib/utils'

export function OrderStatusBadge({
  status,
  label,
  color,
  className,
}: {
  status: OrderStatus
  label?: string | null
  color?: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        orderStatusBadgeClass(status, color),
        className,
      )}
    >
      {orderStatusLabel(status, label)}
    </span>
  )
}

type OrderStatusSelectProps = {
  value: OrderStatus
  onValueChange: (value: OrderStatus) => void
  statuses?: OrderStatusDefinition[]
  disabled?: boolean
  saving?: boolean
  className?: string
  triggerClassName?: string
}

export function OrderStatusSelect({
  value,
  onValueChange,
  statuses: statusesProp,
  disabled,
  saving,
  className,
  triggerClassName,
}: OrderStatusSelectProps) {
  const [loaded, setLoaded] = useState<OrderStatusDefinition[] | null>(null)

  useEffect(() => {
    if (statusesProp) return
    let cancelled = false
    void fetchOrderStatuses(true)
      .then((rows) => {
        if (!cancelled) setLoaded(rows)
      })
      .catch(() => {
        if (!cancelled) setLoaded([])
      })
    return () => {
      cancelled = true
    }
  }, [statusesProp])

  const statuses = statusesProp ?? loaded ?? []
  const current = statuses.find((row) => row.code === value)

  return (
    <div className={cn('relative inline-flex', className)}>
      <Select
        value={value}
        onValueChange={(next) => onValueChange(next)}
        disabled={disabled || saving || (!statusesProp && loaded === null)}
      >
        <SelectTrigger
          className={cn(
            'h-auto min-w-[8.75rem] gap-1 rounded-full border-0 px-2.5 py-1 text-xs font-medium shadow-none transition-opacity hover:opacity-90 focus:ring-2 focus:ring-ring focus:ring-offset-1 data-[size=default]:h-auto',
            orderStatusBadgeClass(value, current?.color),
            triggerClassName,
          )}
        >
          <SelectValue>
            {orderStatusLabel(value, current?.nameUk)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-[80] min-w-[10rem]">
          {statuses.map((row) => (
            <SelectItem key={row.code} value={row.code} className="py-2">
              <OrderStatusBadge status={row.code} label={row.nameUk} color={row.color} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving ? (
        <Loader2 className="pointer-events-none absolute -right-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  )
}
