import { NextResponse } from 'next/server'

import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { proxyBackendForm } from '@/lib/media/backend-proxy'
import { validateImageFile } from '@/lib/media/validate'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

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

  const validationError = validateImageFile(entry)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  try {
    return await proxyBackendForm('/backstage/media/settings/home-hero', request, formData)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
