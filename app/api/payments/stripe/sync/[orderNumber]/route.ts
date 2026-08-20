import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

type RouteContext = {
  params: Promise<{ orderNumber: string }>
}

function readConfirmationToken(request: Request): string {
  const header = request.headers.get('x-order-confirmation-token')?.trim()
  if (header) return header
  const authorization = request.headers.get('authorization')?.trim() ?? ''
  const bearer = /^Bearer\s+(\S+)/i.exec(authorization)
  return bearer?.[1] ?? ''
}

/**
 * BFF: browser → Next → Nest retrieve Stripe Checkout Session.
 * Used on /checkout/success and after 3DS return when webhook may lag.
 */
export async function POST(request: Request, context: RouteContext) {
  const { orderNumber } = await context.params
  const encoded = encodeURIComponent(orderNumber.trim())
  const confirmationToken = readConfirmationToken(request)

  try {
    const headers: Record<string, string> = {}
    if (confirmationToken) {
      headers['X-Order-Confirmation-Token'] = confirmationToken
    }

    const res = await fetchBackend(`/payments/stripe/sync/${encoded}`, {
      method: 'POST',
      request,
      headers,
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
