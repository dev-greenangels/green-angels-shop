import { NextResponse } from 'next/server'

import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { proxyBackendForm } from '@/lib/media/backend-proxy'

export const runtime = 'nodejs'

const MAX_FRESH_PHOTO_BYTES = 15 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/webp'])
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'webp'])

function validateFreshPhotoFile(file: File): string | null {
  const mime = file.type?.toLowerCase() || ''
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const mimeOk = ALLOWED_MIME.has(mime)
  const extOk = ALLOWED_EXT.has(ext)
  if (!mimeOk && !extOk) {
    return 'Дозволені формати: JPEG, WebP.'
  }
  if (file.size > MAX_FRESH_PHOTO_BYTES) {
    return 'Максимальний розмір файлу — 15 МБ.'
  }
  if (file.size === 0) {
    return 'Файл порожній.'
  }
  return null
}

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

  const validationError = validateFreshPhotoFile(entry)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  try {
    return await proxyBackendForm('/backstage/photos/upload', request, formData)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
