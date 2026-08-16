'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

export function useCookieConsent() {
  const router = useRouter()
  const [consent, setConsent] = useState<CookieConsentValue | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setConsent(parseCookieConsent(readCookieValue(COOKIE_CONSENT_COOKIE_NAME)))
    setHydrated(true)
  }, [])

  const saveConsent = useCallback(
    (analytics: boolean) => {
      const value: CookieConsentValue = { analytics, updatedAt: new Date().toISOString() }
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
      router.refresh()
      return value
    },
    [router],
  )

  return { consent, hydrated, saveConsent }
}
