import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  // Не проксуємо client-supplied userId/customerPhone — аудиторія лише з session cookie.
  const sanitized =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (() => {
          const next = { ...(body as Record<string, unknown>) }
          delete next.userId
          delete next.customerPhone
          return next
        })()
      : body

  try {
    const res = await fetchBackend('/pricing/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized),
      request,
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
