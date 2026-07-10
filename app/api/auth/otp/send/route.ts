import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function POST(request: Request) {
  let body: { phone?: string; email?: string; purpose?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''

  if (!phone && !email) {
    return NextResponse.json({ error: 'Вкажіть телефон або email.' }, { status: 400 })
  }

  try {
    const backendRes = await fetchBackend('/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(phone ? { phone } : {}),
        ...(email ? { email: email.toLowerCase() } : {}),
        purpose: body.purpose === 'checkout' ? 'checkout' : 'login',
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
