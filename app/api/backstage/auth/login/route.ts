import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import { isValidEmail } from '@/lib/validation/register-form'

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний запит.' }, { status: 400 })
  }

  const emailRaw = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!emailRaw || !isValidEmail(emailRaw)) {
    return NextResponse.json({ error: 'Вкажіть коректний email.' }, { status: 400 })
  }
  if (!password) {
    return NextResponse.json({ error: 'Вкажіть пароль.' }, { status: 400 })
  }

  try {
    const backendRes = await fetchBackend('/auth/backstage/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailRaw.toLowerCase(), password }),
    })

    const data = await readBackendJson<{ error?: string; message?: string | string[] }>(
      backendRes,
    )
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
