'use client'

import {
  Building2,
  CreditCard,
  HandCoins,
  Landmark,
  Store,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import { PAYMENT_METHOD_LABELS } from '@/lib/backstage/order-status'
import { cn } from '@/lib/utils'

type PaymentMethodVisual = {
  Icon: LucideIcon
  label: string
  /** Short badge under/beside icon for near-duplicate methods. */
  badge?: string
}

const PAYMENT_METHOD_VISUALS: Record<string, PaymentMethodVisual> = {
  'card-online': {
    Icon: CreditCard,
    label: PAYMENT_METHOD_LABELS['card-online'],
  },
  'bank-transfer': {
    Icon: Landmark,
    label: PAYMENT_METHOD_LABELS['bank-transfer'],
    badge: 'ФОП',
  },
  'bank-transfer-legal': {
    Icon: Building2,
    label: PAYMENT_METHOD_LABELS['bank-transfer-legal'],
    badge: 'ЮР',
  },
  dobierka: {
    Icon: HandCoins,
    label: PAYMENT_METHOD_LABELS.dobierka,
  },
  'pay-on-pickup': {
    Icon: Store,
    label: PAYMENT_METHOD_LABELS['pay-on-pickup'],
  },
}

type OrderPaymentMethodIconProps = {
  method: string | null | undefined
  className?: string
}

export function OrderPaymentMethodIcon({ method, className }: OrderPaymentMethodIconProps) {
  const key = method?.trim() ?? ''
  if (!key) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>
  }

  const visual = PAYMENT_METHOD_VISUALS[key]
  const label = visual?.label ?? PAYMENT_METHOD_LABELS[key] ?? key
  const Icon = visual?.Icon ?? Wallet

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-muted-foreground',
        className,
      )}
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {visual?.badge ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {visual.badge}
        </span>
      ) : null}
    </span>
  )
}
