import { NextResponse } from 'next/server'

import { fetchBackend } from '@/lib/api/backend-fetch'

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

    const res = await fetchBackend(`/orders/confirmation/${encoded}/pdf`, {
      method: 'GET',
      request,
      cache: 'no-store',
      headers,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return NextResponse.json(data, { status: res.status })
    }

    const pdf = await res.arrayBuffer()
    const safeName = orderNumber.replace(/[^\w-]+/g, '-')
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="order-${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
