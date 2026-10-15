import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { backstagePaymentStatusLabel } from './payment-status-label'

describe('backstagePaymentStatusLabel', () => {
  const labels = { unpaid: 'Не оплачено', paid: 'Оплачено' }

  it('maps null / empty / unpaid to Не оплачено', () => {
    assert.equal(backstagePaymentStatusLabel(null, labels), 'Не оплачено')
    assert.equal(backstagePaymentStatusLabel(undefined, labels), 'Не оплачено')
    assert.equal(backstagePaymentStatusLabel('', labels), 'Не оплачено')
    assert.equal(backstagePaymentStatusLabel('unpaid', labels), 'Не оплачено')
  })

  it('maps success to paid and never treats unpaid as paid', () => {
    assert.equal(backstagePaymentStatusLabel('success', labels), 'Оплачено')
    assert.notEqual(backstagePaymentStatusLabel(null, labels), 'Оплачено')
  })
})
