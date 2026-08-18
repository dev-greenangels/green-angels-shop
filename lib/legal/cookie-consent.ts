export const COOKIE_CONSENT_COOKIE_NAME = 'ga-cookie-consent'

/** ~180 днів — типовий строк дії для банера згоди на cookie. */
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

export type CookieConsentValue = {
  analytics: boolean
  updatedAt: string
  anonymousId?: string
}

export function parseCookieConsent(raw: string | null | undefined): CookieConsentValue | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const record = parsed as Record<string, unknown>
    const updatedAt = typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString()
    const anonymousId = typeof record.anonymousId === 'string' ? record.anonymousId : undefined
    return { analytics: Boolean(record.analytics), updatedAt, anonymousId }
  } catch {
    return null
  }
}

export function serializeCookieConsent(value: CookieConsentValue): string {
  return JSON.stringify(value)
}
