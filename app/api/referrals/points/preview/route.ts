import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

export async function GET(request: Request) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  const url = new URL(request.url)
  const points = url.searchParams.get('points') ?? ''

  try {
    const res = await fetchBackend(
      `/referrals/points/preview?points=${encodeURIComponent(points)}`,
      { request, cache: 'no-store' },
    )
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Помилка зʼєднання з API.' }, { status: 502 })
  }
}
