import { NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'

/**
 * Optional legacy proxy. Prod/local Stripe webhook should hit Nest directly:
 *   {API_PUBLIC_URL}/payments/stripe/webhook
 * This route remains only as a manual fallback / debug helper.
 */
export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer())
  const signature = request.headers.get('stripe-signature') ?? ''

  try {
    const res = await fetch(`${getBackendApiUrl()}/payments/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature,
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

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося обробити webhook Stripe.' },
      { status: 502 },
    )
  }
}
