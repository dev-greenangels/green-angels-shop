'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

import { googleConsentFromCookie } from '@/lib/analytics/consent-mode'
import { pushGoogleConsentUpdate } from '@/lib/analytics/push-consent-update'

import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  parseCookieConsent,
  serializeCookieConsent,
  type CookieConsentValue,
} from './cookie-consent'

export type CookieConsentPreferences = {
  analytics: boolean
  marketing: boolean
}

function readCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row === name || row.startsWith(`${name}=`))
  if (!match) return null
  const [, value] = match.split('=')
  return value ? decodeURIComponent(value) : null
}

/**
 * One HTTP request; backend expands into independent COOKIES_ANALYTICS +
 * COOKIES_MARKETING audit rows. Does not use purpose MARKETING (email newsletter).
 */
function recordCookieConsentEvent(input: {
  analytics: boolean
  marketing: boolean
  locale: string
  anonymousId: string
}) {
  void fetch('/api/legal/consents', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      purpose: 'COOKIES_ANALYTICS',
      // Envelope only; backend derives per-category actions from analytics/marketing.
      action: input.analytics ? 'GRANTED' : 'WITHDRAWN',
      locale: input.locale,
      source: 'COOKIE_BANNER',
      anonymousConsentId: input.anonymousId,
      analytics: input.analytics,
      marketing: input.marketing,
      metadata: {
        analytics: input.analytics,
        marketing: input.marketing,
      },
    }),
  }).catch(() => {})
}

export function useCookieConsent() {
  const router = useRouter()
  const locale = useLocale()
  const [consent, setConsent] = useState<CookieConsentValue | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConsent(parseCookieConsent(readCookieValue(COOKIE_CONSENT_COOKIE_NAME)))
    setHydrated(true)
  }, [])

  const saveConsent = useCallback(
    (prefs: CookieConsentPreferences) => {
      const anonymousId =
        consent?.anonymousId ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `anon-${Date.now()}`)
      const value: CookieConsentValue = {
        analytics: prefs.analytics === true,
        marketing: prefs.marketing === true,
        updatedAt: new Date().toISOString(),
        anonymousId,
      }
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
      document.cookie = [
        `${COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(serializeCookieConsent(value))}`,
        'path=/',
        `max-age=${COOKIE_CONSENT_MAX_AGE_SECONDS}`,
        'samesite=lax',
        secure ? 'secure' : '',
      ]
        .filter(Boolean)
        .join('; ')
      setConsent(value)
      pushGoogleConsentUpdate(googleConsentFromCookie(value))
      recordCookieConsentEvent({
        analytics: value.analytics,
        marketing: value.marketing,
        locale,
        anonymousId,
      })
      router.refresh()
      return value
    },
    [consent?.anonymousId, locale, router],
  )

  return { consent, hydrated, saveConsent }
}
