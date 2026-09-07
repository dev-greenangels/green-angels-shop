'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { useVatDisplayPolicy } from '@/components/providers/vat-display-provider'
import {
  useFormatPrice,
  useShelfPriceParts,
  type FormatPriceMode,
} from '@/lib/commerce/use-format-price'
import { cn } from '@/lib/utils'

/** Secondary “без ПДВ: …” line — CSS size only (no layout measurement). */
export function ExVatSecondaryLine({
  amountFormatted,
  className,
}: {
  amountFormatted: string
  className?: string
}) {
  const t = useTranslations('price')

  return (
    <span
      suppressHydrationWarning
      className={cn(
        'block max-w-full truncate text-[0.72em] font-normal leading-none text-muted-foreground',
        className,
      )}
    >
      {t('exclVatColon', { amount: amountFormatted })}
    </span>
  )
}

type ShelfPriceBlockProps = {
  /** Stored catalog amount (shelf conversion applied inside). */
  amount: number
  /** Optional range max (stored). */
  amountMax?: number
  /** Strikethrough original (stored), single-price discount. */
  originalAmount?: number
  label?: 'price' | 'from' | 'none'
  mode?: FormatPriceMode
  className?: string
  primaryClassName?: string
  align?: 'start' | 'end'
  /** Show excl-VAT secondary when market enables it. */
  showVatHint?: boolean
}

/**
 * Card / PDP shelf price:
 * - one size: «Ціна 3,00 ₴» + «без ПДВ: …»
 * - several: «від 3,00 ₴» (+ «— 5,00 ₴») + excl-VAT line
 */
export function ShelfPriceBlock({
  amount,
  amountMax,
  originalAmount,
  label = 'price',
  mode = 'shelf',
  className,
  primaryClassName,
  align = 'start',
  showVatHint = true,
}: ShelfPriceBlockProps) {
  const tPrice = useTranslations('price')
  const tProduct = useTranslations('product')
  const vat = useVatDisplayPolicy()
  const formatPrice = useFormatPrice(mode)
  const shelfParts = useShelfPriceParts()

  const primaryParts = shelfParts(amount)
  const maxParts = amountMax != null && Math.abs(amountMax - amount) > 0.001 ? shelfParts(amountMax) : null
  const hasDiscount =
    originalAmount != null && originalAmount > amount + 0.001

  const showSecondary =
    showVatHint &&
    mode === 'shelf' &&
    vat.storefrontShowExVatSecondary &&
    Boolean(primaryParts.secondaryFormatted)

  const labelText =
    label === 'price' ? tPrice('label') : label === 'from' ? tProduct('from') : null

  return (
    <span
      className={cn(
        'inline-flex flex-col gap-0.5',
        align === 'end' ? 'items-end text-right' : 'items-start text-left',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex flex-wrap items-baseline gap-x-1 gap-y-0.5 whitespace-nowrap',
          primaryClassName,
        )}
      >
        {labelText ? (
          <span className="font-normal text-muted-foreground">{labelText}</span>
        ) : null}
        {hasDiscount ? (
          <span
            suppressHydrationWarning
            className="text-[0.85em] line-through text-muted-foreground"
          >
            {formatPrice(originalAmount!)}
          </span>
        ) : null}
        <span
          suppressHydrationWarning
          className={cn(
            'font-semibold tabular-nums',
            hasDiscount ? 'text-red-500 dark:text-red-400' : 'text-foreground',
          )}
        >
          {primaryParts.primaryFormatted}
        </span>
        {maxParts ? (
          <>
            <span className="text-muted-foreground/60" aria-hidden>
              —
            </span>
            <span suppressHydrationWarning className="font-semibold tabular-nums text-foreground">
              {maxParts.primaryFormatted}
            </span>
          </>
        ) : null}
      </span>
      {showSecondary && primaryParts.secondaryFormatted ? (
        <ExVatSecondaryLine
          amountFormatted={
            maxParts?.secondaryFormatted
              ? `${primaryParts.secondaryFormatted} — ${maxParts.secondaryFormatted}`
              : primaryParts.secondaryFormatted
          }
        />
      ) : null}
    </span>
  )
}

/** Compact excl-VAT under an existing price node (variants table). */
export function PriceWithExVatUnder({
  children,
  storedAmount,
  className,
  align = 'start',
  mode = 'shelf',
  showVatHint = true,
}: {
  children: ReactNode
  storedAmount: number
  className?: string
  align?: 'start' | 'end'
  mode?: FormatPriceMode
  showVatHint?: boolean
}) {
  const vat = useVatDisplayPolicy()
  const shelfParts = useShelfPriceParts()
  const parts = shelfParts(storedAmount)
  const show =
    showVatHint &&
    mode === 'shelf' &&
    vat.storefrontShowExVatSecondary &&
    Boolean(parts.secondaryFormatted)

  return (
    <span
      className={cn(
        'inline-flex flex-col gap-0.5 leading-none',
        align === 'end' ? 'items-end' : 'items-start',
        className,
      )}
    >
      <span className="inline-flex leading-none">{children}</span>
      {show && parts.secondaryFormatted ? (
        <ExVatSecondaryLine amountFormatted={parts.secondaryFormatted} />
      ) : null}
    </span>
  )
}
