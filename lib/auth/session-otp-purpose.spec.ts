import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  normalizeSessionOtpPurpose,
  SESSION_OTP_PURPOSES,
} from './session-otp-purpose'

describe('normalizeSessionOtpPurpose (shop)', () => {
  it('defaults omitted / unknown to login', () => {
    assert.equal(normalizeSessionOtpPurpose(undefined), 'login')
    assert.equal(normalizeSessionOtpPurpose(null), 'login')
    assert.equal(normalizeSessionOtpPurpose('checkout'), 'login')
    assert.equal(normalizeSessionOtpPurpose('profile'), 'login')
  })

  it('accepts review', () => {
    assert.equal(normalizeSessionOtpPurpose('review'), 'review')
    assert.deepEqual([...SESSION_OTP_PURPOSES], ['login', 'review'])
  })
})
