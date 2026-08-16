import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function POST(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Очікується multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Поле file обовʼязкове.' }, { status: 400 })
  }

  try {
    const upstream = new FormData()
    upstream.append('file', file, file.name || 'images.csv')
    const res = await fetchBackend('/import/product-images/start', {
      request,
      method: 'POST',
      body: upstream,
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося стартувати імпорт зображень.' }, { status: 502 })
  }
}
