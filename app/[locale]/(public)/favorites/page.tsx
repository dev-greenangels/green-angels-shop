import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { FavoritesPageContent } from '@/components/favorites/favorites-page-content'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'
import { UTILITY_PAGE_ROBOTS } from '@/lib/seo/robots-directives'
import { cn } from '@/lib/utils'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'favorites' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  return buildIndexablePageMetadata(locale, '/favorites', {
    title: `${t('pageTitle')} · ${siteName}`,
    description: t('pageDescription', { brand: siteName }),
    siteName,
    robots: UTILITY_PAGE_ROBOTS,
  })
}

export default async function FavoritesPage({ params }: PageProps) {
  const { locale } = await params
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tFavorites = await getTranslations({ locale, namespace: 'favorites' })

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className={cn(siteContentShellClassName, 'py-10 md:py-14')}>
          <PublicPageBreadcrumbs
            className="mb-4"
            items={staticPageBreadcrumbs(tNav('favorites'))}
          />
          <div className="mb-10 max-w-2xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              {tFavorites('pageTitle')}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{tFavorites('pageSubtitle')}</p>
          </div>
          <FavoritesPageContent />
          <RecentlyViewedSection page="favorites" shell={false} className="mt-12" />
        </div>
      </main>
    </>
  )
}
