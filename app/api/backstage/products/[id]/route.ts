import { NextRequest, NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import {
  finalizeProductImagesOnBackend,
  type ProductImageInput,
} from '@/lib/media/backend-proxy'
import { defaultLocale, isAppLocale } from '@/i18n/routing'

type RouteContext = { params: Promise<{ id: string }> }
type ProductBody = { images?: ProductImageInput[]; [key: string]: unknown }

export async function GET(request: NextRequest, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { id } = await context.params
  const requested = request.nextUrl.searchParams.get('locale')
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale

  try {
    const res = await fetchBackend(`/products/${id}?locale=${encodeURIComponent(locale)}`, {
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

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { id } = await context.params
  let body: ProductBody
  try {
    body = (await request.json()) as ProductBody
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  if (body.images?.some((image) => image.url.includes('/pending/'))) {
    const finalized = await finalizeProductImagesOnBackend(request, id, body.images)
    if (!finalized.ok) {
      return NextResponse.json(finalized.error, { status: finalized.status })
    }
    body = { ...body, images: finalized.images }
  }

  try {
    const res = await fetchBackend(`/products/${id}`, {
      request,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
