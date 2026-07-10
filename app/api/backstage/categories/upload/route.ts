import { NextResponse } from 'next/server'

import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { storeCategoryImage } from '@/lib/media/store'
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

  const categoryId = formData.get('categoryId')
  const entityId = typeof categoryId === 'string' && categoryId.trim() ? categoryId.trim() : undefined

  try {
    const bytes = Buffer.from(await entry.arrayBuffer())
    const stored = await storeCategoryImage(bytes, { categoryId: entityId })
    return NextResponse.json(stored)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Помилка запису файлу.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
