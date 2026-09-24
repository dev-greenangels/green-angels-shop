'use client'

import { Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

export function CheckoutShippingLeadNotice({
  text,
  className,
  compact,
}: {
  text: string
  className?: string
  compact?: boolean
}) {
  const t = useTranslations('checkout')
  const trimmed = text.trim()
  if (!trimmed) return null

  return (
    <div
      role="note"
      aria-label={t('shippingLeadNoticeLabel')}
      className={cn(
        'flex gap-3 rounded-xl border border-primary/25 bg-primary/5 text-sm text-foreground',
        compact ? 'px-3 py-2.5' : 'px-4 py-3',
        className,
      )}
    >
      <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className="min-w-0 leading-snug">{trimmed}</p>
    </div>
  )
}
