import { NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = new URLSearchParams({
    settlementRef: url.searchParams.get('settlementRef') ?? '',
    q: url.searchParams.get('q') ?? '',
  })

  try {
    const res = await fetch(`${getBackendApiUrl()}/nova-poshta/streets?${params}`, {
      cache: 'no-store',
    })
    const data = await res.json().catch(() => [])
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch {
    return NextResponse.json([], { status: 502 })
  }
}
