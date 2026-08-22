import type {
  CartCheckoutSettings,
  CatalogPageSettings,
  HomePageSettings,
  LocalizationSettings,
  MarketSettings,
  MediaWatermarkSettings,
  PublicSiteSettings,
  RecentlyViewedSettings,
  StoreContactSettings,
} from '@/lib/settings/types'

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchBackstageSettings(): Promise<PublicSiteSettings> {
  const res = await fetch('/api/backstage/settings', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageStoreSettings(
  payload: Partial<StoreContactSettings>,
): Promise<StoreContactSettings> {
  const res = await fetch('/api/backstage/settings/store', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageHomeSettings(
  payload: Partial<HomePageSettings>,
): Promise<HomePageSettings> {
  const res = await fetch('/api/backstage/settings/home', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageCartCheckoutSettings(
  payload: Partial<CartCheckoutSettings>,
): Promise<CartCheckoutSettings> {
  const res = await fetch('/api/backstage/settings/cart-checkout', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageCatalogSettings(
  payload: Partial<CatalogPageSettings>,
): Promise<CatalogPageSettings> {
  const res = await fetch('/api/backstage/settings/catalog', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageMediaWatermarkSettings(
  payload: Partial<MediaWatermarkSettings>,
): Promise<MediaWatermarkSettings> {
  const res = await fetch('/api/backstage/settings/media-watermark', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageRecentlyViewedSettings(
  payload: Partial<RecentlyViewedSettings>,
): Promise<RecentlyViewedSettings> {
  const res = await fetch('/api/backstage/settings/recently-viewed', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageLocalizationSettings(
  payload: Partial<LocalizationSettings>,
): Promise<LocalizationSettings> {
  const res = await fetch('/api/backstage/settings/localization', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageMarketSettings(
  payload: Partial<MarketSettings>,
): Promise<MarketSettings> {
  const res = await fetch('/api/backstage/settings/market', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageWholesalePageSettings(
  payload: Partial<import('@/lib/settings/wholesale').WholesalePageSettings>,
): Promise<import('@/lib/settings/wholesale').WholesalePageSettings> {
  const res = await fetch('/api/backstage/settings/wholesale', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageAboutPageSettings(
  payload: Partial<import('@/lib/settings/about').AboutPageSettings>,
): Promise<import('@/lib/settings/about').AboutPageSettings> {
  const res = await fetch('/api/backstage/settings/about', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstagePrestaImportSettings(
  payload: Partial<import('@/lib/settings/presta-import').PrestaImportSettings>,
): Promise<import('@/lib/settings/presta-import').PrestaImportSettings> {
  const res = await fetch('/api/backstage/settings/presta-import', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
