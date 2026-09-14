import { extractCustomerErrorCode } from './extract-customer-error-code'

type ApiErrorTranslator = ((key: string) => string) & {
  has?: (key: string) => boolean
}

/**
 * Map Nest `{ code, message }` to a storefront next-intl `apiErrors.*` key.
 * Falls back to generic when code unknown — avoids leaking raw UA Nest messages.
 */
export function mapCustomerApiError(
  body: unknown,
  t: ApiErrorTranslator,
  fallbackKey = 'generic',
): string {
  const code = extractCustomerErrorCode(body)
  if (code) {
    const known = typeof t.has === 'function' ? t.has(code) : true
    if (known) {
      try {
        const translated = t(code)
        if (translated && translated !== code) return translated
      } catch {
        // missing key
      }
    }
  }
  try {
    return t(fallbackKey)
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

export function mapCustomerApiErrorFromResponse(
  data: unknown,
  t: ApiErrorTranslator,
  fallbackKey = 'generic',
): string {
  return mapCustomerApiError(data, t, fallbackKey)
}
