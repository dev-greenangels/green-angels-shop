import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseCookieConsent, serializeCookieConsent, type CookieConsentValue } from './cookie-consent'

describe('parseCookieConsent', () => {
  it('returns null when cookie is missing or empty', () => {
    assert.equal(parseCookieConsent(null), null)
    assert.equal(parseCookieConsent(undefined), null)
    assert.equal(parseCookieConsent(''), null)
  })

  it('returns null for malformed JSON', () => {
    assert.equal(parseCookieConsent('not-json'), null)
    assert.equal(parseCookieConsent('{'), null)
  })

  it('returns null for non-object JSON', () => {
    assert.equal(parseCookieConsent('null'), null)
    assert.equal(parseCookieConsent('[]'), null)
    assert.equal(parseCookieConsent('"x"'), null)
    assert.equal(parseCookieConsent('1'), null)
  })

  it('returns null for empty object', () => {
    assert.equal(parseCookieConsent('{}'), null)
  })

  it('returns null for legacy analytics-only cookies', () => {
    assert.equal(parseCookieConsent(JSON.stringify({ analytics: true })), null)
    assert.equal(
      parseCookieConsent(
        JSON.stringify({
          analytics: false,
          updatedAt: '2026-01-01T00:00:00.000Z',
          anonymousId: 'x',
        }),
      ),
      null,
    )
  })

  it('returns null when analytics or marketing is missing or non-boolean', () => {
    assert.equal(parseCookieConsent(JSON.stringify({ marketing: false })), null)
    assert.equal(parseCookieConsent(JSON.stringify({ analytics: true, marketing: 'no' })), null)
    assert.equal(parseCookieConsent(JSON.stringify({ analytics: 'yes', marketing: false })), null)
    assert.equal(parseCookieConsent(JSON.stringify({ analytics: 1, marketing: 0 })), null)
  })

  it('accepts a valid analytics + marketing cookie', () => {
    const raw = JSON.stringify({
      analytics: true,
      marketing: false,
      updatedAt: '2026-01-01T00:00:00.000Z',
      anonymousId: 'anon-1',
    })
    assert.deepEqual(parseCookieConsent(raw), {
      analytics: true,
      marketing: false,
      updatedAt: '2026-01-01T00:00:00.000Z',
      anonymousId: 'anon-1',
    })
  })

  it('round-trips serialize + parse for all boolean combinations', () => {
    const combos: Array<Pick<CookieConsentValue, 'analytics' | 'marketing'>> = [
      { analytics: false, marketing: false },
      { analytics: true, marketing: false },
      { analytics: false, marketing: true },
      { analytics: true, marketing: true },
    ]
    for (const prefs of combos) {
      const value: CookieConsentValue = {
        ...prefs,
        updatedAt: '2026-02-01T00:00:00.000Z',
      }
      assert.deepEqual(parseCookieConsent(serializeCookieConsent(value)), value)
    }
  })
})

describe('banner visibility from consent cookie', () => {
  it('fresh visitor / invalid old cookie → banner shown (consent null)', () => {
    assert.equal(parseCookieConsent(null), null)
    assert.equal(parseCookieConsent(JSON.stringify({ analytics: true })), null)
  })

  it('valid new cookie → banner hidden (consent non-null)', () => {
    const consent = parseCookieConsent(
      JSON.stringify({ analytics: true, marketing: false, updatedAt: '2026-01-01T00:00:00.000Z' }),
    )
    assert.ok(consent)
    assert.equal(consent!.analytics, true)
    assert.equal(consent!.marketing, false)
  })
})

describe('Vercel Analytics gate', () => {
  function vercelAnalyticsAllowed(
    consent: CookieConsentValue | null,
    nodeEnv: string,
    isBackstage = false,
  ) {
    return !isBackstage && nodeEnv === 'production' && consent?.analytics === true
  }

  it('enables only when analytics is true in production', () => {
    const base = { marketing: false, updatedAt: '2026-01-01T00:00:00.000Z' }
    assert.equal(vercelAnalyticsAllowed({ ...base, analytics: true }, 'production'), true)
    assert.equal(vercelAnalyticsAllowed({ ...base, analytics: false }, 'production'), false)
    assert.equal(
      vercelAnalyticsAllowed({ analytics: true, marketing: true, updatedAt: base.updatedAt }, 'production'),
      true,
    )
    assert.equal(
      vercelAnalyticsAllowed({ analytics: false, marketing: true, updatedAt: base.updatedAt }, 'production'),
      false,
    )
    assert.equal(vercelAnalyticsAllowed({ ...base, analytics: true }, 'development'), false)
    assert.equal(vercelAnalyticsAllowed(null, 'production'), false)
  })

  it('stays off on backstage even with analytics consent', () => {
    const base = { marketing: false, updatedAt: '2026-01-01T00:00:00.000Z' }
    assert.equal(vercelAnalyticsAllowed({ ...base, analytics: true }, 'production', true), false)
  })
})
