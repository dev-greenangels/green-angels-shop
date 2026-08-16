'use client'

import type { ComponentPropsWithoutRef } from 'react'

import {
  useFormatPerUnitPrice,
  useFormatPrice,
  type FormatPriceMode,
} from '@/lib/commerce/use-format-price'

type FormattedPriceProps = ComponentPropsWithoutRef<'span'> & {
  amount: number
  perUnit?: boolean
  unitSymbol?: string | null
  /**
   * `shelf` — convert DB price using market VAT display policy (catalog/PDP).
   * `raw` — format as-is (checkout totals, order grand totals already final).
   */
  mode?: FormatPriceMode
}

/** SSR-safe money display — Intl output can differ between Node and the browser. */
export function FormattedPrice({
  amount,
  perUnit = false,
  unitSymbol,
  mode = 'shelf',
  className,
  ...props
}: FormattedPriceProps) {
  const formatPrice = useFormatPrice(mode)
  const formatPerUnit = useFormatPerUnitPrice(unitSymbol, mode)

  return (
    <span suppressHydrationWarning className={className} {...props}>
      {perUnit ? formatPerUnit(amount) : formatPrice(amount)}
    </span>
  )
}
