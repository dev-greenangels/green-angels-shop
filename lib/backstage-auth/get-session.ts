import 'server-only'

import { cookies } from 'next/headers'

import {
  fetchBackend,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import { BACKSTAGE_SESSION_COOKIE_NAME } from '@/lib/backstage-auth/constants'
import { verifyBackendJwt } from '@/lib/auth/backend-jwt'
import type { BackstageSession } from './types'

type BackendStaffSessionResponse = {
  user?: {
    email?: string | null
    firstName?: string | null
    lastName?: string | null
    role?: string
    staffRole?: string
  } | null
}

async function resolveRequestCookie(request?: Request): Promise<string | null> {
  const fromRequest = request?.headers.get('cookie')?.trim()
  if (fromRequest) {
    const token = fromRequest
      .split(';')
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith(`${BACKSTAGE_SESSION_COOKIE_NAME}=`))
    if (token) return `${BACKSTAGE_SESSION_COOKIE_NAME}=${token.slice(`${BACKSTAGE_SESSION_COOKIE_NAME}=`.length)}`
    return null
  }

  const store = await cookies()
  const token = store.get(BACKSTAGE_SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return `${BACKSTAGE_SESSION_COOKIE_NAME}=${token}`
}

export async function getBackstageSession(request?: Request): Promise<BackstageSession | null> {
  const cookieHeader = await resolveRequestCookie(request)
  if (!cookieHeader) return null

  const token = cookieHeader.slice(`${BACKSTAGE_SESSION_COOKIE_NAME}=`.length)
  const payload = await verifyBackendJwt(token)
  if (!payload || payload.role !== 'admin') return null

  const res = await fetchBackend('/auth/backstage/session', {
    request: request ?? new Request('http://localhost', { headers: { cookie: cookieHeader } }),
  })

  if (!res.ok) return null

  const data = await readBackendJson<BackendStaffSessionResponse>(res)
  const user = data.user
  if (!user || user.role !== 'admin') return null

  const staffRole =
    user.staffRole === 'ADMIN' || user.staffRole === 'MANAGER' ? user.staffRole : undefined

  return {
    email: user.email?.trim() || '',
    firstName: user.firstName?.trim() || '',
    lastName: user.lastName?.trim() || '',
    staffRole,
  }
}
