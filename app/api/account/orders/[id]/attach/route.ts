import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

export async function POST(
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
    const res = await fetchBackend(`/account/orders/${encodeURIComponent(id.trim())}/attach`, {
      request,
      method: 'POST',
    })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ code: 'API_UNAVAILABLE' }, { status: 502 })
  }
}
