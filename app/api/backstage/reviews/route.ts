import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import type { ReviewStatus, ReviewTypeFilter } from '@/lib/reviews/types'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const url = new URL(request.url)
  const params = new URLSearchParams()

  const status = url.searchParams.get('status')?.trim()
  if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
    params.set('status', status as ReviewStatus)
  }

  const type = url.searchParams.get('type')?.trim()
  if (type === 'store' || type === 'product' || type === 'all') {
    params.set('type', type as ReviewTypeFilter)
  }

  const rating = url.searchParams.get('rating')?.trim()
  if (rating && /^[1-5]$/.test(rating)) {
    params.set('rating', rating)
  }

  const productId = url.searchParams.get('productId')?.trim()
  if (productId) {
    params.set('productId', productId)
  }

  const query = params.toString()
  const path = query ? `/reviews/backstage/all?${query}` : '/reviews/backstage/all'

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
