import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isBillingCountryDeliverable,
  isIso31661Alpha2,
  normalizeIso31661Alpha2,
  sortedBillingCountryOptions,
} from './billing-countries'
import { ISO_3166_1_ALPHA2_CODES } from './iso-3166-1-alpha2'
import { buildOrderPayload } from './build-order-payload'
import {
  canUseDeliveryAddressSameAsBilling,
  reduceCheckoutFormPatch,
} from './delivery-same-as-billing'
import { stripeBillingPrefillFromPayload } from './stripe-pending'
import {
  isBillingAddressValid,
  type CheckoutFormValues,
} from '@/lib/validation/checkout-form'
import type { CartItem } from '@/lib/types'

const items = [
  {
    plant: { id: 'p1' },
    variantId: 'v1',
    quantity: 1,
  },
] as unknown as CartItem[]

function baseForm(overrides: Partial<CheckoutFormValues> = {}): CheckoutFormValues {
  return {
    firstName: 'Ján',
    lastName: 'Novák',
    patronymic: '',
    email: 'a@b.c',
    phone: '+421900111222',
    deliveryPhone: '',
    isOtherRecipient: false,
    recipientFirstName: '',
    recipientLastName: '',
    recipientPatronymic: '',
    recipientPhone: '',
    recipientCompanyName: '',
    deliveryMethod: 'packeta-courier',
    deliveryCountryCode: 'sk',
    city: 'Bratislava',
    cityLabel: 'Bratislava',
    postOffice: '',
    postOfficeLabel: '',
    packetaPickupKind: '',
    packetaCarrierId: null,
    street: 'Hlavná',
    streetLabel: 'Hlavná',
    houseNumber: '1',
    postalCode: '811 01',
    deliveryAddressSameAsBilling: false,
    billingFirstName: 'Ján',
    billingLastName: 'Novák',
    billingStreet: 'Billing',
    billingHouseNumber: '2',
    billingCity: 'Wien',
    billingPostalCode: '1010',
    billingCountryCode: 'at',
    paymentMethod: 'card-online',
    companyEdrpou: '',
    companyLegalName: '',
    companyDic: '',
    companyStreet: '',
    companyCity: '',
    companyPostalCode: '',
    preferredShipDate: '',
    preferredShipDateImmediate: '',
    comment: '',
    promoCode: '',
    ...overrides,
  }
}

describe('ISO billing country master', () => {
  it('includes general ISO codes independent of delivery allowlist', () => {
    assert.equal(ISO_3166_1_ALPHA2_CODES.length, 249)
    for (const code of ['sk', 'at', 'de', 'ch', 'gb', 'ua', 'cz', 'us', 'xk']) {
      assert.equal(isIso31661Alpha2(code), true, code)
    }
    for (const bad of ['zz', 'xx', 'abc', '123', 'eu', 'uk', '']) {
      assert.equal(isIso31661Alpha2(bad), false, bad)
    }
  })

  it('normalizeIso31661Alpha2 lowercases valid codes', () => {
    assert.equal(normalizeIso31661Alpha2(' AT '), 'at')
    assert.equal(normalizeIso31661Alpha2('ZZ'), null)
  })

  it('sorted options prefer host countries without hiding others', () => {
    const opts = sortedBillingCountryOptions('en', ['sk', 'cz'])
    assert.equal(opts[0]?.code, 'sk')
    assert.equal(opts[1]?.code, 'cz')
    assert.ok(opts.some((o) => o.code === 'ch'))
    assert.ok(opts.some((o) => o.code === 'ua'))
    assert.equal(opts.length, 249)
  })
})

describe('A. B2C billing country independent of shipping', () => {
  for (const [billing, shipping] of [
    ['sk', 'sk'],
    ['at', 'sk'],
    ['de', 'cz'],
    ['ch', 'sk'],
    ['gb', 'sk'],
    ['ua', 'sk'],
  ] as const) {
    it(`shipping ${shipping} + billing ${billing} → payload billing=${billing}`, () => {
      const payload = buildOrderPayload(
        baseForm({
          billingCountryCode: billing,
          deliveryCountryCode: shipping,
        }),
        items,
        { marketRegion: 'sk', buyerType: 'individual', countryCode: 'sk' },
      )
      assert.equal(payload.billingCountryCode, billing)
      assert.equal(payload.deliveryCountryCode, shipping)
    })
  }

  it('does not invent billingCountryCode from delivery/domain when empty', () => {
    const payload = buildOrderPayload(
      baseForm({ billingCountryCode: '' }),
      items,
      { marketRegion: 'sk', buyerType: 'individual', countryCode: 'sk' },
    )
    assert.equal(payload.billingCountryCode, undefined)
  })
})

describe('B. B2B company country → billingCountryCode', () => {
  it('company AT + shipping SK → billing=at delivery=sk', () => {
    const payload = buildOrderPayload(
      baseForm({
        billingCountryCode: 'at',
        deliveryCountryCode: 'sk',
        companyStreet: 'Ring',
        companyCity: 'Wien',
        companyPostalCode: '1010',
        companyLegalName: 'Firma AT',
        companyEdrpou: '12345678',
      }),
      items,
      {
        marketRegion: 'sk',
        buyerType: 'company',
        countryCode: 'sk',
        companyVatId: 'ATU12345678',
        vatCountryCode: 'AT',
      },
    )
    assert.equal(payload.billingCountryCode, 'at')
    assert.equal(payload.deliveryCountryCode, 'sk')
    assert.equal(payload.billingStreet, 'Ring')
  })

  it('company DE + shipping CZ → billing=de', () => {
    const payload = buildOrderPayload(
      baseForm({
        billingCountryCode: 'de',
        deliveryCountryCode: 'cz',
        companyStreet: 'Berliner Str.',
        companyCity: 'Berlin',
        companyPostalCode: '10115',
        companyLegalName: 'Firma DE',
        companyEdrpou: '12345678',
      }),
      items,
      { marketRegion: 'sk', buyerType: 'company', countryCode: 'sk' },
    )
    assert.equal(payload.billingCountryCode, 'de')
    assert.equal(payload.deliveryCountryCode, 'cz')
  })

  it('company requires explicit billingCountryCode for validity', () => {
    const form = baseForm({
      billingCountryCode: '',
      companyStreet: 'X',
      companyCity: 'Y',
      companyPostalCode: '1',
    })
    assert.equal(
      isBillingAddressValid(form, { marketRegion: 'sk', buyerType: 'company' }),
      false,
    )
    assert.equal(
      isBillingAddressValid(
        { ...form, billingCountryCode: 'at' },
        { marketRegion: 'sk', buyerType: 'company' },
      ),
      true,
    )
  })
})

describe('C/D. Same-as-billing vs delivery allowlist', () => {
  const skAllow = ['sk', 'cz']

  it('billing SK can use same-as when SK deliverable', () => {
    assert.equal(canUseDeliveryAddressSameAsBilling('sk', skAllow), true)
    let form = baseForm({
      billingCountryCode: 'sk',
      deliveryMethod: 'gls-courier',
      deliveryAddressSameAsBilling: false,
    })
    form = reduceCheckoutFormPatch(
      form,
      { deliveryAddressSameAsBilling: true },
      { enabledDeliveryCountries: skAllow },
    )
    assert.equal(form.deliveryAddressSameAsBilling, true)
    assert.equal(form.deliveryCountryCode, 'sk')
  })

  it('billing AT cannot silently produce shipping AT on .sk allowlist', () => {
    assert.equal(canUseDeliveryAddressSameAsBilling('at', skAllow), false)
    assert.equal(isBillingCountryDeliverable('at', skAllow), false)

    let form = baseForm({
      billingCountryCode: 'at',
      deliveryCountryCode: 'sk',
      deliveryMethod: 'gls-courier',
      deliveryAddressSameAsBilling: false,
    })
    form = reduceCheckoutFormPatch(
      form,
      { deliveryAddressSameAsBilling: true },
      { enabledDeliveryCountries: skAllow },
    )
    assert.equal(form.deliveryAddressSameAsBilling, false)
    assert.equal(form.deliveryCountryCode, 'sk')

    form = reduceCheckoutFormPatch(
      baseForm({
        billingCountryCode: 'sk',
        deliveryAddressSameAsBilling: true,
        deliveryMethod: 'gls-courier',
        deliveryCountryCode: 'sk',
      }),
      { billingCountryCode: 'at' },
      { enabledDeliveryCountries: skAllow },
    )
    assert.equal(form.deliveryAddressSameAsBilling, false)
    // Must not have copied AT into delivery while same-as was forced off
    assert.notEqual(form.deliveryCountryCode, 'at')
  })
})

describe('E. Packeta SK + billing AT', () => {
  it('point never becomes billing; countries stay independent', () => {
    const form = baseForm({
      deliveryMethod: 'packeta-box',
      deliveryCountryCode: 'sk',
      billingCountryCode: 'at',
      postOffice: '24440',
      postOfficeLabel: 'Z-BOX',
      street: 'Point St',
      streetLabel: 'Point St',
      postalCode: '811 01',
      billingStreet: 'Ring',
      billingCity: 'Wien',
      billingPostalCode: '1010',
    })
    const payload = buildOrderPayload(form, items, {
      marketRegion: 'sk',
      buyerType: 'individual',
      countryCode: 'sk',
    })
    assert.equal(payload.billingCountryCode, 'at')
    assert.equal(payload.deliveryCountryCode, 'sk')
    assert.equal(payload.deliveryBranch, '24440')
    assert.equal(payload.billingStreet, 'Ring')
    assert.notEqual(payload.billingStreet, payload.deliveryStreet)
  })
})

describe('F. Pickup SK + billing DE', () => {
  it('accepts German billing without forcing SK', () => {
    const form = baseForm({
      deliveryMethod: 'pickup',
      deliveryCountryCode: 'sk',
      billingCountryCode: 'de',
      billingCity: 'Berlin',
      billingPostalCode: '10115',
    })
    const payload = buildOrderPayload(form, items, {
      marketRegion: 'sk',
      buyerType: 'individual',
    })
    assert.equal(payload.billingCountryCode, 'de')
    assert.equal(payload.deliveryMethod, 'pickup')
    assert.equal(
      isBillingAddressValid(form, { marketRegion: 'sk', buyerType: 'individual' }),
      true,
    )
  })
})

describe('I. Stripe billing prefill', () => {
  it('billing ch → Stripe country CH', () => {
    const prefill = stripeBillingPrefillFromPayload({
      billingStreet: 'Bahnhofstrasse',
      billingHouseNumber: '1',
      billingCity: 'Zürich',
      billingPostalCode: '8001',
      billingCountryCode: 'ch',
      customerFirstName: 'A',
      customerLastName: 'B',
    })
    assert.ok(prefill)
    assert.equal(prefill!.country, 'CH')
  })
})
