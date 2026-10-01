import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { shouldClearViesOnVatChange } from '../../components/checkout/checkout-vat-id-field'
import {
  resolveCheckoutViesUiState,
  resolveViesStatus,
  viesRequestKey,
} from './vies-status'

describe('checkout VIES stale/race helpers', () => {
  it('clears previous VALID when VAT digits change', () => {
    assert.equal(shouldClearViesOnVatChange('PL:1111111111', 'PL', '2222222222'), true)
    assert.equal(shouldClearViesOnVatChange('PL:1111111111', 'PL', '1111111111'), false)
  })

  it('clears previous VALID when VAT country changes', () => {
    assert.equal(shouldClearViesOnVatChange('PL:1111111111', 'CZ', '1111111111'), true)
  })

  it('viesRequestKey matches country+digits identity', () => {
    assert.equal(viesRequestKey('pl', '12 34'), 'PL:1234')
    assert.equal(viesRequestKey('EL', '123456789'), 'EL:123456789')
  })

  it('UI state distinguishes EMPTY / CHECKING / VALID / INVALID / ERROR / FORMAT', () => {
    assert.equal(
      resolveCheckoutViesUiState({ vatDigits: '', loading: false, result: null }),
      'EMPTY',
    )
    assert.equal(
      resolveCheckoutViesUiState({ vatDigits: '123456', loading: true, result: null }),
      'CHECKING',
    )
    assert.equal(
      resolveCheckoutViesUiState({
        vatDigits: '12',
        loading: false,
        result: { valid: null, source: 'format' },
      }),
      'FORMAT',
    )
    assert.equal(
      resolveCheckoutViesUiState({
        vatDigits: '1234567890',
        loading: false,
        result: { valid: true, source: 'vies_rest' },
      }),
      'VALID',
    )
    assert.equal(
      resolveCheckoutViesUiState({
        vatDigits: '1234567890',
        loading: false,
        result: { valid: false, source: 'vies_rest' },
      }),
      'INVALID',
    )
    assert.equal(
      resolveCheckoutViesUiState({
        vatDigits: '1234567890',
        loading: false,
        result: { valid: null, source: 'unavailable' },
      }),
      'ERROR',
    )
  })

  it('order-level resolveViesStatus: ERROR vs NOT_CHECKED', () => {
    assert.equal(resolveViesStatus({ viesCheck: null }), 'NOT_CHECKED')
    assert.equal(
      resolveViesStatus({ viesCheck: { valid: null, source: 'unavailable' } }),
      'ERROR',
    )
    assert.equal(
      resolveViesStatus({ viesCheck: { valid: false, source: 'vies_rest' } }),
      'INVALID',
    )
  })
})
