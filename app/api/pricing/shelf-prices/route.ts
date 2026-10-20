import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  // Audience лише з session cookie — strip any client-supplied identity fields.
  const sanitized =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (() => {
          const next = { ...(body as Record<string, unknown>) }
          delete next.userId
          delete next.role
          delete next.flexiFirmaKod
          delete next.flexiSkupCenKod
          delete next.accountType
          return next
        })()
      : body

  try {
    const res = await fetchBackend('/pricing/shelf-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
      request,
    })
    const data = await readBackendJson(res)
    const response = NextResponse.json(data, { status: res.status })
    response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
    response.headers.set('Vary', 'Cookie')
    return response
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
