import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

type RouteContext = { params: Promise<{ id: string; valueId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error
  const { id, valueId } = await context.params
  try {
    const res = await fetchBackend(
      `/variant-attributes/${id}/values/${valueId}/translations/label`,
      { request, cache: 'no-store' },
    )
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error
  const { id, valueId } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }
  try {
    const res = await fetchBackend(
      `/variant-attributes/${id}/values/${valueId}/translations/label`,
      {
        request,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
