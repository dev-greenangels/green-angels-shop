import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  const { productId } = await params

  try {
    const res = await fetchBackend(`/favorites/${encodeURIComponent(productId)}`, {
      request,
      method: 'DELETE',
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
