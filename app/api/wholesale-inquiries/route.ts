import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

function clientIpFromRequest(request: Request): string | undefined {
  const cf = request.headers.get('cf-connecting-ip')?.trim()
  if (cf) return cf
  const real = request.headers.get('x-real-ip')?.trim()
  if (real) return real
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || undefined
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const clientIp = clientIpFromRequest(request)
  if (clientIp) headers['x-ga-client-ip'] = clientIp

  try {
    const res = await fetchBackend('/wholesale-inquiries', {
      request,
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
