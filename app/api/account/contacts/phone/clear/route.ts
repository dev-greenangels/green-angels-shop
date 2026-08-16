import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

export async function POST(request: Request) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  try {
    const res = await fetchBackend('/account/contacts/phone/clear', {
      request,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
