import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { groupReviewsForDisplay } from './group'
import type { ReviewListItem } from './types'

function review(partial: Partial<ReviewListItem> & Pick<ReviewListItem, 'id'>): ReviewListItem {
  return {
    authorName: 'Anna',
    text: '',
    image: null,
    images: [],
    rating: 5,
    productId: null,
    productName: null,
    productSlug: null,
    status: 'APPROVED',
    verificationType: 'NONE',
    purchasedVariantLabels: [],
    storeReply: null,
    submissionGroupId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('groupReviewsForDisplay', () => {
  it('merges store + 1 product sharing submissionGroupId', () => {
    const items = [
      review({
        id: 's',
        submissionGroupId: 'ord-1',
        text: 'alles war gut',
        verificationType: 'VERIFIED_CUSTOMER',
      }),
      review({
        id: 'p',
        submissionGroupId: 'ord-1',
        productId: 'prod-1',
        productName: "Weigela 'Cherry Love'",
        productSlug: 'weigela',
        text: '',
        verificationType: 'VERIFIED_PURCHASE',
      }),
    ]
    const groups = groupReviewsForDisplay(items)
    assert.equal(groups.length, 1)
    assert.equal(groups[0]!.kind, 'order')
    if (groups[0]!.kind === 'order') {
      assert.equal(groups[0].store?.id, 's')
      assert.equal(groups[0].products.length, 1)
    }
  })

  it('merges store + 3 products into one group', () => {
    const items = [
      review({ id: 's', submissionGroupId: 'ord-2', text: 'Great' }),
      review({ id: 'p1', submissionGroupId: 'ord-2', productId: 'a', productName: 'A' }),
      review({ id: 'p2', submissionGroupId: 'ord-2', productId: 'b', productName: 'B' }),
      review({ id: 'p3', submissionGroupId: 'ord-2', productId: 'c', productName: 'C' }),
    ]
    const groups = groupReviewsForDisplay(items)
    assert.equal(groups.length, 1)
    if (groups[0]!.kind === 'order') {
      assert.equal(groups[0].products.length, 3)
    }
  })

  it('keeps product-only submission as one order group', () => {
    const items = [
      review({ id: 'p1', submissionGroupId: 'ord-3', productId: 'a', productName: 'A' }),
      review({ id: 'p2', submissionGroupId: 'ord-3', productId: 'b', productName: 'B' }),
    ]
    const groups = groupReviewsForDisplay(items)
    assert.equal(groups.length, 1)
    if (groups[0]!.kind === 'order') {
      assert.equal(groups[0].store, null)
      assert.equal(groups[0].products.length, 2)
    }
  })

  it('keeps standalone reviews without group id separate', () => {
    const items = [
      review({ id: 'solo-1', authorName: 'Anna', text: 'One' }),
      review({ id: 'solo-2', authorName: 'Anna', text: 'Two' }),
    ]
    const groups = groupReviewsForDisplay(items)
    assert.equal(groups.length, 2)
    assert.equal(groups[0]!.kind, 'single')
    assert.equal(groups[1]!.kind, 'single')
  })

  it('does not merge different orders from the same author', () => {
    const items = [
      review({ id: 'a', authorName: 'Anna', submissionGroupId: 'ord-a', text: 'First' }),
      review({ id: 'b', authorName: 'Anna', submissionGroupId: 'ord-b', text: 'Second' }),
    ]
    const groups = groupReviewsForDisplay(items)
    assert.equal(groups.length, 2)
  })
})
