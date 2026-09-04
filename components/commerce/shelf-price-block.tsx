'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { useVatDisplayPolicy } from '@/components/providers/vat-display-provider'
import {
  useFormatPrice,
  useShelfPriceParts,
  type FormatPriceMode,
} from '@/lib/commerce/use-format-price'
import { cn } from '@/lib/utils'

/** Secondary “без ПДВ: …” line scaled to match primary line width. */
export function ExVatSecondaryLine({
  amountFormatted,
  primaryWidthPx,
  className,
}: {
  amountFormatted: string
  /** Target width in px (primary line). When 0, renders at ~0.72em. */
  primaryWidthPx: number
  className?: string
}) {
  const t = useTranslations('price')
  const measureRef = useRef<HTMLSpanElement>(null)
  const [fontSizePx, setFontSizePx] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el || primaryWidthPx <= 0) {
      setFontSizePx(null)
      return
    }
    // Measure at a known font-size, then scale to match primary width.
    const probeSize = 12
    el.style.fontSize = `${probeSize}px`
    const natural = el.getBoundingClientRect().width
    if (natural <= 0) {
      setFontSizePx(null)
      return
    }
    setFontSizePx(Math.max(8, Math.min(probeSize, (primaryWidthPx / natural) * probeSize)))
  }, [amountFormatted, primaryWidthPx])

  return (
    <span
      ref={measureRef}
      suppressHydrationWarning
      className={cn(
        'block whitespace-nowrap font-normal leading-none text-muted-foreground',
        className,
      )}
      style={{ fontSize: fontSizePx != null ? `${fontSizePx}px` : '0.72em' }}
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
 * - one size: «Ціна 3,00 ₴» + matched-width «без ПДВ: …»
 * - several: «від 3,00 ₴» (+ «— 5,00 ₴») + matched excl-VAT line
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
  const primaryRef = useRef<HTMLSpanElement>(null)
  const [primaryWidth, setPrimaryWidth] = useState(0)

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

  useLayoutEffect(() => {
    const el = primaryRef.current
    if (!el) return
    const measure = () => setPrimaryWidth(el.getBoundingClientRect().width)
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [
    amount,
    amountMax,
    originalAmount,
    label,
    primaryParts.primaryFormatted,
    maxParts?.primaryFormatted,
    hasDiscount,
  ])

  return (
    <span
      className={cn(
        'inline-flex flex-col gap-0.5',
        align === 'end' ? 'items-end text-right' : 'items-start text-left',
        className,
      )}
    >
      <span
        ref={primaryRef}
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
          primaryWidthPx={primaryWidth}
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
  const primaryRef = useRef<HTMLSpanElement>(null)
  const [primaryWidth, setPrimaryWidth] = useState(0)
  const parts = shelfParts(storedAmount)
  const show =
    showVatHint &&
    mode === 'shelf' &&
    vat.storefrontShowExVatSecondary &&
    Boolean(parts.secondaryFormatted)

  useLayoutEffect(() => {
    const el = primaryRef.current
    if (!el) return
    const measure = () => setPrimaryWidth(el.getBoundingClientRect().width)
    measure()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [storedAmount, parts.primaryFormatted, parts.secondaryFormatted])

  return (
    <span
      className={cn(
        'inline-flex flex-col gap-0.5 leading-none',
        align === 'end' ? 'items-end' : 'items-start',
        className,
      )}
    >
      <span ref={primaryRef} className="inline-flex leading-none">
        {children}
      </span>
      {show && parts.secondaryFormatted ? (
        <ExVatSecondaryLine
          amountFormatted={parts.secondaryFormatted}
          primaryWidthPx={primaryWidth}
        />
      ) : null}
    </span>
  )
}
