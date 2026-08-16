import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

export async function GET(request: Request) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()
    const page = searchParams.get('page')
    const pageSize = searchParams.get('pageSize')
    if (page) params.set('page', page)
    if (pageSize) params.set('pageSize', pageSize)
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const res = await fetchBackend(`/account/reviews${suffix}`, { request, cache: 'no-store' })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
