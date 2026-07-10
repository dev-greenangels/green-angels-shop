'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { LISTING_PRODUCT_GRID_CLASS_NAME } from '@/lib/catalog/grid-columns'
import { mapListItemToPlant } from '@/lib/catalog/map-product'
import type { CatalogProductListItem } from '@/lib/catalog/types'
import { useFavoriteIds } from '@/lib/favorites-store'
import { Link } from '@/i18n/navigation'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'

const FAVORITES_GRID_CLASS_NAME = LISTING_PRODUCT_GRID_CLASS_NAME

export function FavoritesPageContent() {
  const catalogHref = useCatalogHref()
  const t = useTranslations('favorites')
  const tc = useTranslations('common')
  const productIds = useFavoriteIds()
  const [plants, setPlants] = useState<CatalogProductListItem[]>([])
  const [loading, setLoading] = useState(false)

  const idsKey = useMemo(() => productIds.join(','), [productIds])

  useEffect(() => {
    if (!productIds.length) {
      setPlants([])
      return
    }

    let cancelled = false
    setLoading(true)

    void fetch(`/api/catalog/products?ids=${encodeURIComponent(idsKey)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return []
        const data = (await res.json()) as CatalogProductListItem[]
        return Array.isArray(data) ? data : []
      })
      .then((rows) => {
        if (cancelled) return
        const order = new Map(productIds.map((id, index) => [id, index]))
        const sorted = [...rows].sort(
          (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
        )
        setPlants(sorted)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [idsKey, productIds])

  if (!productIds.length) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <Heart className="mx-auto mb-4 h-10 w-10 text-muted-foreground/50" />
        <p className="text-lg font-medium text-foreground">{t('emptyTitle')}</p>
        <p className="mt-2 text-muted-foreground">{t('emptyBody')}</p>
        <Button asChild className="mt-6">
          <Link href={catalogHref}>{tc('goToCatalog')}</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>
  }

  if (!plants.length) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        {t('unavailable')}
      </div>
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
