import { getLocale, getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { CookiePreferencesManager } from '@/components/legal/cookie-preferences-manager'
import { LegalPageLinks } from '@/components/legal/legal-page-links'
import { LegalPageSections, type LegalPageSection } from '@/components/legal/legal-page-sections'
import { LegalTemplateNotice } from '@/components/legal/legal-template-notice'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

export default async function CookiesPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const t = await getTranslations('cookiesPage')
  const sections = t.raw('sections') as LegalPageSection[]

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs className="mb-4" items={staticPageBreadcrumbs(tNav('cookies'))} />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{t('title')}</h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="max-w-3xl mx-auto space-y-6">
            <LegalTemplateNotice />
            <LegalPageLinks current="cookies" />

            <div className="prose prose-green">
              <p className="text-muted-foreground text-lg">{t('intro')}</p>
              <LegalPageSections sections={sections} />
            </div>

            <CookiePreferencesManager locale={locale} />
          </div>
        </div>
      </main>
    </>
  )
}
