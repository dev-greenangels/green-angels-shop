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
  parseGoogleOAuthState,
} from '@/lib/auth/google-oauth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim()
  const stateNonce = url.searchParams.get('state')?.trim()
  const googleError = url.searchParams.get('error')?.trim()

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
        }),
      ),
    )
  }

  if (!code || !stateNonce || !storedState || storedState.nonce !== stateNonce) {
    return clearState(
      NextResponse.redirect(
        buildOAuthReturnRedirect(returnTo, {
          oauth_error: 'Невалідний стан OAuth. Спробуйте ще раз.',
        }),
      ),
    )
  }

  try {
    const backendRes = await fetchBackend('/auth/oauth/google/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: getGoogleOAuthRedirectUri(),
      }),
    })

    const data = await readBackendJson<{ error?: string; message?: string | string[] }>(backendRes)

    if (!backendRes.ok) {
      const message =
        typeof data.error === 'string'
          ? data.error
          : Array.isArray(data.message)
            ? data.message.join(', ')
            : typeof data.message === 'string'
              ? data.message
              : 'Не вдалося увійти через Google.'
      return clearState(
        NextResponse.redirect(buildOAuthReturnRedirect(returnTo, { oauth_error: message })),
      )
    }

    const res = clearState(
      NextResponse.redirect(buildOAuthReturnRedirect(returnTo, { oauth: 'success' })),
    )
    forwardBackendCookies(backendRes, res)
    return res
  } catch {
    return clearState(
      NextResponse.redirect(
        buildOAuthReturnRedirect(returnTo, {
          oauth_error: 'Не вдалося зʼєднатися з API.',
        }),
      ),
    )
  }
}
