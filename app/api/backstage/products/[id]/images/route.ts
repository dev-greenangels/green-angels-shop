import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { finalizeProductImages, type ProductImageInput } from '@/lib/media/finalize'

type RouteContext = { params: Promise<{ id: string }> }

type ImagesBody = {
  images: ProductImageInput[]
}

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { id } = await context.params
  let body: ImagesBody
  try {
    body = (await request.json()) as ImagesBody
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  let images = body.images ?? []
  if (images.some((image) => image.url.includes('/pending/'))) {
    images = (await finalizeProductImages(images, id)) ?? images
  }

  try {
    const res = await fetchBackend(`/products/${id}/images`, {
      request,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
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
