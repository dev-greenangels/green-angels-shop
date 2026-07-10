import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import { isValidUkrPhone } from '@/lib/validation/checkout-form'

export async function POST(request: Request) {
  let body: { phone?: string; verificationToken?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  if (!phone || !isValidUkrPhone(phone)) {
    return NextResponse.json({ error: 'Вкажіть коректний український номер (+380).' }, { status: 400 })
  }

  const verificationToken =
    typeof body.verificationToken === 'string' ? body.verificationToken.trim() : ''

  try {
    const backendRes = await fetchBackend('/auth/phone-session', {
      method: 'POST',
      request,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        verificationToken: verificationToken || undefined,
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
