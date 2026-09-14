import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildOrderTimeline,
  canManualErpSync,
  taxRegimeLabel,
} from './order-detail-helpers'

describe('order detail helpers', () => {
  it('canManualErpSync allows FAILED and hides SYNCED', () => {
    assert.equal(
      canManualErpSync({
        erpSyncStatus: 'FAILED',
        erpNativeId: null,
        erpNativeKod: null,
      }),
      true,
    )
    assert.equal(
      canManualErpSync({
        erpSyncStatus: 'SYNCED',
        erpNativeId: '1',
        erpNativeKod: 'OBJ123',
      }),
      false,
    )
  })

  it('taxRegimeLabel is human-readable for seller/destination', () => {
    assert.match(taxRegimeLabel('seller'), /Seller VAT/i)
    assert.match(taxRegimeLabel('destination'), /Destination VAT/i)
  })

  it('buildOrderTimeline includes created and optional paid/cancelled', () => {
    const events = buildOrderTimeline({
      createdAt: '2026-09-11T10:00:00.000Z',
      paidAt: '2026-09-11T10:05:00.000Z',
      cancelledAt: null,
      erpSyncedAt: null,
      erpLastSyncAt: null,
      shippedAt: null,
      deliveredAt: null,
    } as Parameters<typeof buildOrderTimeline>[0])
    assert.equal(events[0]?.key, 'created')
    assert.ok(events.some((e) => e.key === 'paid'))
  })
})
