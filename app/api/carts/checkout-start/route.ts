import { NextResponse } from 'next/server'

import {
  fetchBackend,
  forwardBackendCookies,
  readBackendJson,
} from '@/lib/api/backend-fetch'
import { buildCartSourceHeaders } from '@/lib/carts/cart-source-headers'

export async function POST(request: Request) {
  try {
    const sourceHeaders = buildCartSourceHeaders(request)
    const res = await fetchBackend('/carts/me/checkout-start', {
      request,
      method: 'POST',
      headers: sourceHeaders,
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
