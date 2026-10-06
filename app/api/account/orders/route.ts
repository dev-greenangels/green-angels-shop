import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

export async function GET(request: Request) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()
    for (const key of ['page', 'pageSize', 'locale'] as const) {
      const value = searchParams.get(key)
      if (value) params.set(key, value)
    }
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const res = await fetchBackend(`/account/orders${suffix}`, { request, cache: 'no-store' })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ code: 'API_UNAVAILABLE' }, { status: 502 })
  }
}
