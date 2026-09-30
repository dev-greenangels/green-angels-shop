import { NextResponse } from 'next/server'

import { fetchBackend } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  try {
    const res = await fetchBackend('/backstage/flexi/recovery/legacy-journal/export', {
      request,
      method: 'GET',
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: text.slice(0, 500) || 'Export failed' },
        { status: res.status },
      )
    }
    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/x-ndjson',
        'Content-Disposition':
          res.headers.get('Content-Disposition') ||
          'attachment; filename="flexi-change-event-legacy.jsonl"',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
