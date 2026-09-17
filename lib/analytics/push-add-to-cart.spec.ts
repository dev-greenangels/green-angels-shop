import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  buildAddToCartPayload,
  pushAddToCartEvent,
  roundMoneyForAnalytics,
} from './push-add-to-cart'

describe('roundMoneyForAnalytics', () => {
  it('rounds to two decimal places', () => {
    assert.equal(roundMoneyForAnalytics(5.2 * 3), 15.6)
    assert.equal(roundMoneyForAnalytics(0.1 + 0.2), 0.3)
  })

  it('returns 0 for non-finite amounts', () => {
    assert.equal(roundMoneyForAnalytics(Number.NaN), 0)
    assert.equal(roundMoneyForAnalytics(Number.POSITIVE_INFINITY), 0)
  })
})

describe('buildAddToCartPayload', () => {
  const base = {
    currency: 'EUR',
    unitPrice: 5.2,
    quantity: 1,
    itemId: '11111111-2222-4333-8444-555555555555',
    itemName: 'Echinacea',
    itemVariant: 'C2',
  }

  it('builds quantity 1 payload', () => {
    assert.deepEqual(buildAddToCartPayload(base), {
      event: 'add_to_cart',
      ecommerce: {
        currency: 'EUR',
        value: 5.2,
        items: [
          {
            item_id: '11111111-2222-4333-8444-555555555555',
            item_name: 'Echinacea',
            item_variant: 'C2',
            price: 5.2,
            quantity: 1,
          },
        ],
      },
    })
  })

  it('supports quantity > 1 and value = unitPrice * quantity', () => {
    const payload = buildAddToCartPayload({ ...base, quantity: 3, unitPrice: 5.2 })
    assert.equal(payload?.ecommerce.items[0]?.quantity, 3)
    assert.equal(payload?.ecommerce.value, 15.6)
    assert.equal(payload?.ecommerce.items[0]?.price, 5.2)
  })

  it('maps variant.id → item_id and variant.label → item_variant', () => {
    const payload = buildAddToCartPayload({
      ...base,
      itemId: 'variant-uuid-1',
      itemVariant: 'P9 · 40-60cm',
    })
    assert.equal(payload?.ecommerce.items[0]?.item_id, 'variant-uuid-1')
    assert.equal(payload?.ecommerce.items[0]?.item_variant, 'P9 · 40-60cm')
  })

  it('passes currency through (normalized uppercase)', () => {
    assert.equal(buildAddToCartPayload({ ...base, currency: 'huf' })?.ecommerce.currency, 'HUF')
    assert.equal(buildAddToCartPayload({ ...base, currency: 'UAH' })?.ecommerce.currency, 'UAH')
  })

  it('returns null when quantity is 0', () => {
    assert.equal(buildAddToCartPayload({ ...base, quantity: 0 }), null)
  })

  it('returns null when quantity is negative', () => {
    assert.equal(buildAddToCartPayload({ ...base, quantity: -1 }), null)
  })

  it('returns null when currency or item_id is empty', () => {
    assert.equal(buildAddToCartPayload({ ...base, currency: '  ' }), null)
    assert.equal(buildAddToCartPayload({ ...base, itemId: '' }), null)
  })
})

describe('pushAddToCartEvent', () => {
  afterEach(() => {
    // @ts-expect-error test cleanup
    delete globalThis.window
  })

  function mockWindow() {
    const dataLayer: unknown[] = []
    // @ts-expect-error minimal window stub for unit test
    globalThis.window = { dataLayer }
    return dataLayer
  }

  it('clears ecommerce then pushes add_to_cart', () => {
    const dataLayer = mockWindow()
    assert.equal(
      pushAddToCartEvent({
        currency: 'EUR',
        unitPrice: 5.2,
        quantity: 2,
        itemId: 'variant-1',
        itemName: 'Acer',
        itemVariant: 'C5',
      }),
      true,
    )
    assert.deepEqual(dataLayer, [
      { ecommerce: null },
      {
        event: 'add_to_cart',
        ecommerce: {
          currency: 'EUR',
          value: 10.4,
          items: [
            {
              item_id: 'variant-1',
              item_name: 'Acer',
              item_variant: 'C5',
              price: 5.2,
              quantity: 2,
            },
          ],
        },
      },
    ])
  })

  it('does not push when quantity is 0', () => {
    const dataLayer = mockWindow()
    assert.equal(
      pushAddToCartEvent({
        currency: 'EUR',
        unitPrice: 5.2,
        quantity: 0,
        itemId: 'variant-1',
        itemName: 'Acer',
        itemVariant: 'C5',
      }),
      false,
    )
    assert.equal(dataLayer.length, 0)
  })

  it('no-ops safely when window is undefined', () => {
    // @ts-expect-error test cleanup
    delete globalThis.window
    assert.equal(
      pushAddToCartEvent({
        currency: 'EUR',
        unitPrice: 5.2,
        quantity: 1,
        itemId: 'variant-1',
        itemName: 'Acer',
        itemVariant: 'C5',
      }),
      false,
    )
  })
})
