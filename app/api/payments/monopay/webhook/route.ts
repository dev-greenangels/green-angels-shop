import { NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'

/**
 * Optional legacy proxy. Prod/local Mono webhook should hit Nest directly:
 *   {API_PUBLIC_URL}/payments/monopay/webhook
 * This route remains only as a manual fallback / debug helper.
 */
export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer())
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
      const text = await res.text().catch(() => '')
      return new NextResponse(text || null, {
        status: res.status,
        headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося обробити webhook Monopay.' },
      { status: 502 },
    )
  }
}
