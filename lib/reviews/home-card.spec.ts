import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { groupReviewsForDisplay } from './group'
import {
  pickSubmissionPlants,
  pickSubmissionQuote,
  pickSubmissionRating,
  toHomeReviewCardModel,
} from './home-card'
import type { ReviewListItem } from './types'

function review(partial: Partial<ReviewListItem> & Pick<ReviewListItem, 'id'>): ReviewListItem {
  return {
    authorName: 'Ján',
    text: '',
    image: null,
    images: [],
    rating: 5,
    productId: null,
    productName: null,
    productSlug: null,
    status: 'APPROVED',
    verificationType: 'VERIFIED_CUSTOMER',
    purchasedVariantLabels: [],
    storeReply: null,
    submissionGroupId: 'ord-1',
    deliveryCountryCode: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('home review card model', () => {
  it('prefers store text as quote', () => {
    const group = groupReviewsForDisplay([
      review({ id: 's', text: 'alles war gut' }),
      review({
        id: 'p',
        productId: 'p1',
        productName: 'Weigela',
        productSlug: 'weigela',
        text: 'plant note',
        verificationType: 'VERIFIED_PURCHASE',
      }),
    ])[0]!
    assert.equal(pickSubmissionQuote(group), 'alles war gut')
    assert.equal(pickSubmissionRating(group), 5)
  })

  it('falls back to product text then rating-only null', () => {
    const withProductText = groupReviewsForDisplay([
      review({ id: 's', text: '' }),
      review({
        id: 'p',
        productId: 'p1',
        productName: 'Weigela',
        text: 'plant only',
        verificationType: 'VERIFIED_PURCHASE',
      }),
    ])[0]!
    assert.equal(pickSubmissionQuote(withProductText), 'plant only')

    const ratingOnly = groupReviewsForDisplay([
      review({ id: 's', text: '', rating: 4 }),
      review({
        id: 'p',
        productId: 'p1',
        productName: 'Weigela',
        text: '',
        rating: 5,
        verificationType: 'VERIFIED_PURCHASE',
      }),
    ])[0]!
    assert.equal(pickSubmissionQuote(ratingOnly), null)
    assert.equal(pickSubmissionRating(ratingOnly), 4)
  })

  it('limits plant names to 3 with overflow only beyond that', () => {
    const three = groupReviewsForDisplay([
      review({ id: 's', text: 'ok' }),
      review({ id: 'p1', productId: 'a', productName: 'A', productSlug: 'a' }),
      review({ id: 'p2', productId: 'b', productName: 'B', productSlug: 'b' }),
      review({ id: 'p3', productId: 'c', productName: 'C', productSlug: 'c' }),
    ])[0]!
    assert.equal(pickSubmissionPlants(three, 3).plants.length, 3)
    assert.equal(pickSubmissionPlants(three, 3).overflow, 0)

    const four = groupReviewsForDisplay([
      review({ id: 's2', text: 'ok', submissionGroupId: 'ord-x' }),
      review({ id: 'p1', submissionGroupId: 'ord-x', productId: 'a', productName: 'A' }),
      review({ id: 'p2', submissionGroupId: 'ord-x', productId: 'b', productName: 'B' }),
      review({ id: 'p3', submissionGroupId: 'ord-x', productId: 'c', productName: 'C' }),
      review({ id: 'p4', submissionGroupId: 'ord-x', productId: 'd', productName: 'D' }),
    ])[0]!
    const { plants, overflow } = pickSubmissionPlants(four, 3)
    assert.equal(plants.length, 3)
    assert.equal(overflow, 1)
  })

  it('homepage card limit equals grouped cards not raw rows', () => {
    const items = [
      review({ id: 's1', submissionGroupId: 'o1', text: 'One' }),
      review({ id: 'p1', submissionGroupId: 'o1', productId: 'a', productName: 'A' }),
      review({ id: 's2', submissionGroupId: 'o2', text: 'Two' }),
      review({ id: 'p2', submissionGroupId: 'o2', productId: 'b', productName: 'B' }),
    ]
    const cards = groupReviewsForDisplay(items).map(toHomeReviewCardModel).slice(0, 1)
    assert.equal(cards.length, 1)
    assert.equal(cards[0]!.quote, 'One')
    assert.equal(cards[0]!.plants.length, 1)
  })

  it('carries delivery country and size labels onto the home model', () => {
    const group = groupReviewsForDisplay([
      review({
        id: 's',
        text: 'ok',
        deliveryCountryCode: 'sk',
      }),
      review({
        id: 'p',
        productId: 'p1',
        productName: 'Weigela',
        productSlug: 'weigela',
        purchasedVariantLabels: ['C2'],
        verificationType: 'VERIFIED_PURCHASE',
        deliveryCountryCode: 'sk',
      }),
    ])[0]!
    const model = toHomeReviewCardModel(group)
    assert.equal(model.deliveryCountryCode, 'sk')
    assert.deepEqual(model.plants[0]?.sizeLabels, ['C2'])
  })
})
