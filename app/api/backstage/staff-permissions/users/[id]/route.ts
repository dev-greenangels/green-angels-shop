import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: Request, ctx: Ctx) {
  const { session, error } = await requireBackstageSession(request)
  if (error) return error
  if (session?.staffRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Недостатньо прав доступу.' }, { status: 403 })
  }
  const { id } = await ctx.params
  const res = await fetchBackend(`/staff-permissions/users/${encodeURIComponent(id)}`, {
    request,
  })
  const data = await readBackendJson(res)
  return NextResponse.json(data, { status: res.status })
}

export async function PUT(request: Request, ctx: Ctx) {
  const { session, error } = await requireBackstageSession(request)
  if (error) return error
  if (session?.staffRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Недостатньо прав доступу.' }, { status: 403 })
  }
  const { id } = await ctx.params
  const body = await request.json().catch(() => null)
  const res = await fetchBackend(`/staff-permissions/users/${encodeURIComponent(id)}`, {
    request,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const data = await readBackendJson(res)
  return NextResponse.json(data, { status: res.status })
}
