import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { clientIpFromRequest } from '@/lib/api/client-ip'

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
    const res = await fetchBackend('/contract-withdrawals/public', {
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
