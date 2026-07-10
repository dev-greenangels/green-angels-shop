import { NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'

export const revalidate = 60

export async function GET() {
  try {
    const res = await fetch(`${getBackendApiUrl()}/redirects/active`, {
      next: { revalidate: 60 },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
