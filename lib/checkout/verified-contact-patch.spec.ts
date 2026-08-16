import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { buildVerifiedCheckoutContactPatch } from './verified-contact-patch'

const names = { firstName: 'Petr', lastName: 'Novak' }

describe('buildVerifiedCheckoutContactPatch — keep typed sibling contacts', () => {
  it('A: email auth keeps typed phone when User has no phone', () => {
    const patch = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'a@example.com', phone: '+421900000002' },
      { ...names, email: 'a@example.com', phone: '', user: { email: 'a@example.com', phone: null } },
      'email',
    )
    assert.equal(patch.email, 'a@example.com')
    assert.equal(patch.phone, '+421900000002')
  })

  it('B: phone auth keeps typed email when User has no email', () => {
    const patch = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'a@example.com', phone: '+421900000002' },
      { ...names, email: '', phone: '+421900000002', user: { email: null, phone: '+421900000002' } },
      'sms',
    )
    assert.equal(patch.phone, '+421900000002')
    assert.equal(patch.email, 'a@example.com')
  })

  it('C: email auth + empty phone fills User.phone when present, else stays empty', () => {
    const empty = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'a@example.com', phone: '' },
      { ...names, email: 'a@example.com', phone: '', user: { email: 'a@example.com', phone: null } },
      'email',
    )
    assert.equal(empty.phone, '')

    const fromProfile = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'a@example.com', phone: '' },
      {
        ...names,
        email: 'a@example.com',
        phone: '+421900000009',
        user: { email: 'a@example.com', phone: '+421900000009' },
      },
      'email',
    )
    assert.equal(fromProfile.phone, '+421900000009')
  })

  it('D: phone auth + empty email fills User.email when present, else stays empty', () => {
    const empty = buildVerifiedCheckoutContactPatch(
      { ...names, email: '', phone: '+421900000002' },
      { ...names, email: '', phone: '+421900000002', user: { email: null, phone: '+421900000002' } },
      'sms',
    )
    assert.equal(empty.email, '')

    const fromProfile = buildVerifiedCheckoutContactPatch(
      { ...names, email: '', phone: '+421900000002' },
      {
        ...names,
        email: 'b@example.com',
        phone: '+421900000002',
        user: { email: 'b@example.com', phone: '+421900000002' },
      },
      'sms',
    )
    assert.equal(fromProfile.email, 'b@example.com')
  })

  it('E: conflict email auth keeps typed phone B (does not take User A phone)', () => {
    const patch = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'a@example.com', phone: '+421900000002' },
      { ...names, email: 'a@example.com', phone: '', user: { email: 'a@example.com', phone: null } },
      'email',
    )
    assert.equal(patch.email, 'a@example.com')
    assert.equal(patch.phone, '+421900000002')
  })

  it('F: conflict phone auth keeps typed email A (does not drop it for User B)', () => {
    const patch = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'a@example.com', phone: '+421900000002' },
      { ...names, email: '', phone: '+421900000002', user: { email: null, phone: '+421900000002' } },
      'sms',
    )
    assert.equal(patch.phone, '+421900000002')
    assert.equal(patch.email, 'a@example.com')
  })

  it('prefers typed sibling over a different contact already on the User', () => {
    const emailAuth = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'a@example.com', phone: '+421900000002' },
      {
        ...names,
        email: 'a@example.com',
        phone: '+421900000099',
        user: { email: 'a@example.com', phone: '+421900000099' },
      },
      'email',
    )
    assert.equal(emailAuth.phone, '+421900000002')

    const phoneAuth = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'typed@example.com', phone: '+421900000002' },
      {
        ...names,
        email: 'b@example.com',
        phone: '+421900000002',
        user: { email: 'b@example.com', phone: '+421900000002' },
      },
      'sms',
    )
    assert.equal(phoneAuth.email, 'typed@example.com')
  })

  it('syncs the proven channel from the authenticated User', () => {
    const emailAuth = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'typed-alias@example.com', phone: '+421900000002' },
      { ...names, email: 'a@example.com', phone: '', user: { email: 'a@example.com', phone: null } },
      'email',
    )
    assert.equal(emailAuth.email, 'a@example.com')

    const phoneAuth = buildVerifiedCheckoutContactPatch(
      { ...names, email: 'a@example.com', phone: '+421900000002' },
      {
        ...names,
        email: '',
        phone: '+421900000002',
        user: { email: null, phone: '+421900000002' },
      },
      'sms',
    )
    assert.equal(phoneAuth.phone, '+421900000002')
  })
})
