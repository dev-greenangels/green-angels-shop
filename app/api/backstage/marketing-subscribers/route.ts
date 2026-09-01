import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const url = new URL(request.url)
  const params = new URLSearchParams()
  const q = url.searchParams.get('q')?.trim()
  if (q) params.set('q', q.slice(0, 120))

  const status = url.searchParams.get('status')?.trim()
  if (status === 'active' || status === 'withdrawn') params.set('status', status)

  const sortBy = url.searchParams.get('sortBy')?.trim()
  if (
    sortBy === 'subscribedAt' ||
    sortBy === 'email' ||
    sortBy === 'lastName' ||
    sortBy === 'status' ||
    sortBy === 'source'
  ) {
    params.set('sortBy', sortBy)
  }

  const sortDir = url.searchParams.get('sortDir')?.trim()
  if (sortDir === 'asc' || sortDir === 'desc') params.set('sortDir', sortDir)

  const page = url.searchParams.get('page')?.trim()
  if (page && /^\d+$/.test(page)) params.set('page', page)

  const pageSize = url.searchParams.get('pageSize')?.trim()
  if (pageSize && /^\d+$/.test(pageSize)) params.set('pageSize', pageSize)

  const query = params.toString()
  const path = query
    ? `/legal/admin/marketing-subscribers?${query}`
    : '/legal/admin/marketing-subscribers'

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
