import { mapCustomerApiError } from '@/lib/api/map-customer-error'

type ApiErrorTranslator = ((key: string) => string) & {
  has?: (key: string) => boolean
}

/** Map account BFF/Nest errors to next-intl `apiErrors.*` (never raw UA Nest text). */
export function mapAccountError(
  err: unknown,
  t: ApiErrorTranslator,
  fallbackKey = 'generic',
): string {
  const e = err as Error & { code?: string; body?: unknown }
  if (e?.code) {
    return mapCustomerApiError({ code: e.code }, t, fallbackKey)
  }
  if (e?.body) {
    return mapCustomerApiError(e.body, t, fallbackKey)
  }
  return mapCustomerApiError(null, t, fallbackKey)
}
