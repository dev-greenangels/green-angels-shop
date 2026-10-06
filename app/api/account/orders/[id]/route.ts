import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

/** CAB-003: customer order detail — Nest enforces userId ownership. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  const { id } = await context.params
  if (!id?.trim()) {
    return NextResponse.json({ code: 'ORDER_NOT_FOUND' }, { status: 400 })
  }

  try {
    const locale = new URL(request.url).searchParams.get('locale')
    const qs = locale ? `?locale=${encodeURIComponent(locale)}` : ''
    const res = await fetchBackend(
      `/account/orders/${encodeURIComponent(id.trim())}${qs}`,
      {
        request,
        cache: 'no-store',
      },
    )
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ code: 'API_UNAVAILABLE' }, { status: 502 })
  }
}
