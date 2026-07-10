import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'

export async function GET(request: Request) {
  try {
    const res = await fetchBackend('/carts/me', { request, cache: 'no-store' })
    const data = await readBackendJson(res)
    const response = NextResponse.json(data, { status: res.ok ? 200 : res.status })
    if (res.ok) forwardBackendCookies(res, response)
    return response
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}

export async function PUT(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  try {
    const res = await fetchBackend('/carts/me', {
      request,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readBackendJson(res)
    const response = NextResponse.json(data, { status: res.ok ? 200 : res.status })
    if (res.ok) forwardBackendCookies(res, response)
    return response
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
