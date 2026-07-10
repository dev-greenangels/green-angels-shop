import { randomBytes } from 'crypto'

import { localePath } from '@/lib/locale-path'

export const GOOGLE_OAUTH_STATE_COOKIE = 'ga-google-oauth-state'
export const GOOGLE_OAUTH_STATE_MAX_AGE_SEC = 60 * 10

export type GoogleOAuthState = {
  nonce: string
  returnTo: string
}

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'http://localhost:3000'
}

export function getGoogleOAuthRedirectUri(): string {
  return `${getSiteUrl()}/api/auth/oauth/google/callback`
}

function splitPathAndSearch(path: string): { pathname: string; search: string } {
  const queryIndex = path.indexOf('?')
  if (queryIndex === -1) return { pathname: path, search: '' }
  return { pathname: path.slice(0, queryIndex), search: path.slice(queryIndex) }
}

/** Нормалізує внутрішній path для OAuth return (не використовує safeAuthRedirect — він блокує /auth/login). */
export function normalizeOAuthReturnTo(path: string | null | undefined): string {
  const trimmed = path?.trim()
  if (!trimmed) return localePath('/')

  let internal = trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed)
      internal = `${parsed.pathname}${parsed.search}`
    } catch {
      return localePath('/')
    }
  }

  if (!internal.startsWith('/') || internal.startsWith('//')) {
    return localePath('/')
  }

  const { pathname, search } = splitPathAndSearch(internal)

  if (/^\/:\d+/.test(pathname)) return localePath('/')

  const loginPath = localePath('/auth/login')
  if (pathname === loginPath) {
    return `${loginPath}${search}`
  }

  if (
    pathname.startsWith('/backstage') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/uk/backstage') ||
    pathname.startsWith('/api/')
  ) {
    return localePath('/')
  }

  return `${localePath(pathname)}${search}`
}

export function buildOAuthReturnRedirect(
  path: string,
  params: Record<string, string> = {},
): URL {
  const redirectPath = normalizeOAuthReturnTo(path)
  const url = new URL(redirectPath, `${getSiteUrl()}/`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url
}

export function createGoogleOAuthState(returnTo: string): GoogleOAuthState {
  return {
    nonce: randomBytes(24).toString('hex'),
    returnTo: normalizeOAuthReturnTo(returnTo),
  }
}

export function parseGoogleOAuthState(raw: string | undefined): GoogleOAuthState | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as Partial<GoogleOAuthState>
    if (typeof parsed.nonce !== 'string' || !parsed.nonce.trim()) return null
    if (typeof parsed.returnTo !== 'string') return null

    const returnTo = normalizeOAuthReturnTo(parsed.returnTo)
    if (!returnTo.startsWith('/')) return null

    return {
      nonce: parsed.nonce,
      returnTo,
    }
  } catch {
    return null
  }
}

export function resolveGoogleClientId(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
  return fromEnv || null
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(resolveGoogleClientId())
}

export function buildGoogleAuthorizeUrl(stateNonce: string, redirectUri: string): string {
  const clientId = resolveGoogleClientId()
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: stateNonce,
    access_type: 'online',
    prompt: 'select_account',
    include_granted_scopes: 'true',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
