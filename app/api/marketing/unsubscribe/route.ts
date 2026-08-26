import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

/** Proxy one-click marketing unsubscribe (no session required). */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')?.trim() || ''
  if (!token) {
    return NextResponse.json({ ok: false, message: 'Missing token.' }, { status: 400 })
  }
  try {
    const res = await fetchBackend(
      `/legal/marketing/unsubscribe?token=${encodeURIComponent(token)}`,
      { request, method: 'GET', cache: 'no-store' },
    )
    const data = await readBackendJson(res)
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch {
    return NextResponse.json({ ok: false, message: 'Unsubscribe unavailable.' }, { status: 502 })
  }
}
