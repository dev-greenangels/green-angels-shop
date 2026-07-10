import { NextRequest, NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.toString()
  try {
    const res = await fetch(`${getBackendApiUrl()}/catalog/photos${search ? `?${search}` : ''}`, {
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
