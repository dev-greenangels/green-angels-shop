import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const url = new URL(request.url)
  const page = url.searchParams.get('page') ?? '1'
  const pageSize = url.searchParams.get('pageSize') ?? '50'

  try {
    const res = await fetchBackend(
      `/backstage/tedb/rates?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
      { request, cache: 'no-store' },
    )
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
