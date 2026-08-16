import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

type RouteContext = {
  params: Promise<{ orderNumber: string }>
}

function readSyncToken(request: Request): string {
  const header = request.headers.get('x-monopay-sync-token')?.trim()
  if (header) return header
  const authorization = request.headers.get('authorization')?.trim() ?? ''
  const bearer = /^Bearer\s+(\S+)/i.exec(authorization)
  return bearer?.[1] ?? ''
}

/**
 * BFF: browser → Next → Nest sync against Mono invoice status.
 * Used on /checkout/success when webhook may not have arrived yet.
 */
export async function POST(request: Request, context: RouteContext) {
  const { orderNumber } = await context.params
  const encoded = encodeURIComponent(orderNumber.trim())
  const token = readSyncToken(request)

  if (!token) {
    return NextResponse.json({ error: 'Недійсний токен синхронізації оплати.' }, { status: 401 })
  }

  try {
    const res = await fetchBackend(`/payments/monopay/sync/${encoded}`, {
      method: 'POST',
      headers: { 'X-Monopay-Sync-Token': token },
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося синхронізувати статус оплати.' },
      { status: 502 },
    )
  }
}
