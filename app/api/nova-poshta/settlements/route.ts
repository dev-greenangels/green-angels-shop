import { NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = new URLSearchParams({
    q: url.searchParams.get('q') ?? '',
    limit: url.searchParams.get('limit') ?? '20',
  })
  const warehouseOnly = url.searchParams.get('warehouseOnly')
  if (warehouseOnly) {
    params.set('warehouseOnly', warehouseOnly)
  }

  try {
    const res = await fetch(`${getBackendApiUrl()}/nova-poshta/settlements?${params}`, {
      cache: 'no-store',
    })
    const data = await res.json().catch(() => [])
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}
