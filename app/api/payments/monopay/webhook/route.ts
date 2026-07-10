import { NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const xSign = request.headers.get('x-sign') ?? ''

  try {
    const res = await fetch(`${getBackendApiUrl()}/payments/monopay/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sign': xSign,
      },
      body: rawBody,
    })

    if (!res.ok) {
      return new NextResponse(null, { status: res.status })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося обробити webhook Monopay.' },
      { status: 502 },
    )
  }
}
