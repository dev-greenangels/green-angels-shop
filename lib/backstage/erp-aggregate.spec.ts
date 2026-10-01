import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  resolveBankPayDisplayStatus,
  resolveErpAggregateLabel,
  resolveErpDocumentStages,
} from './erp-aggregate'

describe('resolveErpDocumentStages', () => {
  it('CARD has Received Order + ZÁLOHA + Stripe payment', () => {
    assert.deepEqual(resolveErpDocumentStages('card-online'), [
      'received',
      'advance',
      'stripePay',
    ])
  })

  it('BANK has Received Order + ZÁLOHA + Bank payment', () => {
    assert.deepEqual(resolveErpDocumentStages('bank-transfer'), [
      'received',
      'advance',
      'bankPay',
    ])
  })

  it('COD does not require ZÁLOHA / Stripe / Bank payment', () => {
    assert.deepEqual(resolveErpDocumentStages('dobierka'), ['received'])
  })
})

describe('resolveBankPayDisplayStatus', () => {
  it('WAITING when unpaid', () => {
    assert.equal(
      resolveBankPayDisplayStatus({ paymentStatus: null, erpBankPaySyncStatus: 'WAITING' }),
      'WAITING',
    )
  })

  it('FAILED after paid when ERP failed', () => {
    assert.equal(
      resolveBankPayDisplayStatus({
        paymentStatus: 'success',
        erpBankPaySyncStatus: 'FAILED',
      }),
      'FAILED',
    )
  })
})

describe('resolveErpAggregateLabel', () => {
  it('shows PARTIAL when Received Order SYNCED but Stripe payment FAILED', () => {
    assert.equal(
      resolveErpAggregateLabel({
        paymentMethod: 'card-online',
        erpSyncStatus: 'SYNCED',
        erpAdvanceSyncStatus: 'SYNCED',
        erpStripePaySyncStatus: 'FAILED',
      }),
      'PARTIAL',
    )
  })

  it('BANK unpaid: SYNCED received+advance + WAITING bank → PARTIAL', () => {
    assert.equal(
      resolveErpAggregateLabel({
        paymentMethod: 'bank-transfer',
        paymentStatus: null,
        erpSyncStatus: 'SYNCED',
        erpAdvanceSyncStatus: 'SYNCED',
        erpBankPaySyncStatus: 'WAITING',
      }),
      'PARTIAL',
    )
  })

  it('BANK paid + BANKPAY SYNCED → SYNCED', () => {
    assert.equal(
      resolveErpAggregateLabel({
        paymentMethod: 'bank-transfer',
        paymentStatus: 'success',
        erpSyncStatus: 'SYNCED',
        erpAdvanceSyncStatus: 'SYNCED',
        erpBankPaySyncStatus: 'SYNCED',
      }),
      'SYNCED',
    )
  })

  it('BANK paid + BANKPAY FAILED → PARTIAL', () => {
    assert.equal(
      resolveErpAggregateLabel({
        paymentMethod: 'bank-transfer',
        paymentStatus: 'success',
        erpSyncStatus: 'SYNCED',
        erpAdvanceSyncStatus: 'SYNCED',
        erpBankPaySyncStatus: 'FAILED',
      }),
      'PARTIAL',
    )
  })

  it('COD aggregate ignores advance/stripe/bank even if present', () => {
    assert.equal(
      resolveErpAggregateLabel({
        paymentMethod: 'dobierka',
        erpSyncStatus: 'SYNCED',
        erpAdvanceSyncStatus: 'FAILED',
        erpStripePaySyncStatus: 'FAILED',
        erpBankPaySyncStatus: 'FAILED',
      }),
      'SYNCED',
    )
  })
})
