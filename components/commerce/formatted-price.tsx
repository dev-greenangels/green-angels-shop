'use client'

import type { ComponentPropsWithoutRef } from 'react'

import { useFormatPerUnitPrice, useFormatPrice } from '@/lib/commerce/use-format-price'

type FormattedPriceProps = ComponentPropsWithoutRef<'span'> & {
  amount: number
  perUnit?: boolean
  unitSymbol?: string | null
}

/** SSR-safe money display — Intl output can differ between Node and the browser. */
export function FormattedPrice({
  amount,
  perUnit = false,
  unitSymbol,
  className,
  ...props
}: FormattedPriceProps) {
  const formatPrice = useFormatPrice()
  const formatPerUnit = useFormatPerUnitPrice(unitSymbol)

  return (
    <span suppressHydrationWarning className={className} {...props}>
      {perUnit ? formatPerUnit(amount) : formatPrice(amount)}
    </span>
  )
}
