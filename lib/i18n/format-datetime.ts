import { intlLocaleForApp } from '@/lib/i18n/intl-locale'

export type DateTimeFormatStyle = 'date' | 'dateLong' | 'datetime' | 'datetimeLong' | 'datetimeSeconds'

const STYLE_OPTIONS: Record<DateTimeFormatStyle, Intl.DateTimeFormatOptions> = {
  date: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  dateLong: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },
  datetime: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  datetimeLong: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  datetimeSeconds: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
}

/**
 * Format an ISO / Date value for humans in the viewer's local timezone.
 * Returns empty string for invalid / empty input (use formatDateTimeOrDash for «—»).
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale: string = 'uk',
  style: DateTimeFormatStyle = 'datetime',
): string {
  if (value == null || value === '') return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(intlLocaleForApp(locale), STYLE_OPTIONS[style]).format(date)
}

export function formatDateTimeOrDash(
  value: string | Date | null | undefined,
  locale: string = 'uk',
  style: DateTimeFormatStyle = 'datetime',
): string {
  return formatDateTime(value, locale, style) || '—'
}
