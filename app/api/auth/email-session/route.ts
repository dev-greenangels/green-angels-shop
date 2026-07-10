import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import { isValidEmail } from '@/lib/validation/register-form'

export async function POST(request: Request) {
  let body: { email?: string; verificationToken?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const emailRaw = typeof body.email === 'string' ? body.email.trim() : ''
  const verificationToken =
    typeof body.verificationToken === 'string' ? body.verificationToken.trim() : ''

  if (!emailRaw || !isValidEmail(emailRaw)) {
    return NextResponse.json({ error: 'Вкажіть коректний email.' }, { status: 400 })
  }
  if (!verificationToken) {
    return NextResponse.json({ error: 'Потрібна верифікація email.' }, { status: 400 })
  }

  try {
    const backendRes = await fetchBackend('/auth/email-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailRaw.toLowerCase(),
        verificationToken,
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
