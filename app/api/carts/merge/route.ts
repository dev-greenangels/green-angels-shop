import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'
import { buildCartSourceHeaders } from '@/lib/carts/cart-source-headers'

export async function POST(request: Request) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некоректний JSON.' }, { status: 400 })
  }

  try {
    const sourceHeaders = buildCartSourceHeaders(request)
    const res = await fetchBackend('/carts/merge', {
      request,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...sourceHeaders },
      body: JSON.stringify(body),
    })
    const data = await readBackendJson(res)
    const response = NextResponse.json(data, { status: res.ok ? 200 : res.status })
    if (res.ok) forwardBackendCookies(res, response)
    return response
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
