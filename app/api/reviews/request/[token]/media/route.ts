import { NextResponse } from 'next/server'

import { proxyBackendForm } from '@/lib/media/backend-proxy'
import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { validateReviewImageFile } from '@/lib/review-image'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ token: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params
  const url = new URL(request.url)
  const productId = url.searchParams.get('productId')?.trim()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Некоректний запит.' }, { status: 400 })
  }

  const entry = formData.get('file')
  if (!(entry instanceof File)) {
    return NextResponse.json({ error: 'Оберіть файл зображення.' }, { status: 400 })
  }

  const validationError = validateReviewImageFile(entry)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const path = productId
    ? `/reviews/request/${encodeURIComponent(token)}/media?productId=${encodeURIComponent(productId)}`
    : `/reviews/request/${encodeURIComponent(token)}/media`
  try {
    return await proxyBackendForm(path, request, formData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Помилка запису файлу.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { token } = await context.params
  let body: { productId?: string; url?: string }
  try {
    body = (await request.json()) as { productId?: string; url?: string }
  } catch {
    return NextResponse.json({ error: 'Некоректний запит.' }, { status: 400 })
  }

  try {
    const res = await fetchBackend(`/reviews/request/${encodeURIComponent(token)}/media`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(body.productId ? { productId: body.productId } : {}),
        url: body.url,
      }),
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося видалити фото.' }, { status: 502 })
  }
}
