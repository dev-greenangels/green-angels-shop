import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug') ?? ''
  const excludeId = searchParams.get('excludeId')

  const params = new URLSearchParams({ slug })
  if (excludeId) params.set('excludeId', excludeId)

  try {
    const res = await fetchBackend(`/products/check-slug?${params}`, { request, 
      cache: 'no-store',
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
