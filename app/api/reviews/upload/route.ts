import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

import { NextResponse } from 'next/server'

import { requireCustomerSession } from '@/lib/auth/require-customer-session'
import { getReviewImageExtension, validateReviewImageFile } from '@/lib/review-image'

export const runtime = 'nodejs'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'reviews')

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

  const ext = getReviewImageExtension(entry)
  if (!ext) {
    return NextResponse.json({ error: 'Невідомий формат файлу.' }, { status: 400 })
  }

  try {
    const filename = `${randomUUID()}.${ext}`
    const bytes = Buffer.from(await entry.arrayBuffer())

    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, filename), bytes)

    return NextResponse.json({ url: `/uploads/reviews/${filename}` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Помилка запису файлу.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
