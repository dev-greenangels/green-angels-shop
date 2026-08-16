import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function GET(request: Request) {
  try {
    const res = await fetchBackend('/referrals/program/public', { request, cache: 'no-store' })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Помилка зʼєднання з API.' }, { status: 502 })
  }
}
