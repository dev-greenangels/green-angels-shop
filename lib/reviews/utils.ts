import type { ReviewListItem } from '@/lib/reviews/types'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import {
  businessTimeZoneForMarket,
  type MarketRegion,
} from '@/lib/settings/market'
import { toPublicMediaUrl } from '@/lib/media/public-url'

export const MAX_REVIEW_IMAGES = 3

export function getReviewImages(review: Pick<ReviewListItem, 'image' | 'images'>): string[] {
  if (review.images?.length) return review.images.map((url) => toPublicMediaUrl(url))
  return review.image ? [toPublicMediaUrl(review.image)] : []
}

function parseReviewInstant(value: string): Date | null {
  if (!value?.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Public storefront review date (date only). Uses deploy business TZ so SSR and
 * the first client render match — not browser-local, not UTC calendar-date.
 */
export function formatReviewDate(
  value: string,
  locale: string = 'uk',
  marketRegion: MarketRegion = 'ua',
): string {
  const date = parseReviewInstant(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(intlLocaleForApp(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: businessTimeZoneForMarket(marketRegion),
  }).format(date)
}

/** Same business-TZ rules when a review UI intentionally shows date + time. */
export function formatReviewDateTime(
  value: string,
  locale: string = 'uk',
  marketRegion: MarketRegion = 'ua',
): string {
  const date = parseReviewInstant(value)
  if (!date) return ''
  return new Intl.DateTimeFormat(intlLocaleForApp(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: businessTimeZoneForMarket(marketRegion),
  }).format(date)
}
