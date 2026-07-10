import { jwtVerify } from 'jose'

import type { SessionJwtPayload } from './types'

/** Legacy shop-only JWT (до міграції на backend). Лише для перевірки старих сесій. */
const DEV_FALLBACK_SECRET = 'dev-only-green-angels-session-secret-min-32-chars!!'

function resolveSessionSecret(): string | null {
  const fromEnv = process.env.AUTH_SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 32) return fromEnv
  if (process.env.NODE_ENV === 'development') return DEV_FALLBACK_SECRET
  return null
}

function getSecretKey(): Uint8Array | null {
  const secret = resolveSessionSecret()
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

export async function verifySessionToken(token: string): Promise<SessionJwtPayload | null> {
  const key = getSecretKey()
  if (!key) return null
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    const email = typeof payload.sub === 'string' ? payload.sub : null
    const role = payload.role === 'admin' || payload.role === 'customer' ? payload.role : null
    const v = payload.v === 1 ? 1 : null
    if (!email || !role || !v) return null
    return { v, email, role }
  } catch {
    return null
  }
}
