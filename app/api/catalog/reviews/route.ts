import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import type { ReviewSortOrder, ReviewTypeFilter } from '@/lib/reviews/types'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = new URLSearchParams()

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

  const page = url.searchParams.get('page')?.trim()
  if (page && /^\d+$/.test(page)) {
    params.set('page', page)
  }

  const pageSize = url.searchParams.get('pageSize')?.trim()
  if (pageSize && /^\d+$/.test(pageSize)) {
    params.set('pageSize', pageSize)
  }

  const sort = url.searchParams.get('sort')?.trim()
  if (
    sort === 'newest' ||
    sort === 'oldest' ||
    sort === 'rating_desc' ||
    sort === 'rating_asc'
  ) {
    params.set('sort', sort as ReviewSortOrder)
  }

  const query = params.toString()
  const path = query ? `/reviews?${query}` : '/reviews'

  try {
    const res = await fetchBackend(path, { cache: 'no-store' })
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
