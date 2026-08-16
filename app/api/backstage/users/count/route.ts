import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const params = new URLSearchParams()
  const segment = searchParams.get('segment')
  if (segment) params.set('segment', segment)
  const suffix = params.toString() ? `?${params}` : ''

  try {
    const res = await fetchBackend(`/users/count${suffix}`, { request, cache: 'no-store' })
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
