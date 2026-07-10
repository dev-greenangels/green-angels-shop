import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

type Params = { code: string }

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  const { error } = await requireBackstageSession(request)
  if (error) return error
  const { code } = await context.params
  const body = await request.json()
  try {
    const res = await fetchBackend(`/currencies/${encodeURIComponent(code)}`, {
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

export async function DELETE(request: Request, context: { params: Promise<Params> }) {
  const { error } = await requireBackstageSession(request)
  if (error) return error
  const { code } = await context.params
  try {
    const res = await fetchBackend(`/currencies/${encodeURIComponent(code)}`, {
      request,
      method: 'DELETE',
    })
    if (!res.ok) {
      const data = await readBackendJson(res)
      return NextResponse.json(data, { status: res.status })
    }
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Помилка зʼєднання з API.' }, { status: 502 })
  }
}
