import type { CookieConsentValue } from '@/lib/legal/cookie-consent'

export type GoogleConsentSignal = 'granted' | 'denied'

export type GoogleConsentState = {
  analytics_storage: GoogleConsentSignal
  ad_storage: GoogleConsentSignal
  ad_user_data: GoogleConsentSignal
  ad_personalization: GoogleConsentSignal
}

export const GOOGLE_CONSENT_DENIED: GoogleConsentState = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
}

export type ConsentPreferences = {
  analytics: boolean
  marketing?: boolean
}

/** Maps stored cookie / UI preferences to Google Consent Mode v2 signals. */
export function googleConsentFromPreferences(prefs: ConsentPreferences): GoogleConsentState {
  const analytics = prefs.analytics === true
  const marketing = prefs.marketing === true

  return {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
  }
}

export function googleConsentFromCookie(consent: CookieConsentValue | null): GoogleConsentState {
  if (!consent) return { ...GOOGLE_CONSENT_DENIED }
  return googleConsentFromPreferences({ analytics: consent.analytics })
}

export function googleConsentRejectAll(): GoogleConsentState {
  return { ...GOOGLE_CONSENT_DENIED }
}

/** All signals granted — used when marketing category exists or explicit accept-all CMP action. */
export function googleConsentAcceptAll(): GoogleConsentState {
  return googleConsentFromPreferences({ analytics: true, marketing: true })
}

const CONSENT_DEFAULT_WAIT_MS = 500

export function buildConsentBootstrapScript(initialConsent: CookieConsentValue | null): string {
  const defaultState = {
    ...GOOGLE_CONSENT_DENIED,
    wait_for_update: CONSENT_DEFAULT_WAIT_MS,
  }

  const lines = [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    `gtag('consent', 'default', ${JSON.stringify(defaultState)});`,
  ]

  if (initialConsent) {
    const restored = googleConsentFromCookie(initialConsent)
    lines.push(`gtag('consent', 'update', ${JSON.stringify(restored)});`)
  }

  return lines.join('\n')
}

export function buildConsentUpdateCall(state: GoogleConsentState): string {
  return `gtag('consent', 'update', ${JSON.stringify(state)});`
}
