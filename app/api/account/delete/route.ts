import { NextResponse } from 'next/server'

import { fetchBackend, forwardBackendCookies, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

export async function POST(request: Request) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  const body = await request.text()
  try {
    const res = await fetchBackend('/account/delete', {
      request,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    const data = await readBackendJson(res)
    const response = NextResponse.json(data, { status: res.status })
    forwardBackendCookies(res, response)
    return response
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
