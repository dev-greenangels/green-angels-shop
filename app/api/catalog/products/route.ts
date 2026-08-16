import { NextRequest, NextResponse } from 'next/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'
import { defaultLocale, isAppLocale } from '@/i18n/routing'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('locale')
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale
  const params = new URLSearchParams({ locale, published: 'true' })

  const search = searchParams.get('search')
  const categoryId = searchParams.get('categoryId')
  const categorySlug = searchParams.get('categorySlug')
  const stock = searchParams.get('stock')
  const excludeId = searchParams.get('excludeId')
  const ids = searchParams.get('ids')
  const slugs = searchParams.get('slugs')
  const page = searchParams.get('page')
  const pageSize = searchParams.get('pageSize')
  const limit = searchParams.get('limit')
  const characteristics = searchParams.get('characteristics')
  const variantAttributes = searchParams.get('variantAttributes')
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')

  if (search) params.set('search', search)
  if (categoryId) params.set('categoryId', categoryId)
  if (categorySlug) params.set('categorySlug', categorySlug)
  if (stock) params.set('stock', stock)
  if (excludeId) params.set('excludeId', excludeId)
  if (ids) params.set('ids', ids)
  if (slugs) params.set('slugs', slugs)
  if (page) params.set('page', page)
  if (pageSize) params.set('pageSize', pageSize)
  if (limit) params.set('limit', limit)
  if (characteristics) params.set('characteristics', characteristics)
  if (variantAttributes) params.set('variantAttributes', variantAttributes)
  if (priceMin) params.set('priceMin', priceMin)
  if (priceMax) params.set('priceMax', priceMax)
  const sort = searchParams.get('sort')
  const lowStockThreshold = searchParams.get('lowStockThreshold')
  const hasDiscount = searchParams.get('hasDiscount')
  const discountMinQuantity = searchParams.get('discountMinQuantity')
  const discountQuantityMode = searchParams.get('discountQuantityMode')
  if (sort) params.set('sort', sort)
  if (lowStockThreshold) params.set('lowStockThreshold', lowStockThreshold)
  if (hasDiscount) params.set('hasDiscount', hasDiscount)
  if (discountMinQuantity) params.set('discountMinQuantity', discountMinQuantity)
  if (discountQuantityMode) params.set('discountQuantityMode', discountQuantityMode)
  const namePrefix = searchParams.get('namePrefix')
  if (namePrefix) params.set('namePrefix', namePrefix)

  try {
    const res = await fetch(`${getBackendApiUrl()}/products?${params}`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json(data, { status: res.status })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Не вдалося зʼєднатися з API. Перевірте, що бекенд запущений.' },
      { status: 502 },
    )
  }
}
