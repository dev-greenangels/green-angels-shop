import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

type ReorderBody = {
  parentId?: string | null
  orderedIds?: string[]
}

export async function PATCH(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  let body: ReorderBody
  try {
    body = (await request.json()) as ReorderBody
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
    return NextResponse.json({ error: 'orderedIds обовʼязковий.' }, { status: 400 })
  }

  try {
    const res = await fetchBackend('/categories/reorder', {
      request,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: body.parentId ?? null,
        orderedIds: body.orderedIds,
      }),
    })
    const data = await readBackendJson(res)
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
