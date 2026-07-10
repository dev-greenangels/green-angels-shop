import { NextResponse } from 'next/server'

import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { storeProductImage } from '@/lib/media/store'
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

  const productId = formData.get('productId')
  const entityId = typeof productId === 'string' && productId.trim() ? productId.trim() : undefined

  try {
    const bytes = Buffer.from(await entry.arrayBuffer())
    const stored = await storeProductImage(bytes, { productId: entityId })
    return NextResponse.json(stored)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Помилка запису файлу.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
