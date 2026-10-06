import type { ReviewListItem } from '@/lib/reviews/types'

export type ReviewDisplayGroup =
  | { kind: 'single'; review: ReviewListItem }
  | {
      kind: 'order'
      groupId: string
      store: ReviewListItem | null
      products: ReviewListItem[]
      /** Representative row for author / date / verification chrome. */
      primary: ReviewListItem
    }

function groupKey(review: ReviewListItem): string | null {
  const fromPublic = review.submissionGroupId?.trim()
  if (fromPublic) return fromPublic
  const fromBackstage = review.orderId?.trim()
  return fromBackstage || null
}

/**
 * Collapse reviews that share an order submission into one display unit.
 * Preserves first-seen order of the input list.
 */
export function groupReviewsForDisplay(reviews: ReviewListItem[]): ReviewDisplayGroup[] {
  const byKey = new Map<string, ReviewListItem[]>()
  const order: Array<{ type: 'single'; review: ReviewListItem } | { type: 'group'; key: string }> =
    []
  const seenKeys = new Set<string>()

  for (const review of reviews) {
    const key = groupKey(review)
    if (!key) {
      order.push({ type: 'single', review })
      continue
    }
    const bucket = byKey.get(key)
    if (bucket) {
      bucket.push(review)
    } else {
      byKey.set(key, [review])
      seenKeys.add(key)
      order.push({ type: 'group', key })
    }
  }

  const result: ReviewDisplayGroup[] = []
  for (const entry of order) {
    if (entry.type === 'single') {
      result.push({ kind: 'single', review: entry.review })
      continue
    }
    const items = byKey.get(entry.key) ?? []
    if (items.length <= 1) {
      result.push({ kind: 'single', review: items[0]! })
      continue
    }
    const store = items.find((item) => !item.productId) ?? null
    const products = items
      .filter((item) => Boolean(item.productId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const primary = store ?? products[0] ?? items[0]!
    result.push({
      kind: 'order',
      groupId: entry.key,
      store,
      products,
      primary,
    })
  }
  return result
}
