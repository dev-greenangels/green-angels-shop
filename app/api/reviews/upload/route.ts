import { NextResponse } from 'next/server'

import { requireCustomerSession } from '@/lib/auth/require-customer-session'
import { proxyBackendForm } from '@/lib/media/backend-proxy'
import { validateReviewImageFile } from '@/lib/review-image'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { error } = await requireCustomerSession(request)
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

  const validationError = validateReviewImageFile(entry)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  try {
    return await proxyBackendForm('/reviews/media', request, formData)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Помилка запису файлу.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
