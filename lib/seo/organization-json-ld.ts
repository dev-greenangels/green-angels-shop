import { DEFAULT_STORE_SETTINGS } from '@/lib/settings/defaults'
import type { StoreContactSettings } from '@/lib/settings/types'
import { formatStoreAddress, getStorePhones } from '@/lib/settings/store-helpers'

export function shouldEmitStoreAddress(
  store: StoreContactSettings,
  marketRegion: string,
): boolean {
  const address = formatStoreAddress(store)
  if (!address) return false
  const defaultAddress = formatStoreAddress(DEFAULT_STORE_SETTINGS)
  if (marketRegion !== 'ua' && address === defaultAddress) return false
  return true
}

export function buildWebsiteJsonLd(input: {
  origin: string
  name: string
  locale: string
}): Record<string, unknown> | null {
  const origin = input.origin.replace(/\/$/, '')
  if (!origin || !input.name.trim()) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name.trim(),
    url: origin,
    inLanguage: input.locale,
  }
}

export function buildOrganizationJsonLd(input: {
  origin: string
  name: string
  store: StoreContactSettings
  marketRegion: string
  storeUnavailable: boolean
}): Record<string, unknown> | null {
  const origin = input.origin.replace(/\/$/, '')
  const name = input.name.trim()
  if (!origin || !name || input.storeUnavailable) return null

  const sameAs = Object.values(input.store.social ?? {})
    .filter((link) => link?.show && link.url?.trim())
    .map((link) => link.url.trim())

  const telephone = getStorePhones(input.store)[0]?.phone?.trim() || undefined
  const defaultPhone = DEFAULT_STORE_SETTINGS.phones[0]?.phone
  const safePhone =
    input.marketRegion !== 'ua' && telephone === defaultPhone ? undefined : telephone

  const emitAddress = shouldEmitStoreAddress(input.store, input.marketRegion)
  const addressLine1 = input.store.addressLine1.trim()
  const addressLine2 = input.store.addressLine2.trim()

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': emitAddress ? ['Organization', 'LocalBusiness'] : 'Organization',
    name,
    url: origin,
    ...(sameAs.length ? { sameAs } : {}),
    ...(safePhone ? { telephone: safePhone } : {}),
  }

  if (emitAddress) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: [addressLine1, addressLine2].filter(Boolean).join(', '),
    }
  }

  return schema
}
