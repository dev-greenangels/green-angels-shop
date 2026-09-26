import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mergeCheckoutInitialHydration } from './merge-checkout-hydration'
import type { CheckoutDraftV1 } from '@/lib/carts/types'
import type { PublicSession } from '@/lib/auth/types'

const sessionUser = {
  id: 'u1',
  email: 'profile@example.com',
  firstName: 'Profile',
  lastName: 'User',
  phone: '+421900000001',
} as PublicSession

describe('mergeCheckoutInitialHydration', () => {
  it('profile only → profile values', () => {
    const result = mergeCheckoutInitialHydration({
      session: { user: sessionUser, profile: null },
      draft: null,
      allowedDeliveryMethods: ['packeta-box'],
      allowedPaymentMethods: ['card-online'],
    })
    assert.equal(result.formPatch.firstName, 'Profile')
    assert.equal(result.formPatch.phone, '+421900000001')
    assert.equal(result.formPatch.email, 'profile@example.com')
  })

  it('draft only → draft values', () => {
    const draft: CheckoutDraftV1 = {
      v: 1,
      firstName: 'Draft',
      phone: '+421900000002',
      deliveryMethod: 'packeta-box',
      paymentMethod: 'card-online',
    }
    const result = mergeCheckoutInitialHydration({
      session: null,
      draft,
      allowedDeliveryMethods: ['packeta-box'],
      allowedPaymentMethods: ['card-online'],
    })
    assert.equal(result.formPatch.firstName, 'Draft')
    assert.equal(result.formPatch.phone, '+421900000002')
  })

  it('profile + draft → present draft fields win', () => {
    const draft: CheckoutDraftV1 = {
      v: 1,
      phone: '+421999999999',
      deliveryMethod: 'gls-courier',
    }
    const result = mergeCheckoutInitialHydration({
      session: { user: sessionUser, profile: null },
      draft,
      allowedDeliveryMethods: ['packeta-box', 'gls-courier'],
      allowedPaymentMethods: ['card-online'],
    })
    assert.equal(result.formPatch.firstName, 'Profile')
    assert.equal(result.formPatch.phone, '+421999999999')
    assert.equal(result.formPatch.deliveryMethod, 'gls-courier')
    assert.equal(result.formPatch.email, 'profile@example.com')
  })

  it('missing draft field keeps profile fallback', () => {
    const draft: CheckoutDraftV1 = { v: 1, comment: 'hi' }
    const result = mergeCheckoutInitialHydration({
      session: { user: sessionUser, profile: null },
      draft,
      allowedDeliveryMethods: [],
      allowedPaymentMethods: [],
    })
    assert.equal(result.formPatch.firstName, 'Profile')
    assert.equal(result.formPatch.comment, 'hi')
  })

  it('invalid saved delivery/payment → not restored', () => {
    const draft: CheckoutDraftV1 = {
      v: 1,
      deliveryMethod: 'packeta-box',
      paymentMethod: 'card-online',
      firstName: 'A',
    }
    const result = mergeCheckoutInitialHydration({
      session: null,
      draft,
      allowedDeliveryMethods: ['gls-courier'],
      allowedPaymentMethods: ['dobierka'],
    })
    assert.equal(result.formPatch.deliveryMethod, undefined)
    assert.equal(result.formPatch.paymentMethod, undefined)
    assert.equal(result.formPatch.firstName, 'A')
  })

  it('fast/slow arrival order does not matter — merge is pure', () => {
    const draft: CheckoutDraftV1 = { v: 1, phone: 'draft-phone' }
    const a = mergeCheckoutInitialHydration({
      session: { user: sessionUser, profile: null },
      draft,
      allowedDeliveryMethods: [],
      allowedPaymentMethods: [],
    })
    const b = mergeCheckoutInitialHydration({
      draft,
      session: { user: sessionUser, profile: null },
      allowedDeliveryMethods: [],
      allowedPaymentMethods: [],
    })
    assert.deepEqual(a.formPatch, b.formPatch)
    assert.equal(a.formPatch.phone, 'draft-phone')
  })

  it('SK market drops Cyrillic profile/draft names', () => {
    const cyrillicUser = {
      ...sessionUser,
      firstName: 'Артур',
      lastName: 'Денисенко',
    } as PublicSession
    const draft: CheckoutDraftV1 = {
      v: 1,
      firstName: 'Іван',
      lastName: 'Петренко',
    }
    const result = mergeCheckoutInitialHydration({
      session: { user: cyrillicUser, profile: null },
      draft,
      allowedDeliveryMethods: [],
      allowedPaymentMethods: [],
      marketRegion: 'sk',
    })
    assert.equal(result.formPatch.firstName, '')
    assert.equal(result.formPatch.lastName, '')
  })

  it('SK market keeps Latin draft names over cleared Cyrillic profile', () => {
    const cyrillicUser = {
      ...sessionUser,
      firstName: 'Артур',
      lastName: 'Денисенко',
    } as PublicSession
    const draft: CheckoutDraftV1 = {
      v: 1,
      firstName: 'Artur',
      lastName: 'Denysenko',
    }
    const result = mergeCheckoutInitialHydration({
      session: { user: cyrillicUser, profile: null },
      draft,
      allowedDeliveryMethods: [],
      allowedPaymentMethods: [],
      marketRegion: 'sk',
    })
    assert.equal(result.formPatch.firstName, 'Artur')
    assert.equal(result.formPatch.lastName, 'Denysenko')
  })
})
