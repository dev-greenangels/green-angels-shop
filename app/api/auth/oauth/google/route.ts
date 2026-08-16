import { NextResponse } from 'next/server'

import {
  buildGoogleAuthorizeUrl,
  buildOAuthReturnRedirect,
  createGoogleOAuthState,
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_STATE_COOKIE,
  GOOGLE_OAUTH_STATE_MAX_AGE_SEC,
  isGoogleOAuthConfigured,
  normalizeOAuthReturnTo,
  originFromRequest,
} from '@/lib/auth/google-oauth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnTo = normalizeOAuthReturnTo(url.searchParams.get('returnTo'))
  const origin = originFromRequest(request)

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      buildOAuthReturnRedirect(
        returnTo,
        {
          oauth_error:
            'Google OAuth не налаштовано. Додайте NEXT_PUBLIC_GOOGLE_CLIENT_ID у змінні оточення магазину.',
        },
        origin,
      ),
    )
  }

  const state = createGoogleOAuthState(returnTo)
  const redirectUri = getGoogleOAuthRedirectUri(origin)

  let authorizeUrl: string
  try {
    authorizeUrl = buildGoogleAuthorizeUrl(state.nonce, redirectUri)
  } catch {
    return NextResponse.redirect(
      buildOAuthReturnRedirect(returnTo, { oauth_error: 'Google OAuth не налаштовано.' }, origin),
    )
  }

  const res = NextResponse.redirect(authorizeUrl)
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: GOOGLE_OAUTH_STATE_MAX_AGE_SEC,
  })
  return res
}

export async function POST(request: Request) {
  return GET(request)
}
