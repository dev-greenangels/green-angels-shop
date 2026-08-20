import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { JsonLdScript } from '@/components/seo/json-ld-script'
import { WholesaleInquiryForm } from '@/components/wholesale/wholesale-inquiry-form'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { isAppLocale } from '@/i18n/routing'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { localePath } from '@/lib/locale-path'
import { resolvePublicOriginFromRequest } from '@/lib/seo/request-context'
import { buildWholesaleMetadata } from '@/lib/wholesale/metadata'
import {
  fetchPublicSiteSettings,
  getMarketSettings,
  getResolvedWholesalePageSettings,
} from '@/lib/settings/fetch'
import { cn } from '@/lib/utils'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildWholesaleMetadata(locale)
}

export default async function WholesalePage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations('nav')
  const fetched = await fetchPublicSiteSettings()
  const page = getResolvedWholesalePageSettings(fetched, locale)
  if (!page.pageEnabled) notFound()
  const market = getMarketSettings(fetched)
  const origin = await resolvePublicOriginFromRequest()
  const appLocale = isAppLocale(locale) ? locale : 'uk'
  const canonical = `${origin.replace(/\/$/, '')}${localePath('/wholesale', appLocale)}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: page.seoTitle || page.title,
    description: page.seoDescription || page.intro,
    url: canonical,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Green Angels',
      url: origin,
    },
  }

  return (
    <>
      <Navigation />
      <JsonLdScript data={jsonLd} />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tNav('wholesale'))}
            />
            <h1 className="max-w-3xl font-serif text-3xl font-bold text-foreground md:text-4xl">
              {page.title}
            </h1>
            {page.intro ? (
              <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{page.intro}</p>
            ) : null}
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
            <article className="space-y-5 text-lg leading-relaxed text-muted-foreground">
              {page.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
              <WholesaleInquiryForm
                region={market.region}
                phonePolicy={market.authPhonePolicy}
                formTitle={page.formTitle}
                formIntro={page.formIntro}
                consentText={market.authConsentText}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
