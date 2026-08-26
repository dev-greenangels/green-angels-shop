'use client'

import { useEffect, useMemo, useState } from 'react'
import { de, enGB, hu, sk, uk } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { checkoutInputClassName } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  fetchAvailableDispatchDates,
  type DispatchAvailableDate,
} from '@/lib/dispatch-calendar'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import { cn } from '@/lib/utils'

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatShipDateLabel(iso: string, locale: string): string {
  return parseIsoDate(iso).toLocaleDateString(intlLocaleForApp(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function dateFnsLocaleForApp(locale: string): DateFnsLocale {
  switch (locale) {
    case 'en':
      return enGB
    case 'sk':
      return sk
    case 'de':
      return de
    case 'hu':
      return hu
    default:
      return uk
  }
}

export function CheckoutShipDateField({
  availableFromDates,
  value,
  onChange,
  enabled,
  compact = false,
  pickup = false,
  required = false,
  error = null,
  onBlur,
}: {
  availableFromDates: string[]
  value: string
  onChange: (iso: string) => void
  enabled: boolean
  /** Inline row: title + hint + calendar button */
  compact?: boolean
  /** Pickup: ready-for-collection wording instead of dispatch/carrier */
  pickup?: boolean
  required?: boolean
  error?: string | null
  onBlur?: () => void
}) {
  const t = useTranslations('checkout')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [dates, setDates] = useState<DispatchAvailableDate[]>([])
  const [loading, setLoading] = useState(false)

  const availableSet = useMemo(() => new Set(dates.map((d) => d.date)), [dates])
  const selectedDate = value && availableSet.has(value) ? parseIsoDate(value) : undefined
  const monthBounds = useMemo(() => {
    if (dates.length === 0) return null
    return {
      start: parseIsoDate(dates[0].date),
      end: parseIsoDate(dates[dates.length - 1].date),
    }
  }, [dates])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setLoading(true)
    void fetchAvailableDispatchDates({ availableFromDates })
      .then((res) => {
        if (cancelled) return
        setDates(res.dates)
        // Do not auto-select: user must pick. Clear stale value if no longer available.
        if (value && !res.dates.some((d) => d.date === value)) {
          onChange('')
        }
      })
      .catch(() => {
        if (!cancelled) setDates([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when cart availability changes
  }, [enabled, availableFromDates.join('|')])

  const selectLabel = pickup ? t('preferredShipDatePickupSelect') : t('preferredShipDateSelect')
  const widthProbes = useMemo(() => {
    const probes = new Set<string>([selectLabel])
    if (value) probes.add(formatShipDateLabel(value, locale))
    for (const d of dates) {
      probes.add(formatShipDateLabel(d.date, locale))
    }
    return [...probes]
  }, [dates, locale, selectLabel, value])

  if (!enabled) return null

  const title = pickup ? t('preferredShipDatePickup') : t('preferredShipDate')
  const hint = pickup
    ? t('preferredShipDatePickupHint')
    : t.has('preferredShipDateCarrierHint')
      ? t('preferredShipDateCarrierHint')
      : t('preferredShipDateHint')
  const emptyLabel = pickup ? t('preferredShipDatePickupEmpty') : t('preferredShipDateEmpty')
  const showError = Boolean(error)
  const displayLabel = selectedDate ? formatShipDateLabel(value, locale) : selectLabel

  const calendarButton = loading ? (
    <p className="text-sm text-muted-foreground">…</p>
  ) : dates.length === 0 ? (
    <p className="text-sm text-destructive">{emptyLabel}</p>
  ) : (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onBlur?.()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id="preferred-ship-date"
          aria-invalid={showError || undefined}
          aria-required={required || undefined}
          className={cn(
            checkoutInputClassName,
            'h-11 min-w-[11rem] justify-start gap-2.5 px-4 text-left font-normal shadow-sm',
            selectedDate
              ? 'border-2 border-primary/45 bg-primary/[0.08] text-foreground hover:bg-primary/[0.12]'
              : 'border-2 border-dashed border-primary/45 bg-primary/[0.05] font-medium text-foreground hover:border-primary/60 hover:bg-primary/[0.08]',
            open && !showError && 'border-primary ring-2 ring-primary/20',
            showError &&
              'border-destructive bg-destructive/[0.04] text-foreground ring-2 ring-destructive/20 focus-visible:ring-destructive/30',
          )}
        >
          <CalendarIcon
            className={cn(
              'size-4 shrink-0',
              selectedDate || open ? 'text-primary' : 'text-muted-foreground',
            )}
          />
          <span className="grid justify-items-start">
            {widthProbes.map((probe) => (
              <span
                key={probe}
                className="invisible col-start-1 row-start-1 whitespace-nowrap"
                aria-hidden
              >
                {probe}
              </span>
            ))}
            <span
              className={cn(
                'col-start-1 row-start-1 whitespace-nowrap',
                selectedDate && 'font-medium text-foreground',
              )}
            >
              {displayLabel}
            </span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-border/80 p-0 shadow-md" align="end">
        <Calendar
          mode="single"
          locale={dateFnsLocaleForApp(locale)}
          selected={selectedDate}
          defaultMonth={selectedDate ?? monthBounds?.start}
          startMonth={monthBounds?.start}
          endMonth={monthBounds?.end}
          onSelect={(date) => {
            if (!date) return
            const iso = toIsoDate(date)
            if (!availableSet.has(iso)) return
            onChange(iso)
            setOpen(false)
            onBlur?.()
          }}
          disabled={(date) => !availableSet.has(toIsoDate(date))}
          className="rounded-md [&_.rdp-day:not(.rdp-disabled)_button]:ring-1 [&_.rdp-day:not(.rdp-disabled)_button]:ring-primary/25 [&_.rdp-day:not(.rdp-disabled)_button]:hover:ring-primary/45"
        />
      </PopoverContent>
    </Popover>
  )

  const heading = (
    <div className={compact ? 'min-w-0 flex-1 space-y-0.5' : undefined}>
      <Label className="text-base font-medium" htmlFor="preferred-ship-date">
        {title}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <p className={cn('text-sm text-muted-foreground', !compact && 'mt-1')}>{hint}</p>
      <p
        className={cn(
          'text-sm text-destructive transition-opacity',
          showError ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!showError}
      >
        {error || '\u00a0'}
      </p>
    </div>
  )

  if (compact) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {heading}
        {calendarButton}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'space-y-3 rounded-xl border bg-card p-4 shadow-sm',
        showError ? 'border-destructive/60' : 'border-border/70',
      )}
    >
      {heading}
      {calendarButton}
    </div>
  )
}
