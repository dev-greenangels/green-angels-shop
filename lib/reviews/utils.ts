import type { ReviewListItem } from '@/lib/reviews/types'

export const MAX_REVIEW_IMAGES = 3

export function getReviewImages(review: Pick<ReviewListItem, 'image' | 'images'>): string[] {
  if (review.images?.length) return review.images
  return review.image ? [review.image] : []
}

export function formatReviewDate(value: string): string {
  return new Date(value).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatReviewDateTime(value: string): string {
  return new Date(value).toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
