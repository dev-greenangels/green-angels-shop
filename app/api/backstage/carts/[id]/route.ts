import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { id } = await context.params

  try {
    const res = await fetchBackend(`/carts/${encodeURIComponent(id)}`, {
      request,
      cache: 'no-store',
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
