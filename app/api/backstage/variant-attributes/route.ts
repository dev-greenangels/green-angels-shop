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
  const edit = searchParams.get('edit')
  if (edit === '0' || edit === 'false') query.set('edit', '0')
  else query.set('edit', '1')

  try {
    const res = await fetchBackend(`/variant-attributes?${query}`, { request, cache: 'no-store' })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  try {
    const res = await fetchBackend(`/variant-attributes`, { request, 
      method: 'POST',
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
