import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

export async function GET(request: Request) {
  const { session, error } = await requireBackstageSession(request)
  if (error) return error
  if (session?.staffRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Недостатньо прав доступу.' }, { status: 403 })
  }

  const res = await fetchBackend('/staff-permissions/registry', { request })
  const data = await readBackendJson(res)
  return NextResponse.json(data, { status: res.status })
}
