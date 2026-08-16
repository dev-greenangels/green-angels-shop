import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { consumeOtpIpLimit, readBrowserIpFromRequest } from '@/lib/auth/otp-ip-rate-limit'

export async function POST(request: Request) {
  let body: {
    phone?: string
    email?: string
    code?: string
    purpose?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const purpose =
    body.purpose === 'checkout' ||
    body.purpose === 'review' ||
    body.purpose === 'profile' ||
    body.purpose === 'login'
      ? body.purpose
      : 'login'

  if (!phone && !email) {
    return NextResponse.json({ error: 'Вкажіть телефон або email.' }, { status: 400 })
  }
  if (!code) {
    return NextResponse.json({ error: 'Вкажіть код підтвердження.' }, { status: 400 })
  }

  if (!consumeOtpIpLimit('verify', readBrowserIpFromRequest(request))) {
    return NextResponse.json({ error: 'Забагато запитів. Спробуйте пізніше.' }, { status: 429 })
  }

  try {
    const backendRes = await fetchBackend('/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(phone ? { phone } : {}),
        ...(email ? { email: email.toLowerCase() } : {}),
        code,
        purpose,
      }),
    })
    const data = await readBackendJson(backendRes)
    return NextResponse.json(data, { status: backendRes.status })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
