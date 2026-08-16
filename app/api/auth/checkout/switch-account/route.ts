import { NextResponse } from 'next/server'

import { fetchBackend, forwardBackendCookies } from '@/lib/api/backend-fetch'
import { CHECKOUT_LOCK_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/lib/auth/constants'

function clearAuthCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  }
  response.cookies.set(SESSION_COOKIE_NAME, '', options)
  response.cookies.set(CHECKOUT_LOCK_COOKIE_NAME, '', options)
  return response
}

export async function POST(request: Request) {
  try {
    const backendRes = await fetchBackend('/auth/checkout/switch-account', {
      method: 'POST',
      request,
    })
    const res = NextResponse.json({ ok: true }, { status: backendRes.ok ? 200 : backendRes.status })
    forwardBackendCookies(backendRes, res)
    return clearAuthCookies(res)
  } catch {
    return clearAuthCookies(NextResponse.json({ ok: true }))
  }
}
