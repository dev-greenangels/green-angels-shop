import { NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'

export async function GET(request: Request) {
  const url = new URL('/', request.url)
  const res = NextResponse.redirect(url)
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return res
}

export async function POST(request: Request) {
  return GET(request)
}
