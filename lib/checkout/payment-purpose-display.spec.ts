import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  resolvePaymentPurposeForMarket,
  resolvePaymentPurposeTemplateForLocale,
  UA_PAYMENT_PURPOSE_DEFAULT,
} from './payment-purpose-display'

describe('payment purpose display', () => {
  it('SK locale does not leak UA default', () => {
    const purpose = resolvePaymentPurposeForMarket(
      UA_PAYMENT_PURPOSE_DEFAULT,
      ['ZY-00000025'],
      'sk',
      'sk',
    )
    assert.equal(purpose, 'Platba za objednávku ZY-00000025')
    assert.equal(purpose.includes('Оплата'), false)
  })

  it('DE / HU / CS / EN localized templates', () => {
    assert.equal(
      resolvePaymentPurposeTemplateForLocale(UA_PAYMENT_PURPOSE_DEFAULT, 'de'),
      'Zahlung für Bestellung {orderNumber}',
    )
    assert.equal(
      resolvePaymentPurposeTemplateForLocale(UA_PAYMENT_PURPOSE_DEFAULT, 'hu'),
      'Fizetés a(z) {orderNumber} rendeléshez',
    )
    assert.equal(
      resolvePaymentPurposeTemplateForLocale(UA_PAYMENT_PURPOSE_DEFAULT, 'cs'),
      'Platba za objednávku {orderNumber}',
    )
    assert.equal(
      resolvePaymentPurposeTemplateForLocale(UA_PAYMENT_PURPOSE_DEFAULT, 'en'),
      'Payment for order {orderNumber}',
    )
  })

  it('UK keeps Ukrainian purpose', () => {
    assert.equal(
      resolvePaymentPurposeForMarket(UA_PAYMENT_PURPOSE_DEFAULT, ['ZY-1'], 'ua', 'uk'),
      'Оплата за замовлення ZY-1',
    )
  })
})
