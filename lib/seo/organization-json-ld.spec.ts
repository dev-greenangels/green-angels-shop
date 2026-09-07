import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_STORE_SETTINGS } from '../settings/defaults'
import { buildOrganizationJsonLd } from './organization-json-ld'

describe('buildOrganizationJsonLd', () => {
  it('does not copy UA default address onto an SK host', () => {
    const json = buildOrganizationJsonLd({
      origin: 'https://green-angels.sk',
      name: 'Green Angels',
      store: DEFAULT_STORE_SETTINGS,
      marketRegion: 'sk',
      storeUnavailable: false,
    })
    assert.ok(json)
    assert.equal('address' in json!, false)
  })

  it('emits email and contactPoint when store has a contact email', () => {
    const json = buildOrganizationJsonLd({
      origin: 'https://green-angels.sk',
      name: 'Green Angels',
      store: {
        ...DEFAULT_STORE_SETTINGS,
        emails: [{ label: 'Support', email: 'info@green-angels.sk' }],
        phones: [{ label: 'Support', phone: '+421900000000' }],
      },
      marketRegion: 'sk',
      storeUnavailable: false,
    })
    assert.ok(json)
    assert.equal(json!.email, 'info@green-angels.sk')
    assert.deepEqual(json!.contactPoint, {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: '+421900000000',
      email: 'info@green-angels.sk',
    })
  })
})
