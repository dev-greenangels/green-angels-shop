import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import {
  buildOAuthReturnRedirect,
  getGoogleOAuthRedirectUri,
  GOOGLE_OAUTH_STATE_COOKIE,
  normalizeOAuthReturnTo,
  originFromRequest,
  parseGoogleOAuthState,
} from '@/lib/auth/google-oauth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim()
  const stateNonce = url.searchParams.get('state')?.trim()
  const googleError = url.searchParams.get('error')?.trim()
  const origin = originFromRequest(request)

  const cookieStore = await cookies()
  const storedState = parseGoogleOAuthState(cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value)
  const returnTo = storedState?.returnTo ?? normalizeOAuthReturnTo(null)

  const clearState = (response: NextResponse) => {
    response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    })
    return response
  }

  if (googleError) {
    return clearState(
      NextResponse.redirect(
        buildOAuthReturnRedirect(returnTo, {
          oauth_error: 'Вхід через Google скасовано.',
        }, origin),
      ),
    )
  }

  if (!code || !stateNonce || !storedState || storedState.nonce !== stateNonce) {
    return clearState(
      NextResponse.redirect(
        buildOAuthReturnRedirect(returnTo, {
          oauth_error: 'Невалідний стан OAuth. Спробуйте ще раз.',
        }, origin),
      ),
    )
  }

  try {
    const backendRes = await fetchBackend('/auth/oauth/google/callback', {
      method: 'POST',
      request,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: getGoogleOAuthRedirectUri(origin),
      }),
    })

    const data = await readBackendJson<{
      error?: string
      message?: string | string[] | { code?: string; message?: string }
      code?: string
    }>(backendRes)

    if (!backendRes.ok) {
      const locked =
        data.code === 'CHECKOUT_ACCOUNT_LOCKED' ||
        data.error === 'CHECKOUT_ACCOUNT_LOCKED' ||
        (data.message &&
          typeof data.message === 'object' &&
          !Array.isArray(data.message) &&
          data.message.code === 'CHECKOUT_ACCOUNT_LOCKED')
      const message = locked
        ? 'CHECKOUT_ACCOUNT_LOCKED'
        : typeof data.error === 'string'
          ? data.error
          : Array.isArray(data.message)
            ? data.message.join(', ')
            : typeof data.message === 'string'
              ? data.message
              : 'Не вдалося увійти через Google.'
      return clearState(
        NextResponse.redirect(buildOAuthReturnRedirect(returnTo, { oauth_error: message }, origin)),
      )
    }

    const res = clearState(
      NextResponse.redirect(buildOAuthReturnRedirect(returnTo, { oauth: 'success' }, origin)),
    )
    forwardBackendCookies(backendRes, res)
    return res
  } catch {
    return clearState(
      NextResponse.redirect(
        buildOAuthReturnRedirect(returnTo, {
          oauth_error: 'Не вдалося зʼєднатися з API.',
        }, origin),
      ),
    )
  }
}
