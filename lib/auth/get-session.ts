import 'server-only'

import { cookies } from 'next/headers'

import { SESSION_COOKIE_NAME } from './constants'
import { verifySessionToken } from './session-token'
import type { PublicSession } from './types'

export async function getSession(): Promise<PublicSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifySessionToken(token)
  if (!payload) return null
  return { email: payload.email, role: payload.role }
}
