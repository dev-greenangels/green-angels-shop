import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

type RouteContext = {
  params: Promise<{ orderNumber: string }>
}

function readConfirmationToken(request: Request): string {
  const header = request.headers.get('x-order-confirmation-token')?.trim()
  if (header) return header
  try {
    const url = new URL(request.url)
    return url.searchParams.get('confirmation')?.trim() ?? ''
  } catch {
    return ''
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { orderNumber } = await context.params
  const encoded = encodeURIComponent(orderNumber)
  const confirmationToken = readConfirmationToken(request)

  try {
    const headers: Record<string, string> = {}
    if (confirmationToken) {
      headers['X-Order-Confirmation-Token'] = confirmationToken
    }

    const res = await fetchBackend(`/orders/confirmation/${encoded}`, {
      method: 'GET',
      request,
      cache: 'no-store',
      headers,
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
