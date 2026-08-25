import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const url = new URL(request.url)
  const params = new URLSearchParams()
  const status = url.searchParams.get('status')?.trim()
  if (status === 'pending' || status === 'notified') params.set('status', status)
  const channel = url.searchParams.get('channel')?.trim()
  if (channel === 'email' || channel === 'phone') params.set('channel', channel)
  const q = url.searchParams.get('q')?.trim()
  if (q) params.set('q', q)
  const page = url.searchParams.get('page')?.trim()
  if (page && /^\d+$/.test(page)) params.set('page', page)

  const query = params.toString()
  const path = query
    ? `/stock-notifications/backstage?${query}`
    : '/stock-notifications/backstage'

  try {
    const res = await fetchBackend(path, { request, cache: 'no-store' })
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
