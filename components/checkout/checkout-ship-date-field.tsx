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
}: {
  availableFromDates: string[]
  value: string
  onChange: (iso: string) => void
  enabled: boolean
  /** Inline row: title + hint + calendar button */
  compact?: boolean
  /** Pickup: ready-for-collection wording instead of dispatch/carrier */
  pickup?: boolean
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
        if (!value && res.dates[0]?.date) {
          onChange(res.dates[0].date)
        } else if (value && !res.dates.some((d) => d.date === value) && res.dates[0]?.date) {
          onChange(res.dates[0].date)
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

  if (!enabled) return null

  const title = pickup ? t('preferredShipDatePickup') : t('preferredShipDate')
  const hint = pickup
    ? t('preferredShipDatePickupHint')
    : t.has('preferredShipDateCarrierHint')
      ? t('preferredShipDateCarrierHint')
      : t('preferredShipDateHint')
  const emptyLabel = pickup ? t('preferredShipDatePickupEmpty') : t('preferredShipDateEmpty')
  const selectLabel = pickup ? t('preferredShipDatePickupSelect') : t('preferredShipDateSelect')

  const calendarButton = loading ? (
    <p className="text-sm text-muted-foreground">…</p>
  ) : dates.length === 0 ? (
    <p className="text-sm text-destructive">{emptyLabel}</p>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          id="preferred-ship-date"
          className={cn(
            checkoutInputClassName,
            'h-11 shrink-0 justify-start gap-2 px-3 font-normal shadow-sm',
            compact ? 'min-w-[12rem] max-w-[18rem]' : 'w-full',
            !selectedDate && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-primary" />
          <span className="truncate">
            {selectedDate ? formatShipDateLabel(value, locale) : selectLabel}
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
          }}
          disabled={(date) => !availableSet.has(toIsoDate(date))}
          className="rounded-md"
        />
      </PopoverContent>
    </Popover>
  )

  if (compact) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1 space-y-0.5">
          <Label className="text-base font-medium">{title}</Label>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
        {calendarButton}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div>
        <Label className="text-base font-medium">{title}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      {calendarButton}
    </div>
  )
}
