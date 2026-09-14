import { NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale')?.trim() || 'uk'
  const countrySiteCode =
    searchParams.get('countrySiteCode')?.trim() ||
    (await getRequestCountrySiteCode()) ||
    ''
  try {
    const params = new URLSearchParams({ locale })
    if (countrySiteCode === 'sk' || countrySiteCode === 'hu' || countrySiteCode === 'at') {
      params.set('countrySiteCode', countrySiteCode)
    }
    const res = await fetchBackend(`/legal/current?${params.toString()}`, {
      request,
      cache: 'no-store',
    })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ items: [] })
  }
}
