import { cache } from 'react'

import { fetchBackendHttp } from '@/lib/api/backend-http'
import { DEFAULT_COMMERCE_SETTINGS } from '@/lib/commerce/defaults'
import type { PublicCommerceSettings } from '@/lib/commerce/types'

async function fetchCommerceSettingsUncached(locale = 'uk'): Promise<PublicCommerceSettings> {
  try {
    const res = await fetchBackendHttp(`/commerce/public?locale=${encodeURIComponent(locale)}`, {
      cache: 'no-store',
    })
    if (!res.ok) throw new Error('Failed to load commerce settings')
    return (await res.json()) as PublicCommerceSettings
  } catch {
    return DEFAULT_COMMERCE_SETTINGS
  }
}

export const fetchCommerceSettings = cache(fetchCommerceSettingsUncached)
