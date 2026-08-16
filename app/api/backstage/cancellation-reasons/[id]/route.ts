import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error
  const { id } = await context.params
  const body = await request.json()
  try {
    const res = await fetchBackend(`/cancellation-reasons/${encodeURIComponent(id)}`, {
      request,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Помилка зʼєднання з API.' }, { status: 502 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error
  const { id } = await context.params
  try {
    const res = await fetchBackend(`/cancellation-reasons/${encodeURIComponent(id)}`, {
      request,
      method: 'DELETE',
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Помилка зʼєднання з API.' }, { status: 502 })
  }
}
