import { NextResponse } from 'next/server'

import { fetchBackend } from '@/lib/api/backend-fetch'
import { CHECKOUT_LOCK_COOKIE_NAME, SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { resolveLogoutRedirect } from '@/lib/auth/logout-redirect'
import { localePath } from '@/lib/locale-path'

function clearSessionCookie(response: NextResponse) {
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

function resolveFromParam(request: Request): string {
  const url = new URL(request.url)
  const from = url.searchParams.get('from')?.trim()
  if (from && from.startsWith('/') && !from.startsWith('//')) {
    return resolveLogoutRedirect(from)
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return resolveLogoutRedirect(refererUrl.pathname + refererUrl.search)
    } catch {
      /* ignore invalid referer */
    }
  }

  return '/'
}

export async function GET(request: Request) {
  try {
    await fetchBackend('/auth/logout', { method: 'POST', request })
  } catch {
    // ignore backend logout errors
  }

  const target = resolveFromParam(request)
  const url = new URL(localePath(target), request.url)
  return clearSessionCookie(NextResponse.redirect(url))
}

export async function POST(request: Request) {
  try {
    await fetchBackend('/auth/logout', { method: 'POST', request })
  } catch {
    // ignore backend logout errors
  }

  return clearSessionCookie(NextResponse.json({ ok: true }))
}
