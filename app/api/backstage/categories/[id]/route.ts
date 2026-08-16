import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import {
  deleteCategoryImagesOnBackend,
  finalizeCategoryImageOnBackend,
} from '@/lib/media/backend-proxy'
import { isPendingCategoryPath } from '@/lib/media/paths'

type RouteContext = { params: Promise<{ id: string }> }
type CategoryBody = { image?: string | null; [key: string]: unknown }

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { id } = await context.params
  let body: CategoryBody
  try {
    body = (await request.json()) as CategoryBody
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  if (typeof body.image === 'string' && isPendingCategoryPath(body.image)) {
    const finalized = await finalizeCategoryImageOnBackend(request, id, body.image)
    if (!finalized.ok) {
      return NextResponse.json(finalized.error, { status: finalized.status })
    }
    body = { ...body, image: finalized.image }
  }

  if (body.image === null) {
    const deleted = await deleteCategoryImagesOnBackend(request, id)
    if (!deleted.ok) {
      return NextResponse.json(deleted.error, { status: deleted.status })
    }
  }

  try {
    const res = await fetchBackend(`/categories/${id}`, {
      request,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await readBackendJson(res)
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { id } = await context.params

  try {
    const res = await fetchBackend(`/categories/${id}`, {
      request,
      method: 'DELETE',
    })
    const data = await readBackendJson(res)
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
