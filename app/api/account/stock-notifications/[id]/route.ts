import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(request: Request, context: RouteContext) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  const { id } = await context.params
  try {
    const res = await fetchBackend(`/account/stock-notifications/${encodeURIComponent(id)}`, {
      request,
      method: 'DELETE',
    })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
