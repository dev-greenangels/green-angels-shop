'use client'

import { cn } from '@/lib/utils'
import {
  formatCountryDisplay,
  type BackstageCountryLocale,
} from '@/lib/backstage/country-display'

type CountryDisplayProps = {
  code: string | null | undefined
  locale?: BackstageCountryLocale
  /** compact = table cells; normal = detail views */
  variant?: 'compact' | 'normal'
  className?: string
  emptyLabel?: string
}

export function CountryDisplay({
  code,
  locale = 'en',
  variant = 'normal',
  className,
  emptyLabel = '—',
}: CountryDisplayProps) {
  const formatted = formatCountryDisplay(code, locale)
  if (!formatted) {
    return <span className={cn('text-muted-foreground', className)}>{emptyLabel}</span>
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap',
        variant === 'compact' ? 'text-xs' : 'text-sm',
        className,
      )}
      title={formatted.label}
      aria-label={formatted.label}
    >
      {formatted.flag ? (
        <span aria-hidden className="leading-none">
          {formatted.flag}
        </span>
      ) : null}
      <span className="font-medium tracking-wide">{formatted.code}</span>
      <span className="text-muted-foreground">· {formatted.name}</span>
    </span>
  )
}
