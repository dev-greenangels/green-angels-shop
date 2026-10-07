import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildOrderTimeline,
  canManualErpSync,
  resolveOrderPackingView,
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

  it('canManualErpSync allows retry when Stripe payment FAILED even if Received Order SYNCED', () => {
    assert.equal(
      canManualErpSync({
        erpSyncStatus: 'SYNCED',
        erpNativeId: '151',
        erpNativeKod: 'OBP0013/2026',
        erpAdvanceSyncStatus: 'SYNCED',
        erpStripePaySyncStatus: 'FAILED',
      }),
      true,
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

  it('resolveOrderPackingView hides difference until packing completed', () => {
    const notPacked = resolveOrderPackingView({
      packagingBoxCount: 2,
      packagingPalletCount: null,
      packagingAmount: 3,
      packing: {
        phase: 'not_started',
        estimatedBoxCount: 2,
        estimatedPalletCount: null,
        packagingAmount: 3,
        actualPackageCount: 0,
        boxDifference: null,
        packingCompletedAt: null,
      },
    })
    assert.equal(notPacked.phase, 'not_started')
    assert.equal(notPacked.boxDifference, null)

    const inProgress = resolveOrderPackingView({
      packagingBoxCount: 2,
      packagingPalletCount: null,
      packagingAmount: 3,
      packing: {
        phase: 'in_progress',
        estimatedBoxCount: 2,
        estimatedPalletCount: null,
        packagingAmount: 3,
        actualPackageCount: 3,
        boxDifference: null,
        packingCompletedAt: null,
      },
    })
    assert.equal(inProgress.phase, 'in_progress')
    assert.equal(inProgress.actualPackageCount, 3)
    assert.equal(inProgress.boxDifference, null)

    const completed = resolveOrderPackingView({
      packagingBoxCount: 2,
      packagingPalletCount: null,
      packagingAmount: 3,
      packing: {
        phase: 'completed',
        estimatedBoxCount: 2,
        estimatedPalletCount: null,
        packagingAmount: 3,
        actualPackageCount: 3,
        boxDifference: 1,
        packingCompletedAt: '2026-10-08T12:00:00.000Z',
      },
    })
    assert.equal(completed.boxDifference, 1)
  })
})
