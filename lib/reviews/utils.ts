import type { ReviewListItem } from '@/lib/reviews/types'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { toPublicMediaUrl } from '@/lib/media/public-url'

export const MAX_REVIEW_IMAGES = 3

export function getReviewImages(review: Pick<ReviewListItem, 'image' | 'images'>): string[] {
  if (review.images?.length) return review.images.map((url) => toPublicMediaUrl(url))
  return review.image ? [toPublicMediaUrl(review.image)] : []
}

export function formatReviewDate(value: string, locale: string = 'uk'): string {
  return formatDateTime(value, locale, 'dateLong')
}

export function formatReviewDateTime(value: string, locale: string = 'uk'): string {
  return formatDateTime(value, locale, 'datetimeLong')
}
