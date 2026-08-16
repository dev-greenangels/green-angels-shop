import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const qs = url.searchParams.toString()
  try {
    const res = await fetchBackend(`/packeta/pickup-points${qs ? `?${qs}` : ''}`, {
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
