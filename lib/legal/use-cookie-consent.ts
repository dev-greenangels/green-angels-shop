'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  parseCookieConsent,
  serializeCookieConsent,
  type CookieConsentValue,
} from './cookie-consent'

function readCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row === name || row.startsWith(`${name}=`))
  if (!match) return null
  const [, value] = match.split('=')
  return value ? decodeURIComponent(value) : null
}

function recordCookieConsentEvent(input: {
  analytics: boolean
  locale: string
  anonymousId: string
}) {
  void fetch('/api/legal/consents', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      purpose: 'COOKIES_ANALYTICS',
      action: input.analytics ? 'GRANTED' : 'WITHDRAWN',
      locale: input.locale,
      source: 'COOKIE_BANNER',
      anonymousConsentId: input.anonymousId,
      analytics: input.analytics,
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
    (analytics: boolean) => {
      const anonymousId =
        consent?.anonymousId ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `anon-${Date.now()}`)
      const value: CookieConsentValue = {
        analytics,
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
      recordCookieConsentEvent({ analytics, locale, anonymousId })
      router.refresh()
      return value
    },
    [consent?.anonymousId, locale, router],
  )

  return { consent, hydrated, saveConsent }
}
