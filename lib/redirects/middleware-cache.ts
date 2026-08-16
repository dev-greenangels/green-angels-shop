import { getBackendApiUrl } from '@/lib/api/backend-url'

type ActiveRedirectEntry = {
  toPath: string
  statusCode: number
}

type RedirectCacheState = {
  map: Record<string, ActiveRedirectEntry>
  loadedAt: number
}

const CACHE_TTL_MS = 60_000
const FETCH_TIMEOUT_MS = 3_000

let cache: RedirectCacheState | null = null
let inflight: Promise<RedirectCacheState> | null = null

function normalizeRedirectPath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (withLeading.length > 1 && withLeading.endsWith('/')) {
    return withLeading.slice(0, -1)
  }
  return withLeading
}

async function loadRedirectCache(): Promise<RedirectCacheState> {
  try {
    const res = await fetch(`${getBackendApiUrl()}/redirects/active`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    if (!res.ok) {
      return { map: {}, loadedAt: Date.now() }
    }

    const map = (await res.json()) as Record<string, ActiveRedirectEntry>
    return { map, loadedAt: Date.now() }
  } catch {
    return { map: {}, loadedAt: Date.now() }
  }
}

async function getRedirectCache(): Promise<RedirectCacheState> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache
  }

  if (!inflight) {
    inflight = loadRedirectCache()
      .then((next) => {
        cache = next
        return next
      })
      .finally(() => {
        inflight = null
      })
  }

  return inflight
}

export function invalidateRedirectCache(): void {
  cache = null
  inflight = null
}

export async function resolveRedirectForPath(
  path: string,
): Promise<(ActiveRedirectEntry & { fromPath: string }) | null> {
  const normalized = normalizeRedirectPath(path)
  const state = await getRedirectCache()
  const hit = state.map[normalized]
  if (!hit) return null
  return { fromPath: normalized, ...hit }
}
