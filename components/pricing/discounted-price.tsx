'use client'

import { useFormatPerUnitPrice, useFormatPrice } from '@/lib/commerce/use-format-price'
import { useUnitSymbol } from '@/components/providers/commerce-provider'
import { cn } from '@/lib/utils'

type DiscountedPriceProps = {
  originalPrice: number
  salePrice: number
  className?: string
  originalClassName?: string
  saleClassName?: string
  /** `true` — «/од.» на обох цінах; `sale-only` — лише на акційній */
  perUnit?: boolean | 'sale-only'
  stacked?: boolean
  unitSymbol?: string | null
}

export function DiscountedUnitPrice({
  originalPrice,
  salePrice,
  className,
  originalClassName,
  saleClassName,
  perUnit = false,
  stacked = false,
  unitSymbol,
}: DiscountedPriceProps) {
  const formatPrice = useFormatPrice()
  const formatPerUnit = useFormatPerUnitPrice(unitSymbol)
  const defaultUnit = useUnitSymbol(unitSymbol)
  const hasDiscount = salePrice < originalPrice - 0.001
  const saleSuffix = perUnit ? `/${defaultUnit}` : ''
  const originalSuffix = perUnit === true ? `/${defaultUnit}` : ''

  if (!hasDiscount) {
    return (
      <span suppressHydrationWarning className={className}>
        {perUnit ? formatPerUnit(salePrice) : formatPrice(salePrice)}
        {!perUnit ? saleSuffix : null}
      </span>
    )
  }

  return (
    <span
      className={cn(
        stacked || perUnit === true
          ? 'inline-flex flex-col items-end gap-0.5'
          : 'inline-flex flex-wrap items-baseline gap-x-1',
        className,
      )}
    >
      <span
        suppressHydrationWarning
        className={cn('line-through text-muted-foreground', originalClassName)}
      >
        {perUnit === true ? formatPerUnit(originalPrice) : formatPrice(originalPrice)}
        {perUnit === true ? null : originalSuffix}
      </span>
      <span suppressHydrationWarning className={cn('font-medium text-red-500 dark:text-red-400', saleClassName)}>
        {perUnit ? formatPerUnit(salePrice) : formatPrice(salePrice)}
        {!perUnit ? saleSuffix : null}
      </span>
    </span>
  )
}

export function DiscountedLineTotal({
  originalTotal,
  saleTotal,
  className,
  originalClassName,
  saleClassName,
}: {
  originalTotal: number
  saleTotal: number
  className?: string
  originalClassName?: string
  saleClassName?: string
}) {
  const formatPrice = useFormatPrice()
  const hasDiscount = saleTotal < originalTotal - 0.001

  if (!hasDiscount) {
    return (
      <span suppressHydrationWarning className={className}>
        {formatPrice(saleTotal)}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex flex-col items-end gap-0.5', className)}>
      <span
        suppressHydrationWarning
        className={cn('text-xs line-through text-muted-foreground', originalClassName)}
      >
        {formatPrice(originalTotal)}
      </span>
      <span suppressHydrationWarning className={cn('font-semibold text-foreground', saleClassName)}>
        {formatPrice(saleTotal)}
      </span>
    </span>
  )
}
