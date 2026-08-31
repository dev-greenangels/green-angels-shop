import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

type Params = { params: Promise<{ orderId: string }> }

export async function GET(request: Request, { params }: Params) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  const { orderId } = await params
  if (!orderId?.trim()) {
    return NextResponse.json({ error: 'Невірний ідентифікатор замовлення.' }, { status: 400 })
  }

  try {
    const res = await fetchBackend(
      `/contract-withdrawals/account/orders/${encodeURIComponent(orderId.trim())}/meta`,
      { request, cache: 'no-store' },
    )
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
