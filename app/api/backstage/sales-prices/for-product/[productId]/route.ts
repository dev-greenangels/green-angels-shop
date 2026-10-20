import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { productId } = await context.params
  const url = new URL(request.url)
  const qs = url.searchParams.toString()
  const path = `/backstage/sales-prices/for-product/${encodeURIComponent(productId)}${
    qs ? `?${qs}` : ''
  }`

  try {
    const res = await fetchBackend(path, { request, cache: 'no-store' })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
