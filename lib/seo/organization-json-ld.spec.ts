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
})
