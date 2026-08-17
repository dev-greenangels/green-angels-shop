import { NextRequest, NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { finalizeCategoryImageOnBackend } from '@/lib/media/backend-proxy'
import { isPendingCategoryPath } from '@/lib/media/paths'
import { defaultLocale, isAppLocale } from '@/i18n/routing'

type CategoryBody = {
  image?: string | null
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const requested = request.nextUrl.searchParams.get('locale')
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale
  const editParam = request.nextUrl.searchParams.get('edit')
  const edit = editParam === '0' || editParam === 'false' ? '0' : '1'

  try {
    const res = await fetchBackend(
      `/categories?locale=${encodeURIComponent(locale)}&edit=${edit}`,
      {
      request,
      cache: 'no-store',
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

export async function POST(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  let body: CategoryBody
  try {
    body = (await request.json()) as CategoryBody
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  const pendingImage =
    typeof body.image === 'string' && isPendingCategoryPath(body.image) ? body.image : null

  try {
    const res = await fetchBackend(`/categories`, {
      request,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingImage ? { ...body, image: null } : body),
    })
    const data = (await readBackendJson(res)) as { id?: string }
    if (!res.ok || !data.id) return NextResponse.json(data, { status: res.status })

    if (pendingImage) {
      const finalized = await finalizeCategoryImageOnBackend(request, data.id, pendingImage)
      if (!finalized.ok) {
        return NextResponse.json(finalized.error, { status: finalized.status })
      }
      const patchRes = await fetchBackend(`/categories/${data.id}`, {
        request,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: finalized.image }),
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
