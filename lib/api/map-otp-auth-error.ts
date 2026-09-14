/**
 * Map OTP/auth Error.message (often a stable Nest `code`) to locale-safe copy.
 * Never surfaces raw Ukrainian Nest prose to non-uk storefronts.
 */

type ApiErrorTranslator = ((key: string) => string) & {
  has?: (key: string) => boolean
}

const KNOWN_OTP_AUTH_CODES = [
  'OTP_INVALID',
  'OTP_EXPIRED',
  'OTP_REQUIRED_CONTACT',
  'AUTH_INVALID_CREDENTIALS',
  'OTP_RATE_LIMITED',
  'API_UNAVAILABLE',
  'OTP_SMS_DISABLED',
  'OTP_EMAIL_DISABLED',
  'OTP_SEND_FAILED',
] as const

export function mapOtpAuthErrorMessage(
  message: string,
  tApi: ApiErrorTranslator,
  fallback: string,
): string {
  const trimmed = message.trim()
  if (!trimmed) return fallback

  const known =
    typeof tApi.has === 'function'
      ? tApi.has(trimmed)
      : (KNOWN_OTP_AUTH_CODES as readonly string[]).includes(trimmed)

  if (known) {
    try {
      const translated = tApi(trimmed)
      if (translated && translated !== trimmed) return translated
    } catch {
      // missing key
    }
  }

  if ((KNOWN_OTP_AUTH_CODES as readonly string[]).includes(trimmed)) {
    try {
      return tApi(trimmed)
    } catch {
      return fallback
    }
  }

  // Raw Nest UA (or other unexpected prose) → locale-safe generic.
  if (/[А-Яа-яЁёІіЇїЄє]/.test(trimmed) || trimmed.includes(' ')) {
    try {
      return tApi('generic')
    } catch {
      return fallback
    }
  }

  return fallback
}

export function mapOtpAuthError(
  error: unknown,
  tApi: ApiErrorTranslator,
  fallback: string,
): string {
  if (error instanceof Error) {
    return mapOtpAuthErrorMessage(error.message, tApi, fallback)
  }
  return fallback
}
