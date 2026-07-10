import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import {
  BACKSTAGE_SESSION_COOKIE_NAME,
} from '@/lib/backstage-auth/constants'

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

export async function POST(request: Request) {
  try {
    const backstageCookie = request.headers
      .get('cookie')
      ?.split(';')
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith(`${BACKSTAGE_SESSION_COOKIE_NAME}=`))

    const backendRes = await fetchBackend('/auth/backstage/logout', {
      method: 'POST',
      request: backstageCookie
        ? new Request(request.url, { headers: { cookie: backstageCookie } })
        : request,
    })
    const data = await readBackendJson(backendRes)
    const res = clearBackstageSessionCookie(NextResponse.json(data, { status: backendRes.status }))
    forwardBackendCookies(backendRes, res)
    return res
  } catch {
    return clearBackstageSessionCookie(
      NextResponse.json(
        { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
        { status: 502 },
      ),
    )
  }
}
