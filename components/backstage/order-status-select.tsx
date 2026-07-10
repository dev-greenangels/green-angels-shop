'use client'

import { Loader2 } from 'lucide-react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type OrderStatus,
} from '@/lib/backstage/order-status'
import { cn } from '@/lib/utils'

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        ORDER_STATUS_COLORS[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}

type OrderStatusSelectProps = {
  value: OrderStatus
  onValueChange: (value: OrderStatus) => void
  disabled?: boolean
  saving?: boolean
  className?: string
  triggerClassName?: string
}

export function OrderStatusSelect({
  value,
  onValueChange,
  disabled,
  saving,
  className,
  triggerClassName,
}: OrderStatusSelectProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      <Select
        value={value}
        onValueChange={(next) => onValueChange(next as OrderStatus)}
        disabled={disabled || saving}
      >
        <SelectTrigger
          className={cn(
            'h-auto min-w-[8.75rem] gap-1 rounded-full border-0 px-2.5 py-1 text-xs font-medium shadow-none transition-opacity hover:opacity-90 focus:ring-2 focus:ring-ring focus:ring-offset-1 data-[size=default]:h-auto',
            ORDER_STATUS_COLORS[value],
            triggerClassName,
          )}
        >
          <SelectValue>{ORDER_STATUS_LABELS[value]}</SelectValue>
        </SelectTrigger>
        <SelectContent className="z-[80] min-w-[10rem]">
          {ORDER_STATUSES.map((status) => (
            <SelectItem key={status} value={status} className="py-2">
              <OrderStatusBadge status={status} />
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
