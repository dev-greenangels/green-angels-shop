import { getLocale, getTranslations } from 'next-intl/server'

import { HomeProductRowSection } from '@/components/home/home-product-row-section'
import { fetchLowStockProducts, type HomeProductsResult } from '@/lib/catalog/home-products'
import { pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
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
  const t = await getTranslations('home')
  const { plants, unavailable } =
    initialProducts ?? (await fetchLowStockProducts(settings, locale))

  return (
    <HomeProductRowSection
      title={pickHomeCmsText(
        settings.title,
        DEFAULT_HOME_SETTINGS.lowStock.title,
        t('lowStockTitle'),
      )}
      subtitle={pickHomeCmsText(
        settings.subtitle,
        DEFAULT_HOME_SETTINGS.lowStock.subtitle,
        t('lowStockSubtitle'),
      )}
      plants={plants}
      unavailable={unavailable}
      className="border-y border-border/30"
    />
  )
}
