'use client'

import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function formatNum(value: number): string {
  if (!Number.isFinite(value)) return ''
  return String(value)
}

function parseNum(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.')
  if (!cleaned || cleaned === '.' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

type NumberInputProps = {
  id?: string
  value: number
  min?: number
  step?: number | string
  disabled?: boolean
  className?: string
  /** Shown inside the field on the right (e.g. €, kg). Not NET/GROSS — use a sibling badge. */
  suffix?: string
  onCommit: (next: number) => void
}

/**
 * Decimal-friendly Backoffice number field.
 * Uses text + inputMode=decimal (no scroll-wheel value changes).
 * Keeps draft text while typing (empty / "1." / comma).
 */
export function NumberInput({
  id,
  value,
  min = 0,
  step = 0.01,
  disabled,
  className,
  suffix,
  onCommit,
}: NumberInputProps) {
  const [draft, setDraft] = useState(formatNum(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(formatNum(value))
  }, [value, focused])

  return (
    <div className={cn('relative', className)}>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={draft}
        className={cn('h-9 tabular-nums', suffix ? 'pr-10' : undefined)}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const raw = e.target.value
          if (raw !== '' && !/^-?\d*[.,]?\d*$/.test(raw)) return
          setDraft(raw)
          const parsed = parseNum(raw)
          if (parsed != null && parsed >= min) onCommit(parsed)
        }}
        onBlur={() => {
          setFocused(false)
          const parsed = parseNum(draft)
          const next = parsed != null && parsed >= min ? parsed : min
          onCommit(next)
          setDraft(formatNum(next))
        }}
        // step is informational for a11y; parsing is free-form decimal
        data-step={step}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

/** Small badge next to monetary inputs showing admin price basis. */
export function PriceBasisBadge({ areNet }: { areNet: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide',
        areNet
          ? 'border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
          : 'border-amber-600/30 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100',
      )}
    >
      {areNet ? 'NET' : 'GROSS'}
    </span>
  )
}
