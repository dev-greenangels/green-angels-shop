import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  buildPurchasePayload,
  gtmPurchaseSessionKey,
  pushPurchaseEventIfEligible,
  shouldFirePurchaseEvent,
  type PurchaseTrackingOrder,
} from './push-purchase'

function order(partial: Partial<PurchaseTrackingOrder> & Pick<PurchaseTrackingOrder, 'paymentMethod'>): PurchaseTrackingOrder {
  return {
    orderNumber: 'ZY-00000042',
    totalAmount: 19.9,
    currency: 'EUR',
    status: 'PENDING',
    paymentStatus: null,
    ...partial,
  }
}

describe('shouldFirePurchaseEvent', () => {
  it('fires for bank transfer when ORDER_RECEIVED', () => {
    assert.equal(
      shouldFirePurchaseEvent(order({ paymentMethod: 'bank-transfer', status: 'PENDING' })),
      true,
    )
  })

  it('fires for COD / pay-on-pickup when ORDER_RECEIVED', () => {
    assert.equal(shouldFirePurchaseEvent(order({ paymentMethod: 'dobierka' })), true)
    assert.equal(shouldFirePurchaseEvent(order({ paymentMethod: 'pay-on-pickup' })), true)
  })

  it('fires for Stripe only when paid', () => {
    assert.equal(
      shouldFirePurchaseEvent(
        order({
          paymentMethod: 'card-online',
          status: 'PROCESSING',
          paymentStatus: 'success',
        }),
      ),
      true,
    )
  })

  it('does not fire for unpaid / failed / processing / cancelled card orders', () => {
    assert.equal(
      shouldFirePurchaseEvent(
        order({ paymentMethod: 'card-online', status: 'AWAITING_PAYMENT', paymentStatus: 'created' }),
      ),
      false,
    )
    assert.equal(
      shouldFirePurchaseEvent(
        order({
          paymentMethod: 'card-online',
          status: 'AWAITING_PAYMENT',
          paymentStatus: 'processing',
        }),
      ),
      false,
    )
    assert.equal(
      shouldFirePurchaseEvent(
        order({ paymentMethod: 'card-online', status: 'AWAITING_PAYMENT', paymentStatus: 'failure' }),
      ),
      false,
    )
    assert.equal(
      shouldFirePurchaseEvent(
        order({ paymentMethod: 'card-online', status: 'CANCELLED', paymentStatus: 'success' }),
      ),
      false,
    )
  })

  it('rejects empty transaction id', () => {
    assert.equal(
      shouldFirePurchaseEvent(order({ paymentMethod: 'bank-transfer', orderNumber: '  ' })),
      false,
    )
  })
})

describe('buildPurchasePayload', () => {
  it('emits only non-PII purchase fields', () => {
    const payload = buildPurchasePayload(
      order({ paymentMethod: 'bank-transfer', orderNumber: 'ZY-00000099', totalAmount: 12, currency: 'HUF' }),
    )
    assert.deepEqual(payload, {
      event: 'purchase',
      transaction_id: 'ZY-00000099',
      value: 12,
      currency: 'HUF',
    })
    assert.equal('email' in payload, false)
    assert.equal('phone' in payload, false)
    assert.equal('customerEmail' in payload, false)
  })
})

describe('gtmPurchaseSessionKey', () => {
  it('uses stable per-transaction sessionStorage key', () => {
    assert.equal(gtmPurchaseSessionKey('ZY-00000001'), 'ga-gtm-purchase:ZY-00000001')
  })
})

describe('pushPurchaseEventIfEligible', () => {
  const store = new Map<string, string>()

  afterEach(() => {
    store.clear()
    // @ts-expect-error test cleanup
    delete globalThis.window
  })

  function mockWindow() {
    const dataLayer: unknown[] = []
    const sessionStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }
    // @ts-expect-error minimal window stub for unit test
    globalThis.window = { dataLayer, sessionStorage }
    return dataLayer
  }

  it('pushes once per transaction_id then no-ops on remount', () => {
    const dataLayer = mockWindow()
    const paid = order({
      paymentMethod: 'card-online',
      status: 'PROCESSING',
      paymentStatus: 'success',
      orderNumber: 'ZY-00000007',
      totalAmount: 42,
      currency: 'EUR',
    })

    assert.equal(pushPurchaseEventIfEligible(paid), true)
    assert.equal(pushPurchaseEventIfEligible(paid), false)
    assert.deepEqual(dataLayer, [
      {
        event: 'purchase',
        transaction_id: 'ZY-00000007',
        value: 42,
        currency: 'EUR',
      },
    ])
  })

  it('does not push when gating fails', () => {
    const dataLayer = mockWindow()
    assert.equal(
      pushPurchaseEventIfEligible(
        order({
          paymentMethod: 'card-online',
          status: 'AWAITING_PAYMENT',
          paymentStatus: null,
        }),
      ),
      false,
    )
    assert.equal(dataLayer.length, 0)
  })
})
