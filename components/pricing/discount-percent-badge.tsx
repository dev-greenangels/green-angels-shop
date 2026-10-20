'use client'

import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import type { PlantDiscountBadge } from '@/lib/product-pricing'
import { cn } from '@/lib/utils'

type DiscountPercentBadgeProps = {
  badge: PlantDiscountBadge
  className?: string
}

/** Storefront sale chip: `−10%` or localized `до −10%` when multi-tier / qty>1. */
export function DiscountPercentBadge({ badge, className }: DiscountPercentBadgeProps) {
  const t = useTranslations('product')
  const label = badge.upTo
    ? t('discountBadgeUpTo', { percent: badge.percent })
    : t('discountBadge', { percent: badge.percent })

  return (
    <Badge variant="destructive" className={cn('rounded-[2px] px-1 py-0 text-[10px] shadow-sm', className)}>
      {label}
    </Badge>
  )
}
