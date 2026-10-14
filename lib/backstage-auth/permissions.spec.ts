import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { canAccessBackstagePath, hasAnyPermission } from './permissions'

describe('backstage permissions helpers', () => {
  it('ADMIN always allowed', () => {
    assert.equal(hasAnyPermission([], 'ADMIN', ['orders.view']), true)
    assert.equal(canAccessBackstagePath('/backstage/orders', [], 'ADMIN'), true)
  })

  it('MANAGER without grants denied', () => {
    assert.equal(hasAnyPermission([], 'MANAGER', ['orders.view']), false)
    assert.equal(canAccessBackstagePath('/backstage/orders', [], 'MANAGER'), false)
  })

  it('MANAGER sidebar/path gated by grants', () => {
    assert.equal(
      canAccessBackstagePath('/backstage/orders', ['orders.view'], 'MANAGER'),
      true,
    )
    assert.equal(
      canAccessBackstagePath('/backstage/orders', ['catalog.view'], 'MANAGER'),
      false,
    )
    assert.equal(
      canAccessBackstagePath('/backstage/settings', ['settings.view'], 'MANAGER'),
      true,
    )
  })

  it('overview requires backoffice.access', () => {
    assert.equal(
      canAccessBackstagePath('/backstage', ['backoffice.access'], 'MANAGER'),
      true,
    )
    assert.equal(canAccessBackstagePath('/backstage', ['orders.view'], 'MANAGER'), false)
  })

  it('photos.view opens photos path; photos.manage also', () => {
    assert.equal(
      canAccessBackstagePath('/backstage/photos', ['photos.view'], 'MANAGER'),
      true,
    )
    assert.equal(
      canAccessBackstagePath('/backstage/photos', ['photos.manage'], 'MANAGER'),
      true,
    )
    assert.equal(
      canAccessBackstagePath('/backstage/photos', ['catalog.view'], 'MANAGER'),
      false,
    )
  })
})
