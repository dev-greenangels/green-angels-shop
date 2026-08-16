import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const params = new URLSearchParams()
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const page = searchParams.get('page')
  const pageSize = searchParams.get('pageSize')
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  if (page) params.set('page', page)
  if (pageSize) params.set('pageSize', pageSize)

  const suffix = params.toString() ? `?${params}` : ''

  try {
    const res = await fetchBackend(`/orders${suffix}`, { request,  cache: 'no-store' })
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
