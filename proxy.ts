import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { defaultLocale, isAppLocale, routing, type AppLocale } from '@/i18n/routing'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { BACKSTAGE_SESSION_COOKIE_NAME } from '@/lib/backstage-auth/constants'
import { readSessionTokenFromCookieHeader, verifyBackendJwt } from '@/lib/auth/backend-jwt'
import { verifySessionToken } from '@/lib/auth/session-token'
import { localePath, stripLocalePrefix } from '@/lib/locale-path'
import { resolveRedirectForPath } from '@/lib/redirects/middleware-cache'

const handleI18nRouting = createIntlMiddleware(routing)

async function hasCustomerSession(request: NextRequest): Promise<boolean> {
  const token =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ??
    readSessionTokenFromCookieHeader(request.headers.get('cookie'))

  if (!token) return false

  const backend = await verifyBackendJwt(token)
  if (backend?.role === 'customer' || backend?.role === 'admin') return true

  const legacy = await verifySessionToken(token)
  return legacy?.role === 'customer' || legacy?.role === 'admin'
}

function publicLoginRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = localePath('/auth/login')
  url.searchParams.set('redirect', localePath(pathname))
  return NextResponse.redirect(url)
}

function backstageLoginRedirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/backstage/login'
  url.searchParams.set('redirect', pathname)
  return NextResponse.redirect(url)
}

async function hasBackstageAccess(request: NextRequest): Promise<boolean> {
  const token =
    request.cookies.get(BACKSTAGE_SESSION_COOKIE_NAME)?.value ??
    readSessionTokenFromCookieHeader(request.headers.get('cookie'), BACKSTAGE_SESSION_COOKIE_NAME)

  if (!token) return false

  const payload = await verifyBackendJwt(token)
  return payload?.role === 'admin'
}

async function handleBackstage(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/backstage/inventory' || pathname.startsWith('/backstage/inventory/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace('/backstage/inventory', '/backstage/products')
    return NextResponse.redirect(url)
  }

  if (!pathname.startsWith('/backstage')) {
    return null
  }

  const isLoginPage = pathname === '/backstage/login'

  if (isLoginPage) {
    if (await hasBackstageAccess(request)) {
      const url = request.nextUrl.clone()
      const redirect = url.searchParams.get('redirect')
      url.pathname =
        redirect?.startsWith('/backstage') && redirect !== '/backstage/login'
          ? redirect
          : '/backstage'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  if (!(await hasBackstageAccess(request))) {
    return backstageLoginRedirect(request, pathname)
  }

  return NextResponse.next()
}

function resolveLocaleFromPathname(pathname: string): AppLocale {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return isAppLocale(locale) ? locale : defaultLocale
    }
  }
  return defaultLocale
}

async function handleConfiguredRedirects(request: NextRequest, localizedPathname: string) {
  const barePath = stripLocalePrefix(localizedPathname)
  const hit = await resolveRedirectForPath(barePath)
  if (!hit) return null

  const locale = resolveLocaleFromPathname(localizedPathname)
  const url = request.nextUrl.clone()
  url.pathname = localePath(hit.toPath, locale)
  return NextResponse.redirect(url, hit.statusCode)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/^\/admin/, '/backstage') || '/backstage'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/backstage') && !pathname.startsWith('/api/backstage/auth/')) {
    if (!(await hasBackstageAccess(request))) {
      return NextResponse.json({ error: 'Потрібна авторизація в бек-офісі.' }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const backstageResponse = await handleBackstage(request)
  if (backstageResponse) {
    return backstageResponse
  }

  const intlResponse = handleI18nRouting(request)
  const localizedPathname = intlResponse.headers.get('x-middleware-rewrite')
    ? new URL(intlResponse.headers.get('x-middleware-rewrite')!, request.url).pathname
    : pathname

  const redirectResponse = await handleConfiguredRedirects(request, localizedPathname)
  if (redirectResponse) {
    return redirectResponse
  }

  const barePath = stripLocalePrefix(localizedPathname)

  if (barePath.startsWith('/account')) {
    if (!(await hasCustomerSession(request))) {
      return publicLoginRedirect(request, localizedPathname)
    }
  }

  return intlResponse
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
