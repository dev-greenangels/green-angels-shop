import { jwtVerify } from 'jose'

import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

export type BackendJwtPayload = {
  userId: string
  role: 'admin' | 'customer'
  v: 1
}

/** Той самий dev-секрет, що в green-angels-backend/.env.example */
const DEV_JWT_SECRET = 'dev-only-green-angels-session-secret-min-32-chars!!'

function resolveJwtSecret(): string | null {
  const fromEnv = process.env.JWT_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 32) return fromEnv
  if (process.env.NODE_ENV === 'development') return DEV_JWT_SECRET
  return null
}

export async function verifyBackendJwt(token: string): Promise<BackendJwtPayload | null> {
  const secret = resolveJwtSecret()
  if (!secret) return null

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    })

    const userId = typeof payload.sub === 'string' ? payload.sub : null
    const role = payload.role === 'admin' || payload.role === 'customer' ? payload.role : null
    const v = payload.v === 1 ? 1 : null

    if (!userId || !role || !v) return null
    return { userId, role, v }
  } catch {
    return null
  }
}

export function readSessionTokenFromCookieHeader(
  cookieHeader: string | null,
  cookieName: string = SESSION_COOKIE_NAME,
): string | null {
  if (!cookieHeader) return null
  const prefix = `${cookieName}=`
  const part = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(prefix))
  if (!part) return null
  return decodeURIComponent(part.slice(prefix.length))
}
