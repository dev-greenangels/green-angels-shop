import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getCheckoutRecipientPhoneRaw } from '../../components/checkout/checkout-utils'
import type { CheckoutFormValues } from './checkout-form'
import {
  isUaDeliveryPhoneLockActive,
  showOrdererDeliveryPhoneField,
} from './checkout-form'

function form(patch: Partial<CheckoutFormValues>): CheckoutFormValues {
  return {
    isOtherRecipient: false,
    phone: '',
    deliveryPhone: '',
    recipientPhone: '',
    ...patch,
  } as CheckoutFormValues
}

describe('UA delivery phone lock', () => {
  it('is active only for UA market with ua_e164 carrier policy', () => {
    assert.equal(isUaDeliveryPhoneLockActive('ua', 'ua_e164'), true)
    assert.equal(isUaDeliveryPhoneLockActive('ua', 'intl'), false)
    assert.equal(isUaDeliveryPhoneLockActive('sk', 'ua_e164'), false)
    assert.equal(isUaDeliveryPhoneLockActive('sk', 'intl'), false)
  })

  it('does not show the extra field on SK / intl delivery', () => {
    const emptyPhone = form({ phone: '' })
    assert.equal(showOrdererDeliveryPhoneField(emptyPhone, undefined, 'sk', 'intl'), false)
    assert.equal(showOrdererDeliveryPhoneField(emptyPhone, undefined, 'ua', 'intl'), false)
  })

  it('shows the extra field on UA ua_e164 when contact phone is not +380', () => {
    assert.equal(
      showOrdererDeliveryPhoneField(form({ phone: '+421900000001' }), undefined, 'ua', 'ua_e164'),
      true,
    )
    assert.equal(
      showOrdererDeliveryPhoneField(form({ phone: '+380501234567' }), undefined, 'ua', 'ua_e164'),
      false,
    )
  })

  it('puts SK contact phone on the order, not the extra deliveryPhone field', () => {
    const values = form({ phone: '+421900000001', deliveryPhone: '+380501234567' })
    assert.equal(getCheckoutRecipientPhoneRaw(values, 'sk', 'intl'), '+421900000001')
  })

  it('uses extra deliveryPhone on UA lock when contact is not a UA number', () => {
    const values = form({ phone: '+421900000001', deliveryPhone: '+380501234567' })
    assert.equal(getCheckoutRecipientPhoneRaw(values, 'ua', 'ua_e164'), '+380501234567')
  })
})
