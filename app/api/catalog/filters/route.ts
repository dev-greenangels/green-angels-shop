import { NextRequest, NextResponse } from 'next/server'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { defaultLocale, isAppLocale } from '@/i18n/routing'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('locale')
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale
  const params = new URLSearchParams({ locale })

  const categorySlug = searchParams.get('categorySlug')
  const search = searchParams.get('search')
  const characteristics = searchParams.get('characteristics')
  const variantAttributes = searchParams.get('variantAttributes')
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  if (categorySlug) params.set('categorySlug', categorySlug)
  if (search) params.set('search', search)
  if (characteristics) params.set('characteristics', characteristics)
  if (variantAttributes) params.set('variantAttributes', variantAttributes)
  if (priceMin) params.set('priceMin', priceMin)
  if (priceMax) params.set('priceMax', priceMax)

  try {
    const res = await fetchBackend(`/catalog/filters?${params}`, { cache: 'no-store' })
    const data = await readBackendJson(res)
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Не вдалося зʼєднатися з API.' }, { status: 502 })
  }
}
