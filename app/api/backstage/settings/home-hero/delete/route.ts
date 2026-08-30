import { NextResponse } from 'next/server'

import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { deleteHomeHeroImageOnBackend } from '@/lib/media/backend-proxy'

export async function POST(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  try {
    const result = await deleteHomeHeroImageOnBackend(request)
    if (!result.ok) {
      return NextResponse.json(result.error ?? { error: 'Помилка видалення.' }, {
        status: result.status,
      })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
