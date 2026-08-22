import { NextResponse } from 'next/server'

import { BACKSTAGE_SESSION_COOKIE_NAME } from '@/lib/backstage-auth/constants'
import { getBackstageSession } from '@/lib/backstage-auth/get-session'

function hasBackstageCookie(request: Request): boolean {
  const raw = request.headers.get('cookie') ?? ''
  return raw
    .split(';')
    .map((chunk) => chunk.trim())
    .some((chunk) => chunk.startsWith(`${BACKSTAGE_SESSION_COOKIE_NAME}=`))
}

function clearBackstageSessionCookie(response: NextResponse) {
  response.cookies.set(BACKSTAGE_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}

export async function GET(request: Request) {
  const session = await getBackstageSession(request)
  if (session) {
    return NextResponse.json({ user: session })
  }

  // Stale JWT: cookie verifies in middleware but Nest has no matching user (e.g. DB reset).
  // Clear cookie so the next navigation hits /backstage/login instead of a hollow panel.
  const res = NextResponse.json({ user: null })
  if (hasBackstageCookie(request)) {
    clearBackstageSessionCookie(res)
  }
  return res
}
