import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export const maxDuration = 300

const ALLOWED = new Set([
  'categories',
  'attributes',
  'features',
  'product-features',
  'products',
  'variants',
  'reviews',
  'blog',
  'users',
  'orders',
  'order-lines',
])

type Params = { params: Promise<{ type: string }> }

export async function POST(request: Request, { params }: Params) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const { type } = await params
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: `Невідомий тип імпорту: ${type}` }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Очікується multipart/form-data з файлом.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Поле file обовʼязкове.' }, { status: 400 })
  }

  try {
    const upstream = new FormData()
    upstream.append('file', file, file.name || `${type}.csv`)

    const res = await fetchBackend(`/import/csv/${type}`, {
      request,
      method: 'POST',
      body: upstream,
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
