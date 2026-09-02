import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildConsentBootstrapScript,
  googleConsentAcceptAll,
  googleConsentFromCookie,
  googleConsentFromPreferences,
  googleConsentRejectAll,
  GOOGLE_CONSENT_DENIED,
} from './consent-mode'

describe('googleConsentFromPreferences', () => {
  it('defaults all signals to denied', () => {
    assert.deepEqual(googleConsentFromPreferences({ analytics: false }), GOOGLE_CONSENT_DENIED)
    assert.deepEqual(googleConsentFromPreferences({ analytics: false, marketing: false }), GOOGLE_CONSENT_DENIED)
  })

  it('grants analytics only when marketing is not accepted', () => {
    assert.deepEqual(googleConsentFromPreferences({ analytics: true }), {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
  })

  it('grants marketing signals only when marketing is accepted', () => {
    assert.deepEqual(googleConsentFromPreferences({ analytics: false, marketing: true }), {
      analytics_storage: 'denied',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    })
  })
})

describe('googleConsentFromCookie', () => {
  it('returns denied defaults when cookie is missing', () => {
    assert.deepEqual(googleConsentFromCookie(null), GOOGLE_CONSENT_DENIED)
  })

  it('restores analytics-only consent from stored cookie', () => {
    assert.deepEqual(
      googleConsentFromCookie({
        analytics: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      },
    )
  })

  it('maps reject-all cookie to denied signals', () => {
    assert.deepEqual(
      googleConsentFromCookie({
        analytics: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      GOOGLE_CONSENT_DENIED,
    )
  })
})

describe('accept / reject helpers', () => {
  it('reject all denies every signal', () => {
    assert.deepEqual(googleConsentRejectAll(), GOOGLE_CONSENT_DENIED)
  })

  it('accept all grants every signal', () => {
    assert.deepEqual(googleConsentAcceptAll(), {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    })
  })
})

describe('buildConsentBootstrapScript', () => {
  it('sets default consent to denied before GTM', () => {
    const script = buildConsentBootstrapScript(null)
    assert.match(script, /gtag\('consent', 'default'/)
    assert.match(script, /"analytics_storage":"denied"/)
    assert.match(script, /"ad_storage":"denied"/)
    assert.match(script, /"ad_user_data":"denied"/)
    assert.match(script, /"ad_personalization":"denied"/)
    assert.match(script, /"wait_for_update":500/)
    assert.doesNotMatch(script, /gtag\('consent', 'update'/)
  })

  it('restores stored preference before GTM when cookie exists', () => {
    const script = buildConsentBootstrapScript({
      analytics: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    assert.match(script, /gtag\('consent', 'update'/)
    assert.match(script, /"analytics_storage":"granted"/)
    assert.match(script, /"ad_storage":"denied"/)
  })
})
