import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('activeOnly') ?? 'true'
  try {
    const res = await fetchBackend(`/order-statuses?activeOnly=${activeOnly}`, {
      request,
      cache: 'no-store',
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Помилка зʼєднання з API.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error
  const body = await request.json()
  try {
    const res = await fetchBackend('/order-statuses', {
      request,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Помилка зʼєднання з API.' }, { status: 502 })
  }
}
