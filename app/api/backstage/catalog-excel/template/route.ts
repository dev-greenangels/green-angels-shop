import { NextResponse } from 'next/server'

import { fetchBackend } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  try {
    const url = new URL(request.url)
    const mode = url.searchParams.get('mode') ?? 'empty'
    const sheets = url.searchParams.get('sheets') ?? ''
    const qs = new URLSearchParams()
    qs.set('mode', mode)
    if (sheets) qs.set('sheets', sheets)

    const res = await fetchBackend(`/catalog-excel/template?${qs.toString()}`, {
      request,
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: text || 'Не вдалося завантажити шаблон.' },
        { status: res.status },
      )
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const disposition =
      res.headers.get('Content-Disposition') ??
      'attachment; filename="catalog-import-template.xlsx"'
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': disposition,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
