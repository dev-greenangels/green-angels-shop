'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  mapCatalogPhotoToVariantPhoto,
  type CatalogPhotoItem,
  type VariantPhoto,
} from '@/lib/variant-photos/types'

/** Cap in-memory variant photo cache (catalog browsing must not grow forever). */
const MAX_CACHE_ENTRIES = 200
const cache = new Map<string, VariantPhoto[]>()
const inflight = new Map<string, Promise<VariantPhoto[]>>()

function cacheKey(ean: string, sku: string): string {
  return `ean:${ean}|sku:${sku}`
}

function setCached(key: string, photos: VariantPhoto[]) {
  if (cache.has(key)) cache.delete(key)
  cache.set(key, photos)
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

async function fetchPhotosByEan(ean: string): Promise<VariantPhoto[]> {
  const trimmed = ean.trim()
  if (!trimmed) return []

  const res = await fetch(`/api/catalog/photos/by-ean?ean=${encodeURIComponent(trimmed)}`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = (await res.json()) as CatalogPhotoItem[]
  return Array.isArray(data) ? data.map(mapCatalogPhotoToVariantPhoto) : []
}

async function fetchPhotosBySku(sku: string): Promise<VariantPhoto[]> {
  const trimmed = sku.trim()
  if (!trimmed) return []

  const res = await fetch(`/api/catalog/photos/by-sku?sku=${encodeURIComponent(trimmed)}`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = (await res.json()) as CatalogPhotoItem[]
  return Array.isArray(data) ? data.map(mapCatalogPhotoToVariantPhoto) : []
}

function mergePhotos(eanPhotos: VariantPhoto[], skuPhotos: VariantPhoto[]): VariantPhoto[] {
  const byId = new Map<string, VariantPhoto>()
  for (const photo of eanPhotos) byId.set(photo.id, photo)
  for (const photo of skuPhotos) {
    if (!byId.has(photo.id)) byId.set(photo.id, photo)
  }
  return [...byId.values()]
}

async function fetchVariantPhotos(ean: string, sku: string): Promise<VariantPhoto[]> {
  const key = cacheKey(ean, sku)
  if (cache.has(key)) return cache.get(key)!
  if (inflight.has(key)) return inflight.get(key)!

  const promise = Promise.all([
    ean ? fetchPhotosByEan(ean) : Promise.resolve([]),
    sku ? fetchPhotosBySku(sku) : Promise.resolve([]),
  ])
    .then(([eanPhotos, skuPhotos]) => {
      const photos = mergePhotos(eanPhotos, skuPhotos)
      setCached(key, photos)
      return photos
    })
    .catch(() => [])
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

export function useVariantPhotos(
  ean: string | null | undefined,
  sku?: string | null,
): {
  photos: VariantPhoto[]
  loading: boolean
} {
  const eanKey = ean?.trim() || ''
  const skuKey = sku?.trim() || ''
  const key = cacheKey(eanKey, skuKey)
  const hasIdentifier = Boolean(eanKey || skuKey)
  const [photos, setPhotos] = useState<VariantPhoto[]>(() =>
    hasIdentifier && cache.has(key) ? cache.get(key)! : [],
  )
  const [loading, setLoading] = useState(hasIdentifier && !cache.has(key))

  useEffect(() => {
    let cancelled = false
    if (!hasIdentifier) {
      setPhotos([])
      setLoading(false)
      return
    }

    if (cache.has(key)) {
      setPhotos(cache.get(key)!)
      setLoading(false)
      return
    }

    setLoading(true)
    void fetchVariantPhotos(eanKey, skuKey).then((next) => {
      if (!cancelled) {
        setPhotos(next)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [eanKey, skuKey, key, hasIdentifier])

  return useMemo(() => ({ photos, loading }), [photos, loading])
}

export async function fetchPhotosByEans(eans: string[]): Promise<Record<string, VariantPhoto[]>> {
  const unique = [...new Set(eans.map((e) => e.trim()).filter(Boolean))]
  if (unique.length === 0) return {}

  const res = await fetch('/api/catalog/photos/by-eans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eans: unique }),
    cache: 'no-store',
  })
  if (!res.ok) return {}
  const data = (await res.json()) as Record<string, CatalogPhotoItem[]>
  const result: Record<string, VariantPhoto[]> = {}
  for (const ean of unique) {
    const items = Array.isArray(data[ean]) ? data[ean].map(mapCatalogPhotoToVariantPhoto) : []
    setCached(cacheKey(ean, ''), items)
    result[ean] = items
  }
  return result
}
