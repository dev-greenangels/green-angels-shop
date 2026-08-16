import 'server-only'

import { cookies } from 'next/headers'

import { COOKIE_CONSENT_COOKIE_NAME, parseCookieConsent, type CookieConsentValue } from './cookie-consent'

/** Читає згоду на cookie на сервері (SSR/RSC) — використовується для гейту Vercel Analytics. */
export async function getCookieConsent(): Promise<CookieConsentValue | null> {
  const store = await cookies()
  return parseCookieConsent(store.get(COOKIE_CONSENT_COOKIE_NAME)?.value ?? null)
}
