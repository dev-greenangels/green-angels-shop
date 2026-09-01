import { NextResponse } from 'next/server'

import { fetchBackend } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const url = new URL(request.url)
  const params = new URLSearchParams()
  const format = url.searchParams.get('format')?.trim()
  if (format === 'csv' || format === 'xlsx') params.set('format', format)

  const q = url.searchParams.get('q')?.trim()
  if (q) params.set('q', q.slice(0, 120))

  const status = url.searchParams.get('status')?.trim()
  if (status === 'active' || status === 'withdrawn') params.set('status', status)

  const sortBy = url.searchParams.get('sortBy')?.trim()
  if (
    sortBy === 'subscribedAt' ||
    sortBy === 'email' ||
    sortBy === 'lastName' ||
    sortBy === 'status' ||
    sortBy === 'source'
  ) {
    params.set('sortBy', sortBy)
  }

  const sortDir = url.searchParams.get('sortDir')?.trim()
  if (sortDir === 'asc' || sortDir === 'desc') params.set('sortDir', sortDir)

  const query = params.toString()
  const path = query
    ? `/legal/admin/marketing-subscribers/export?${query}`
    : '/legal/admin/marketing-subscribers/export'

  try {
    const res = await fetchBackend(path, { request, cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: text || 'Не вдалося експортувати підписників.' },
        { status: res.status },
      )
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType =
      res.headers.get('Content-Type') ??
      (format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv; charset=utf-8')
    const disposition =
      res.headers.get('Content-Disposition') ??
      `attachment; filename="marketing-subscribers.${format === 'xlsx' ? 'xlsx' : 'csv'}"`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
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
