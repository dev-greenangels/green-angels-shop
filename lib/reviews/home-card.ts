import type { ReviewDisplayGroup } from '@/lib/reviews/group'
import type { ReviewListItem } from '@/lib/reviews/types'
import { getReviewImageThumbs } from '@/lib/reviews/utils'

export type HomeReviewCardModel = {
  key: string
  authorName: string
  createdAt: string
  rating: number
  quote: string | null
  verificationType: ReviewListItem['verificationType']
  deliveryCountryCode: string | null
  plants: Array<{ name: string; slug: string | null; sizeLabels: string[] }>
  plantsOverflow: number
  coverImage: string | null
}

function trimText(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Quote priority: store text → first product text → null (rating-only). */
export function pickSubmissionQuote(group: ReviewDisplayGroup): string | null {
  if (group.kind === 'single') return trimText(group.review.text)

  const storeText = group.store ? trimText(group.store.text) : null
  if (storeText) return storeText

  for (const product of group.products) {
    const text = trimText(product.text)
    if (text) return text
  }
  return null
}

export function pickSubmissionRating(group: ReviewDisplayGroup): number {
  if (group.kind === 'single') return group.review.rating
  if (group.store) return group.store.rating
  const ratings = group.products.map((p) => p.rating)
  return ratings.length ? Math.max(...ratings) : group.primary.rating
}

export function pickSubmissionPlants(
  group: ReviewDisplayGroup,
  limit = 2,
): {
  plants: Array<{ name: string; slug: string | null; sizeLabels: string[] }>
  overflow: number
} {
  const products =
    group.kind === 'single'
      ? group.review.productId
        ? [group.review]
        : []
      : group.products

  const named = products
    .map((row) => ({
      name: row.productName?.trim() || '',
      slug: row.productSlug ?? null,
      sizeLabels: (row.purchasedVariantLabels ?? [])
        .map((label) => label.trim())
        .filter(Boolean),
    }))
    .filter((row) => row.name)

  return {
    plants: named.slice(0, limit),
    overflow: Math.max(0, named.length - limit),
  }
}

function pickCoverImage(group: ReviewDisplayGroup): string | null {
  const rows =
    group.kind === 'single'
      ? [group.review]
      : [group.store, ...group.products].filter((row): row is ReviewListItem => Boolean(row))

  for (const row of rows) {
    const images = getReviewImageThumbs(row)
    if (images[0]) return images[0]
  }
  return null
}

function pickDeliveryCountryCode(group: ReviewDisplayGroup): string | null {
  const rows =
    group.kind === 'single'
      ? [group.review]
      : [group.primary, group.store, ...group.products].filter(
          (row): row is ReviewListItem => Boolean(row),
        )
  for (const row of rows) {
    const code = row.deliveryCountryCode?.trim()
    if (code) return code
  }
  return null
}

export function toHomeReviewCardModel(group: ReviewDisplayGroup): HomeReviewCardModel {
  const primary = group.kind === 'single' ? group.review : group.primary
  // Show up to 3 plants: a lone "+1" would cost the same vertical space as the plant row.
  const { plants, overflow } = pickSubmissionPlants(group, 3)
  return {
    key: group.kind === 'single' ? group.review.id : group.groupId,
    authorName: primary.authorName,
    createdAt: primary.createdAt,
    rating: pickSubmissionRating(group),
    quote: pickSubmissionQuote(group),
    verificationType: primary.verificationType,
    deliveryCountryCode: pickDeliveryCountryCode(group),
    plants,
    plantsOverflow: overflow,
    coverImage: pickCoverImage(group),
  }
}
