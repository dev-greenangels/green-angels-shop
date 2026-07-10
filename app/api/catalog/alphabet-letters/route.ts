import { NextRequest, NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'
import { defaultLocale, isAppLocale } from '@/i18n/routing'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('locale')
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale

  try {
    const res = await fetch(`${getBackendApiUrl()}/products/alphabet-letters?locale=${locale}`, {
      cache: 'no-store',
    })
    const data = await res.json().catch(() => [])
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
