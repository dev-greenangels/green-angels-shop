import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { FavoritesPageContent } from '@/components/favorites/favorites-page-content'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Обране · Зелені Янголи',
  description: 'Ваш список обраних рослин у розсаднику Зелені Янголи.',
}

export default async function FavoritesPage() {
  const tNav = await getTranslations('nav')

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
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">Обране</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Рослини, які ви зберегли для подальшого перегляду або замовлення.
            </p>
          </div>
          <FavoritesPageContent />
          <RecentlyViewedSection page="favorites" shell={false} className="mt-12" />
        </div>
      </main>
    </>
  )
}
