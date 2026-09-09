import { cache } from 'react'

/**
 * Per-request correlation id for SSR timing logs (no user data).
 * Deduped via React cache() within one render.
 */
export const getSsrRequestId = cache((): string => {
  return `ssr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
})

export function resolveSsrRequestId(): string {
  try {
    return getSsrRequestId()
  } catch {
    return 'ssr_na'
  }
}
