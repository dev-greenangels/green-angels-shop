import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.trim() ?? ''

  if (!email) {
    return NextResponse.json({ error: 'Вкажіть email.' }, { status: 400 })
  }

  try {
    const backendRes = await fetchBackend(
      `/auth/customer-by-email?email=${encodeURIComponent(email.toLowerCase())}`,
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
