import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params
  if (!token?.trim()) {
    return NextResponse.json({ error: 'Недійсне посилання.' }, { status: 400 })
  }

  try {
    const res = await fetchBackend(`/reviews/request/${encodeURIComponent(token)}`, {
      request,
      method: 'GET',
      headers: {
        'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
        'x-real-ip': request.headers.get('x-real-ip') ?? '',
      },
    })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params
  if (!token?.trim()) {
    return NextResponse.json({ error: 'Недійсне посилання.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  try {
    const res = await fetchBackend(`/reviews/request/${encodeURIComponent(token)}`, {
      request,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
        'x-real-ip': request.headers.get('x-real-ip') ?? '',
      },
      body: JSON.stringify(body),
    })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
