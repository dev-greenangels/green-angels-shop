import { getLocale } from 'next-intl/server'

import { HomeProductRowSection } from '@/components/home/home-product-row-section'
import { fetchLowStockProducts, type HomeProductsResult } from '@/lib/catalog/home-products'
import type { HomePageSettings } from '@/lib/settings/types'

type LowStockSectionProps = {
  settings: HomePageSettings['lowStock']
  initialProducts?: HomeProductsResult
}

export async function LowStockSection({
  settings,
  initialProducts,
}: LowStockSectionProps) {
  const locale = await getLocale()
  const { plants, unavailable } =
    initialProducts ?? (await fetchLowStockProducts(settings, locale))

  return (
    <HomeProductRowSection
      title={settings.title}
      subtitle={settings.subtitle}
      plants={plants}
      unavailable={unavailable}
      className="border-y border-border/50 bg-gradient-to-b from-background via-muted/20 to-background"
    />
  )
}
