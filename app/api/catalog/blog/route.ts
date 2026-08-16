import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const qs = searchParams.toString()
    const path = qs ? `/blog?${qs}` : '/blog'
    const res = await fetchBackend(path, { cache: 'no-store' })
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
