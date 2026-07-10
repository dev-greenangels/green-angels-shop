import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')?.trim() ?? ''

  if (!phone) {
    return NextResponse.json({ error: 'Вкажіть номер телефону.' }, { status: 400 })
  }

  try {
    const backendRes = await fetchBackend(
      `/auth/customer-by-phone?phone=${encodeURIComponent(phone)}`,
      { cache: 'no-store' },
    )
    const data = await readBackendJson(backendRes)
    return NextResponse.json(data, { status: backendRes.status })
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
