import { NextRequest, NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: NextRequest) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  try {
    const res = await fetchBackend('/backstage/photos/sync-legacy/status', {
      request,
      cache: 'no-store',
    })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
