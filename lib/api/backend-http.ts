import { getBackendApiUrl } from '@/lib/api/backend-url'
import { resolveSsrRequestId } from '@/lib/api/ssr-request-id'

/** Pathname only — strip query to avoid logging PII in values. */
export function sanitizeBackendPathname(path: string): string {
  const raw = path.trim()
  const withoutQuery = raw.split('?')[0] || raw
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
}

/**
 * Nest HTTP with production-safe timing logs.
 * Does not log cookies, tokens, query values, or bodies.
 */
export async function fetchBackendHttp(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase()
  const pathname = sanitizeBackendPathname(path)
  const started = performance.now()
  let status = 0

  try {
    const res = await fetch(`${getBackendApiUrl()}${path}`, init)
    status = res.status
    return res
  } finally {
    const ms = Math.round(performance.now() - started)
    const rid = resolveSsrRequestId()
    console.info(`[backend-timing] ${rid} ${method} ${pathname} ${ms}ms ${status || 'ERR'}`)
  }
}
