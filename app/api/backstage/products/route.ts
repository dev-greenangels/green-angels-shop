import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { finalizeProductImages, type ProductImageInput } from '@/lib/media/finalize'

type ProductBody = {
  images?: ProductImageInput[]
  [key: string]: unknown
}

async function withFinalizedImages(body: ProductBody, productId: string): Promise<ProductBody> {
  if (!body.images?.length) return body
  const images = await finalizeProductImages(body.images, productId)
  return { ...body, images }
}

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const params = new URLSearchParams({ locale: 'uk' })
  const search = searchParams.get('search')
  const categoryId = searchParams.get('categoryId')
  const published = searchParams.get('published')
  const stock = searchParams.get('stock')
  const page = searchParams.get('page')
  const pageSize = searchParams.get('pageSize')
  if (search) params.set('search', search)
  if (categoryId) params.set('categoryId', categoryId)
  if (published) params.set('published', published)
  if (stock) params.set('stock', stock)
  if (page) params.set('page', page)
  if (pageSize) params.set('pageSize', pageSize)

  try {
    const res = await fetchBackend(`/products?${params}`, {
      request,
      cache: 'no-store',
    })
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

export async function POST(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  let body: ProductBody
  try {
    body = (await request.json()) as ProductBody
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  const hasPendingImages = body.images?.some((image) => image.url.includes('/pending/'))
  const createBody = hasPendingImages ? { ...body, images: [] } : body

  try {
    const res = await fetchBackend(`/products`, {
      request,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createBody),
    })
    const data = (await readBackendJson(res)) as { id?: string }
    if (!res.ok || !data.id) return NextResponse.json(data, { status: res.status })

    if (hasPendingImages && body.images?.length) {
      const patchBody = await withFinalizedImages(body, data.id)
      const patchRes = await fetchBackend(`/products/${data.id}`, {
        request,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      })
      const patched = await readBackendJson(patchRes)
      if (!patchRes.ok) return NextResponse.json(patched, { status: patchRes.status })
      return NextResponse.json(patched, { status: 201 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
