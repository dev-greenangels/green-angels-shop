'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  AccountPageEmpty,
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { ProductCard } from '@/components/product-card'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { LISTING_PRODUCT_GRID_CLASS_NAME } from '@/lib/catalog/grid-columns'
import { mapListItemToPlant } from '@/lib/catalog/map-product'
import type { CatalogProductListItem } from '@/lib/catalog/types'
import { useFavoriteActions, useFavoriteIds } from '@/lib/favorites-store'
import { Link } from '@/i18n/navigation'

const FAVORITES_GRID_CLASS_NAME = LISTING_PRODUCT_GRID_CLASS_NAME

function parseCatalogProductsPayload(data: unknown): CatalogProductListItem[] {
  if (Array.isArray(data)) return data as CatalogProductListItem[]
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: CatalogProductListItem[] }).items
  }
  return []
}

export function FavoritesPageContent() {
  const catalogHref = useCatalogHref()
  const t = useTranslations('favorites')
  const tc = useTranslations('common')
  const { user } = useSession()
  const productIds = useFavoriteIds()
  const { pruneToExisting } = useFavoriteActions()
  const [plants, setPlants] = useState<CatalogProductListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const idsKey = useMemo(() => productIds.join(','), [productIds])

  useEffect(() => {
    if (!productIds.length) {
      setPlants([])
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetch(`/api/catalog/products?ids=${encodeURIComponent(idsKey)}`, {
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(t('loadError'))
        }
        return parseCatalogProductsPayload(await res.json())
      })
      .then(async (rows) => {
        if (cancelled) return
        const existingIds = rows.map((row) => row.id)
        // Missing / unpublished → drop from favorites (badge + storage). Keep OOS rows.
        await pruneToExisting(existingIds, user?.id)
        if (cancelled) return
        const order = new Map(productIds.map((id, index) => [id, index]))
        const sorted = [...rows].sort(
          (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
        )
        setPlants(sorted)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setPlants([])
        setError(err instanceof Error ? err.message : t('loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [idsKey, productIds, pruneToExisting, reloadToken, t, user?.id])

  if (!productIds.length) {
    return (
      <AccountPageEmpty
        icon={Heart}
        title={t('emptyTitle')}
        body={t('emptyBody')}
        action={
          <Button asChild>
            <Link href={catalogHref}>{tc('goToCatalog')}</Link>
          </Button>
        }
      />
    )
  }

  if (loading) {
    return <AccountPageLoading />
  }

  if (error) {
    return (
      <AccountPageError
        message={error}
        onRetry={() => setReloadToken((n) => n + 1)}
      />
    )
  }

  if (!plants.length) {
    // After prune, productIds should also be empty — keep safe empty state (not "unavailable").
    return (
      <AccountPageEmpty
        icon={Heart}
        title={t('emptyTitle')}
        body={t('emptyBody')}
        action={
          <Button asChild>
            <Link href={catalogHref}>{tc('goToCatalog')}</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className={FAVORITES_GRID_CLASS_NAME}>
      {plants.map((item) => (
        <ProductCard key={item.id} plant={mapListItemToPlant(item)} layout="grid" />
      ))}
    </div>
  )
}
