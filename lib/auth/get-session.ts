import 'server-only'

import { cookies } from 'next/headers'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { verifyBackendJwt } from '@/lib/auth/backend-jwt'

import { SESSION_COOKIE_NAME } from './constants'
import { verifySessionToken } from './session-token'
import type { PublicSession } from './types'

type BackendSessionUser = {
  id?: string
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  role?: 'customer' | 'admin'
}

function toPublicSession(user: BackendSessionUser): PublicSession | null {
  const role = user.role === 'admin' || user.role === 'customer' ? user.role : null
  const hasIdentity = Boolean(user.email?.trim() || user.phone?.trim() || user.id?.trim())
  if (!role || !hasIdentity) return null

  return {
    id: user.id,
    email: user.email?.trim() || null,
    role,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    phone: user.phone ?? null,
  }
}

export async function getSession(): Promise<PublicSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const backendPayload = await verifyBackendJwt(token)
  if (backendPayload) {
    try {
      const res = await fetchBackend('/auth/session')
      if (res.ok) {
        const data = await readBackendJson<{ user?: BackendSessionUser }>(res)
        if (data.user) {
          return toPublicSession(data.user)
        }
      }
    } catch {
      // fallback below
    }
  }

  const legacy = await verifySessionToken(token)
  if (!legacy) return null
  return { email: legacy.email, role: legacy.role }
}
