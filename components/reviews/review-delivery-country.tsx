import { cn } from '@/lib/utils'
import {
  countryCodeToFlagEmoji,
  normalizeCountryCode,
} from '@/lib/backstage/country-display'

type ReviewDeliveryCountryProps = {
  code: string | null | undefined
  className?: string
}

/**
 * Compact delivery-country badge for review cards: 🇸🇰 SK.
 * Renders nothing when code is missing/invalid (no invented fallback).
 */
export function ReviewDeliveryCountry({ code, className }: ReviewDeliveryCountryProps) {
  const normalized = normalizeCountryCode(code)
  if (!normalized) return null
  const flag = countryCodeToFlagEmoji(normalized)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground',
        className,
      )}
      title={normalized}
      aria-label={normalized}
    >
      {flag ? (
        <span aria-hidden className="leading-none">
          {flag}
        </span>
      ) : null}
      <span className="font-medium tracking-wide text-foreground/80">{normalized}</span>
    </span>
  )
}
