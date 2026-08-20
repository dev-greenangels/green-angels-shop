'use client'

import { useTranslations } from 'next-intl'

import { useFormatPrice } from '@/lib/commerce/use-format-price'
import type { BelowMinOrderBehavior } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type MinOrderMessageInput = {
  belowMinOrder?: boolean
  canPlaceOrder?: boolean
  minOrderAmount?: number | null
  belowMinOrderBehavior?: BelowMinOrderBehavior | null
  belowMinPackagingFee?: number | null
}

export function formatMinOrderCheckoutMessage(
  t: (key: string, values?: Record<string, string>) => string,
  formatMoney: (amount: number) => string,
  input: MinOrderMessageInput,
): string | null {
  if (!input.belowMinOrder || input.minOrderAmount == null || input.minOrderAmount <= 0) {
    return null
  }

  const amount = formatMoney(input.minOrderAmount)
  const behavior = input.belowMinOrderBehavior ?? 'reject'

  if (behavior === 'reject' || input.canPlaceOrder === false) {
    return t('blocked', { amount })
  }

  if (behavior === 'add_packaging_fee') {
    const feeAmount = input.belowMinPackagingFee ?? 0
    if (feeAmount > 0) {
      return t('feeApplied', { amount, fee: formatMoney(feeAmount) })
    }
  }

  return t('hintReject', { amount })
}

export function MinOrderInfoBanner({
  minOrderAmount,
  belowMinOrderBehavior,
  belowMinPackagingFee,
  className,
  compact = false,
}: {
  minOrderAmount: number | null | undefined
  belowMinOrderBehavior?: BelowMinOrderBehavior | null
  belowMinPackagingFee?: number | null
  className?: string
  compact?: boolean
}) {
  const t = useTranslations('cart.minOrder')
  const formatMoney = useFormatPrice('shelf')

  if (minOrderAmount == null || minOrderAmount <= 0) return null

  const amount = formatMoney(minOrderAmount)
  const behavior = belowMinOrderBehavior ?? 'reject'
  const fee =
    behavior === 'add_packaging_fee' && (belowMinPackagingFee ?? 0) > 0
      ? formatMoney(belowMinPackagingFee!)
      : null

  const text =
    behavior === 'add_packaging_fee' && fee
      ? t('hintFee', { amount, fee })
      : t('hintReject', { amount })

  return (
    <p
      role="note"
      className={cn(
        'rounded-md border border-amber-200/80 bg-amber-50 text-amber-950',
        compact ? 'px-2.5 py-1.5 text-xs leading-snug' : 'px-3 py-2 text-sm leading-snug',
        className,
      )}
    >
      {text}
    </p>
  )
}

/** Повідомлення, коли кошик нижче мінімуму (reject або підказка про доплату). */
export function useMinOrderCheckoutMessage(input: MinOrderMessageInput): string | null {
  const t = useTranslations('cart.minOrder')
  const formatMoney = useFormatPrice('shelf')
  return formatMinOrderCheckoutMessage(t, formatMoney, input)
}
