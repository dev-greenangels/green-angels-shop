import { NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Некоректне тіло запиту.' }, { status: 400 })
  }

  const countrySiteCode = await getRequestCountrySiteCode()

  try {
    const res = await fetch(`${getBackendApiUrl()}/stock-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        ...(countrySiteCode ? { countrySiteCode } : {}),
      }),
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
