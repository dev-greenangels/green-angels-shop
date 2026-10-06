import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireBackstageSession } from '@/lib/backstage-auth/require-session'

type RouteContext = { params: Promise<{ id: string }> }

async function proxy(
  request: Request,
  orderId: string,
  suffix: string,
  method: 'GET' | 'POST',
  body?: unknown,
) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  try {
    const res = await fetchBackend(`/reviews/backstage/orders/${orderId}/request${suffix}`, {
      request,
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params
  return proxy(request, id, '', 'GET')
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  return proxy(request, id, '', 'POST')
}
