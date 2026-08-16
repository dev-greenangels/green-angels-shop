import { NextRequest, NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'

export async function GET(request: NextRequest) {
  const sku = request.nextUrl.searchParams.get('sku') ?? ''
  try {
    const res = await fetch(
      `${getBackendApiUrl()}/catalog/photos/by-sku?sku=${encodeURIComponent(sku)}`,
      { cache: 'no-store' },
    )
    const data = await res.json().catch(() => [])
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
