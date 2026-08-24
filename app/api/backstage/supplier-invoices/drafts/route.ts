import { NextResponse } from 'next/server'

import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { proxyBackendForm } from '@/lib/media/backend-proxy'

export const runtime = 'nodejs'

const MAX_PDF_BYTES = 15 * 1024 * 1024

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
    return NextResponse.json({ error: 'Оберіть PDF файл.' }, { status: 400 })
  }
  if (entry.size === 0) {
    return NextResponse.json({ error: 'Файл порожній.' }, { status: 400 })
  }
  if (entry.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: 'Максимальний розмір PDF — 15 МБ.' }, { status: 400 })
  }

  try {
    return await proxyBackendForm('/backstage/supplier-invoices/drafts', request, formData)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
