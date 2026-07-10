import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { verifyBackendJwt } from '@/lib/auth/backend-jwt'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { getSession } from '@/lib/auth/get-session'
import type { GoogleCheckoutProfile } from '@/lib/auth/types'

type BackendSessionResponse = {
  user?: {
    id: string
    email: string | null
    phone: string | null
    firstName: string | null
    lastName: string | null
    role: 'customer' | 'admin'
  }
  profile?: GoogleCheckoutProfile
}

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.json({ user: null, profile: null })
  }

  const backendPayload = await verifyBackendJwt(token)
  if (backendPayload) {
    try {
      const res = await fetchBackend('/auth/session')
      if (res.ok) {
        const data = await readBackendJson<BackendSessionResponse>(res)
        if (data.user) {
          return NextResponse.json({
            user: {
              id: data.user.id,
              email: data.user.email?.trim() || null,
              role: data.user.role,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              phone: data.user.phone,
            },
            profile: data.profile ?? null,
          })
        }
      }
    } catch {
      // fallback
    }
  }

  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null, profile: null })
  }

  return NextResponse.json({
    user: session,
    profile: null,
  })
}
