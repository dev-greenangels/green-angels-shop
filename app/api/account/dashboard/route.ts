import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { requireCustomerSession } from '@/lib/auth/require-customer-session'

async function forwardGet(request: Request, path: string) {
  try {
    const res = await fetchBackend(path, { request, cache: 'no-store' })
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}

export async function GET(request: Request) {
  const { error } = await requireCustomerSession(request)
  if (error) return error

  return forwardGet(request, '/account/dashboard')
}
