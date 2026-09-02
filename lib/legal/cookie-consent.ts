export const COOKIE_CONSENT_COOKIE_NAME = 'ga-cookie-consent'

/** ~180 днів — типовий строк дії для банера згоди на cookie. */
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

export type CookieConsentValue = {
  analytics: boolean
  marketing: boolean
  updatedAt: string
  anonymousId?: string
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Valid consent requires explicit boolean `analytics` and `marketing`.
 * Legacy analytics-only cookies (and other incomplete shapes) return null
 * so the banner is shown again — no silent defaults.
 */
export function parseCookieConsent(raw: string | null | undefined): CookieConsentValue | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isPlainObject(parsed)) return null
    if (typeof parsed.analytics !== 'boolean') return null
    if (typeof parsed.marketing !== 'boolean') return null
    const updatedAt =
      typeof parsed.updatedAt === 'string' && parsed.updatedAt.trim()
        ? parsed.updatedAt
        : new Date().toISOString()
    const anonymousId = typeof parsed.anonymousId === 'string' ? parsed.anonymousId : undefined
    return {
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      updatedAt,
      ...(anonymousId ? { anonymousId } : {}),
    }
  } catch {
    return null
  }
}

export function serializeCookieConsent(value: CookieConsentValue): string {
  return JSON.stringify(value)
}
