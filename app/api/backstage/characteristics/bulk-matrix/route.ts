import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const query = new URLSearchParams()
  const locale = searchParams.get('locale') ?? 'uk'
  query.set('locale', locale)
  if (searchParams.get('page')) query.set('page', searchParams.get('page')!)
  if (searchParams.get('pageSize')) query.set('pageSize', searchParams.get('pageSize')!)
  if (searchParams.get('search')) query.set('search', searchParams.get('search')!)
  if (searchParams.get('stock')) query.set('stock', searchParams.get('stock')!)

  try {
    const res = await fetchBackend(`/characteristics/bulk-matrix?${query}`, {
      request,
      cache: 'no-store',
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}

export async function PATCH(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  try {
    const res = await fetchBackend('/characteristics/bulk-matrix', {
      request,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
