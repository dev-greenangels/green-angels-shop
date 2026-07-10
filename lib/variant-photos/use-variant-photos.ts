'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  mapCatalogPhotoToVariantPhoto,
  type CatalogPhotoItem,
  type VariantPhoto,
} from '@/lib/variant-photos/types'

const cache = new Map<string, VariantPhoto[]>()
const inflight = new Map<string, Promise<VariantPhoto[]>>()

async function fetchPhotosByEan(ean: string): Promise<VariantPhoto[]> {
  const trimmed = ean.trim()
  if (!trimmed) return []
  if (cache.has(trimmed)) return cache.get(trimmed)!
  if (inflight.has(trimmed)) return inflight.get(trimmed)!

  const promise = fetch(`/api/catalog/photos/by-ean?ean=${encodeURIComponent(trimmed)}`, {
    cache: 'no-store',
  })
    .then(async (res) => {
      if (!res.ok) return []
      const data = (await res.json()) as CatalogPhotoItem[]
      const photos = Array.isArray(data) ? data.map(mapCatalogPhotoToVariantPhoto) : []
      cache.set(trimmed, photos)
      return photos
    })
    .catch(() => [])
    .finally(() => {
      inflight.delete(trimmed)
    })

  inflight.set(trimmed, promise)
  return promise
}

export function useVariantPhotos(ean: string | null | undefined): {
  photos: VariantPhoto[]
  loading: boolean
} {
  const key = ean?.trim() || ''
  const [photos, setPhotos] = useState<VariantPhoto[]>(() => (key && cache.has(key) ? cache.get(key)! : []))
  const [loading, setLoading] = useState(Boolean(key) && !cache.has(key))

  useEffect(() => {
    let cancelled = false
    if (!key) {
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
    void fetchPhotosByEan(key).then((next) => {
      if (!cancelled) {
        setPhotos(next)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [key])

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
    cache.set(ean, items)
    result[ean] = items
  }
  return result
}
