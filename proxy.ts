import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { verifySessionToken } from '@/lib/auth/session-token'

function loginRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/auth/login'
  url.searchParams.set('redirect', pathname)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null

  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'admin') {
      return loginRedirect(request, pathname)
    }
  }

  if (pathname.startsWith('/account')) {
    if (!session) {
      return loginRedirect(request, pathname)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
}
