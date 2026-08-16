import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import { consumeOtpIpLimit, readBrowserIpFromRequest } from '@/lib/auth/otp-ip-rate-limit'

export async function POST(request: Request) {
  let body: { phone?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!phone && !email) {
    return NextResponse.json(
      { error: 'Вкажіть email або телефон для перевірки акаунта.' },
      { status: 400 },
    )
  }

  if (!consumeOtpIpLimit('hint', readBrowserIpFromRequest(request))) {
    return NextResponse.json({ error: 'Забагато запитів. Спробуйте пізніше.' }, { status: 429 })
  }

  try {
    const backendRes = await fetchBackend('/auth/checkout/identity-hint', {
      method: 'POST',
      request,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      }),
    })
    const data = await readBackendJson(backendRes)
    const res = NextResponse.json(data, { status: backendRes.status })
    forwardBackendCookies(backendRes, res)
    return res
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
