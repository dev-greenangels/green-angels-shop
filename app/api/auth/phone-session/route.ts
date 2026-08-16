import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import { fetchPublicSiteSettings, getMarketSettings } from '@/lib/settings/fetch'
import { isValidPhoneForPolicy, phoneErrorForPolicy } from '@/lib/settings/market'

export async function POST(request: Request) {
  let body: { phone?: string; verificationToken?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const market = getMarketSettings(await fetchPublicSiteSettings())

  if (!phone || !isValidPhoneForPolicy(phone, market.authPhonePolicy)) {
    return NextResponse.json(
      {
        error:
          phoneErrorForPolicy(phone, market.authPhonePolicy) ??
          'Вкажіть коректний номер телефону.',
      },
      { status: 400 },
    )
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
