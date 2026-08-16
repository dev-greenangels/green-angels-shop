import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { REFERRAL_COOKIE_NAME } from '@/lib/referrals/constants'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректне тіло запиту.' }, { status: 400 })
  }

  if (body && typeof body === 'object' && !('referralCode' in body)) {
    const referralCode = (await cookies()).get(REFERRAL_COOKIE_NAME)?.value?.trim()
    if (referralCode) {
      ;(body as Record<string, unknown>).referralCode = referralCode
    }
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const idempotencyKey = request.headers.get('Idempotency-Key')?.trim()
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }

    const res = await fetchBackend('/orders', {
      method: 'POST',
      request,
      headers,
      body: JSON.stringify(body),
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
