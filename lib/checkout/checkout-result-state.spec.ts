import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  resolveCheckoutResultState,
  resolveCheckoutResultStateWithPaymentQueryHint,
  resolvePrimaryCheckoutResultState,
  checkoutResultChromeTone,
} from './checkout-result-state'
import { resolvePaymentPurposeForMarket, UA_PAYMENT_PURPOSE_DEFAULT } from './payment-purpose-display'

describe('resolveCheckoutResultState', () => {
  it('card + success → PAYMENT_SUCCESS', () => {
    assert.equal(
      resolveCheckoutResultState({
        status: 'PROCESSING',
        paymentMethod: 'card-online',
        paymentStatus: 'success',
      }),
      'PAYMENT_SUCCESS',
    )
  })

  it('card + processing → PAYMENT_PROCESSING', () => {
    assert.equal(
      resolveCheckoutResultState({
        status: 'AWAITING_PAYMENT',
        paymentMethod: 'card-online',
        paymentStatus: 'processing',
      }),
      'PAYMENT_PROCESSING',
    )
  })

  it('card + failed/expired → PAYMENT_FAILED', () => {
    assert.equal(
      resolveCheckoutResultState({
        status: 'AWAITING_PAYMENT',
        paymentMethod: 'card-online',
        paymentStatus: 'failure',
      }),
      'PAYMENT_FAILED',
    )
    assert.equal(
      resolveCheckoutResultState({
        status: 'AWAITING_PAYMENT',
        paymentMethod: 'card-online',
        paymentStatus: 'expired',
      }),
      'PAYMENT_FAILED',
    )
  })

  it('card + unpaid/created → PAYMENT_NOT_COMPLETED', () => {
    assert.equal(
      resolveCheckoutResultState({
        status: 'AWAITING_PAYMENT',
        paymentMethod: 'card-online',
        paymentStatus: 'created',
      }),
      'PAYMENT_NOT_COMPLETED',
    )
    assert.equal(
      resolveCheckoutResultState({
        status: 'AWAITING_PAYMENT',
        paymentMethod: 'card-online',
        paymentStatus: null,
      }),
      'PAYMENT_NOT_COMPLETED',
    )
  })

  it('bank → ORDER_RECEIVED', () => {
    assert.equal(
      resolveCheckoutResultState({
        status: 'PENDING',
        paymentMethod: 'bank-transfer',
        paymentStatus: null,
      }),
      'ORDER_RECEIVED',
    )
  })

  it('COD → ORDER_RECEIVED', () => {
    assert.equal(
      resolveCheckoutResultState({
        status: 'PENDING',
        paymentMethod: 'dobierka',
        paymentStatus: null,
      }),
      'ORDER_RECEIVED',
    )
  })

  it('cancelled Order → ORDER_CANCELLED', () => {
    assert.equal(
      resolveCheckoutResultState({
        status: 'CANCELLED',
        paymentMethod: 'card-online',
        paymentStatus: 'created',
      }),
      'ORDER_CANCELLED',
    )
  })

  it('cancelled + late success paymentStatus still ORDER_CANCELLED', () => {
    assert.equal(
      resolveCheckoutResultState({
        status: 'CANCELLED',
        paymentMethod: 'card-online',
        paymentStatus: 'success',
      }),
      'ORDER_CANCELLED',
    )
  })
})

describe('payment=cancelled query hint', () => {
  it('payment=cancelled + Order NOT cancelled ≠ ORDER_CANCELLED', () => {
    const state = resolveCheckoutResultStateWithPaymentQueryHint(
      {
        status: 'AWAITING_PAYMENT',
        paymentMethod: 'card-online',
        paymentStatus: 'created',
      },
      'cancelled',
    )
    assert.notEqual(state, 'ORDER_CANCELLED')
    assert.equal(state, 'PAYMENT_NOT_COMPLETED')
  })

  it('payment=cancelled does not override confirmed CANCELLED', () => {
    assert.equal(
      resolveCheckoutResultStateWithPaymentQueryHint(
        {
          status: 'CANCELLED',
          paymentMethod: 'card-online',
          paymentStatus: 'created',
        },
        'cancelled',
      ),
      'ORDER_CANCELLED',
    )
  })

  it('payment=cancelled does not downgrade confirmed paid', () => {
    assert.equal(
      resolveCheckoutResultStateWithPaymentQueryHint(
        {
          status: 'PROCESSING',
          paymentMethod: 'card-online',
          paymentStatus: 'success',
        },
        'cancelled',
      ),
      'PAYMENT_SUCCESS',
    )
  })
})

describe('resolvePrimaryCheckoutResultState', () => {
  it('empty → null (unverified — caller must not show order details)', () => {
    assert.equal(resolvePrimaryCheckoutResultState([]), null)
  })
})

describe('checkoutResultChromeTone', () => {
  it('maps tones without treating unpaid as success green-only', () => {
    assert.equal(checkoutResultChromeTone('PAYMENT_SUCCESS'), 'positive')
    assert.equal(checkoutResultChromeTone('ORDER_RECEIVED'), 'positive')
    assert.equal(checkoutResultChromeTone('PAYMENT_PROCESSING'), 'neutral')
    assert.equal(checkoutResultChromeTone('PAYMENT_NOT_COMPLETED'), 'warning')
    assert.equal(checkoutResultChromeTone('PAYMENT_FAILED'), 'destructive')
    assert.equal(checkoutResultChromeTone('ORDER_CANCELLED'), 'destructive')
  })
})

describe('resolvePaymentPurposeForMarket', () => {
  it('does not expose UA default on SK', () => {
    const purpose = resolvePaymentPurposeForMarket(
      UA_PAYMENT_PURPOSE_DEFAULT,
      ['ZY-00000001'],
      'sk',
    )
    assert.equal(purpose, 'VS ZY-00000001')
    assert.equal(/[а-яіїєґ]/i.test(purpose), false)
  })

  it('keeps configured non-UA template', () => {
    assert.equal(
      resolvePaymentPurposeForMarket('Objednavka {orderNumber}', ['ZY-1'], 'sk'),
      'Objednavka ZY-1',
    )
  })
})
