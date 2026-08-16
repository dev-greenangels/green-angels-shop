import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { defaultLocale, isAppLocale, routing, type AppLocale } from '@/i18n/routing'
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants'
import { BACKSTAGE_SESSION_COOKIE_NAME } from '@/lib/backstage-auth/constants'
import { readSessionTokenFromCookieHeader, verifyBackendJwt } from '@/lib/auth/backend-jwt'
import { verifySessionToken } from '@/lib/auth/session-token'
import {
  GA_COUNTRY_HEADER,
  GA_DEFAULT_LOCALE_HEADER,
} from '@/lib/country-sites/types'
import {
  defaultLocaleForCountry,
  resolveCountryFromHostWithFallback,
} from '@/lib/country-sites/resolve-country-host'
import { COUNTRY_LOCALES } from '@/lib/country-sites/edge-locales'
import type { CountrySiteCode } from '@/lib/country-sites/types'
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

function applyCountryHeaders(
  response: NextResponse,
  country: CountrySiteCode | null,
): NextResponse {
  if (!country) return response
  const defaultLoc = defaultLocaleForCountry(country)
  response.headers.set(GA_COUNTRY_HEADER, country)
  response.headers.set(GA_DEFAULT_LOCALE_HEADER, defaultLoc)

  // Forward onto the request so `headers()` in RSC can read them
  const override = response.headers.get('x-middleware-override-headers')
  const list = new Set(
    (override ? override.split(',') : [])
      .map((h) => h.trim())
      .filter(Boolean),
  )
  list.add(GA_COUNTRY_HEADER)
  list.add(GA_DEFAULT_LOCALE_HEADER)
  response.headers.set('x-middleware-override-headers', [...list].join(','))
  response.headers.set(`x-middleware-request-${GA_COUNTRY_HEADER}`, country)
  response.headers.set(`x-middleware-request-${GA_DEFAULT_LOCALE_HEADER}`, defaultLoc)
  return response
}

function redirectToCountryLocale(
  request: NextRequest,
  country: CountrySiteCode,
  barePath: string,
): NextResponse {
  const targetLocale = defaultLocaleForCountry(country) as AppLocale
  const url = request.nextUrl.clone()
  url.pathname = localePath(barePath === '/' ? '/' : barePath, targetLocale)
  return applyCountryHeaders(NextResponse.redirect(url), country)
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

  const country = resolveCountryFromHostWithFallback(request.nextUrl.hostname)

  // Before i18n: if country host and locale not allowed, redirect to default
  if (country) {
    const pathLocale = resolveLocaleFromPathname(pathname)
    const allowed = COUNTRY_LOCALES[country]
    const hasLocalePrefix = routing.locales.some(
      (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    )
    if (hasLocalePrefix && !allowed.includes(pathLocale)) {
      const barePath = stripLocalePrefix(pathname)
      return redirectToCountryLocale(request, country, barePath)
    }
  }

  const intlResponse = handleI18nRouting(request)
  const localizedPathname = intlResponse.headers.get('x-middleware-rewrite')
    ? new URL(intlResponse.headers.get('x-middleware-rewrite')!, request.url).pathname
    : pathname

  const redirectResponse = await handleConfiguredRedirects(request, localizedPathname)
  if (redirectResponse) {
    return applyCountryHeaders(redirectResponse, country)
  }

  const barePath = stripLocalePrefix(localizedPathname)

  if (barePath.startsWith('/account')) {
    if (!(await hasCustomerSession(request))) {
      return applyCountryHeaders(publicLoginRedirect(request, localizedPathname), country)
    }
  }

  // If country set and intl landed on unsupported default (e.g. /uk on .hu), fix after intl
  if (country) {
    const pathLocale = resolveLocaleFromPathname(localizedPathname)
    const allowed = COUNTRY_LOCALES[country]
    if (!allowed.includes(pathLocale)) {
      return redirectToCountryLocale(request, country, barePath)
    }
  }

  return applyCountryHeaders(intlResponse, country)
}

/**
 * Must be string literals — Next statically parses `config.matcher` at build.
 * Keep in sync with `SHOP_PROXY_MATCHERS` / `shouldRunShopProxy`.
 *
 * `.*\\..*` skips every dotted path (assets, robots.txt, sitemap.xml).
 * Extra `.html` / `.php` entries re-enable Presta legacy URLs for the
 * existing Redirect table (`handleConfiguredRedirects`).
 */
export const config = {
  matcher: [
    '/((?!_next|_vercel|favicon.ico|.*\\..*).*)',
    '/((?!_next|_vercel).*)\\.html',
    '/((?!_next|_vercel).*)\\.php',
  ],
}
