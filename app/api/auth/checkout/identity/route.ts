import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'

export async function POST(request: Request) {
  let body: {
    phone?: string
    email?: string
    verificationToken?: string
    firstName?: string
    lastName?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const verificationToken =
    typeof body.verificationToken === 'string' ? body.verificationToken.trim() : ''

  if (!phone && !email) {
    return NextResponse.json({ error: 'Вкажіть телефон або email.' }, { status: 400 })
  }
  if (!verificationToken) {
    return NextResponse.json({ error: 'Потрібна верифікація.' }, { status: 400 })
  }

  try {
    const backendRes = await fetchBackend('/auth/checkout/identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        verificationToken,
        ...(typeof body.firstName === 'string' ? { firstName: body.firstName.trim() } : {}),
        ...(typeof body.lastName === 'string' ? { lastName: body.lastName.trim() } : {}),
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
