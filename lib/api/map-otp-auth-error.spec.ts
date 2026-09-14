import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { mapOtpAuthErrorMessage } from './map-otp-auth-error'

const MESSAGES: Record<string, string> = {
  generic: 'Something went wrong.',
  OTP_INVALID: 'Invalid code.',
  OTP_EXPIRED: 'Code expired.',
  OTP_SEND_FAILED: 'Could not send.',
}

function tApi(key: string) {
  if (!(key in MESSAGES)) throw new Error(`missing ${key}`)
  return MESSAGES[key]
}
tApi.has = (key: string) => key in MESSAGES

describe('mapOtpAuthErrorMessage', () => {
  it('maps known codes', () => {
    assert.equal(mapOtpAuthErrorMessage('OTP_INVALID', tApi, 'fb'), 'Invalid code.')
    assert.equal(mapOtpAuthErrorMessage('OTP_EXPIRED', tApi, 'fb'), 'Code expired.')
  })

  it('maps raw Ukrainian Nest prose to generic', () => {
    assert.equal(
      mapOtpAuthErrorMessage('SMS OTP вимкнено для цієї поверхні.', tApi, 'fb'),
      'Something went wrong.',
    )
    assert.equal(
      mapOtpAuthErrorMessage('Невірний код.', tApi, 'fb'),
      'Something went wrong.',
    )
  })

  it('maps unknown spaced English prose to generic', () => {
    assert.equal(
      mapOtpAuthErrorMessage('Unexpected upstream failure', tApi, 'fb'),
      'Something went wrong.',
    )
  })
})
