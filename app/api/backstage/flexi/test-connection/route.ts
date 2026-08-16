import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

async function postAction(request: Request, path: string) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  try {
    const res = await fetchBackend(path, {
      request,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
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

export async function POST(request: Request) {
  return postAction(request, '/backstage/flexi/test-connection')
}
