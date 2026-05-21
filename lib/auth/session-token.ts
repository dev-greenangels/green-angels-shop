import { SignJWT, jwtVerify } from 'jose'

import { SESSION_MAX_AGE_SEC } from './constants'
import type { PublicSession, SessionJwtPayload } from './types'

/** Лише для `next dev`: якщо `AUTH_SESSION_SECRET` не задано, сесія все одно працює. У продакшені обов’язково задайте свій секрет. */
const DEV_FALLBACK_SECRET =
  'dev-only-green-angels-session-secret-min-32-chars!!'

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

export async function signSessionToken(payload: PublicSession & { v: 1 }): Promise<string | null> {
  const key = getSecretKey()
  if (!key) return null
  return new SignJWT({ role: payload.role, v: payload.v })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(key)
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
