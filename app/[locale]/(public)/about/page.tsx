import type { Metadata } from 'next'
import { CheckCircle2, Truck } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AboutCmsHtml } from '@/components/about/about-cms-html'
import { AboutImage, AboutVideoEmbed } from '@/components/about/about-media'
import { AboutStatsSection } from '@/components/about/about-stats-section'
import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { fetchCatalogRootSlug, resolveCatalogHref } from '@/lib/catalog/paths'
import { buildAboutMetadata } from '@/lib/about/metadata'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import {
  fetchPublicSiteSettings,
  getResolvedAboutPageSettings,
} from '@/lib/settings/fetch'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildAboutMetadata(locale)
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations('nav')
  const tAbout = await getTranslations('aboutPage')
  const fetched = await fetchPublicSiteSettings()
  const page = getResolvedAboutPageSettings(fetched, locale)
  const catalogRootSlug = await fetchCatalogRootSlug(locale)
  const catalogHref = resolveCatalogHref(catalogRootSlug)

  const foundersImageClass = 'aspect-[4/3] rounded-2xl shadow-md ring-1 ring-border/40'

  if (!page) {
    return (
      <>
        <Navigation />
        <main className="flex-1 bg-transparent">
          <div className="bg-secondary/30 py-8 md:py-12">
            <div className={siteContentShellClassName}>
              <PublicPageBreadcrumbs
                className="mb-4"
                items={staticPageBreadcrumbs(tNav('about'))}
              />
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-5xl">
                {tAbout('unavailableTitle')}
              </h1>
            </div>
          </div>
          <div className={cn(siteContentShellClassName, 'py-12')}>
            <p className="max-w-2xl text-lg text-muted-foreground">{tAbout('unavailableBody')}</p>
            <div className="mt-8">
              <Button asChild>
                <Link href="/contacts">{tNav('contacts')}</Link>
              </Button>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tNav('about'))}
            />
            {page.hero.enabled && page.hero.title ? (
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-5xl">
                {page.hero.title}
              </h1>
            ) : (
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-5xl">
                {tNav('about')}
              </h1>
            )}
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'space-y-20 py-12 md:space-y-24 md:py-16')}>
          {page.intro.enabled && (page.intro.body.trim() || page.intro.imageUrl.trim()) ? (
            <section
              className={
                page.intro.imageUrl.trim()
                  ? 'grid items-center gap-10 lg:grid-cols-2 lg:gap-14'
                  : 'mx-auto max-w-5xl'
              }
            >
              <AboutCmsHtml html={page.intro.body} />
              {page.intro.imageUrl.trim() ? (
                <AboutImage
                  src={page.intro.imageUrl}
                  alt={page.intro.imageAlt || page.hero.title}
                  className={foundersImageClass}
                  priority
                />
              ) : null}
            </section>
          ) : null}

          {page.stats.enabled &&
          (page.stats.items.length > 0 || page.stats.theses.length > 0) ? (
            <AboutStatsSection
              title={page.stats.title}
              subtitle={page.stats.subtitle}
              stats={page.stats.items}
              theses={page.stats.theses}
            />
          ) : null}

          {page.whyUs.enabled &&
          (page.whyUs.title || page.whyUs.body || page.whyUs.benefits.length > 0) ? (
            <section className="mx-auto max-w-5xl">
              {page.whyUs.title ? (
                <h2 className="mb-4 font-serif text-2xl font-semibold text-foreground md:text-3xl">
                  {page.whyUs.title}
                </h2>
              ) : null}
              <AboutCmsHtml html={page.whyUs.body} />
              {page.whyUs.benefits.length > 0 ? (
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {page.whyUs.benefits.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm text-foreground/90">{item}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              {page.cta.enabled ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={catalogHref}>
                      {page.cta.primaryLabel || tNav('catalog')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contacts">
                      {page.cta.secondaryLabel || tNav('contacts')}
                    </Link>
                  </Button>
                </div>
              ) : null}
            </section>
          ) : page.cta.enabled ? (
            <section className="mx-auto max-w-5xl">
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={catalogHref}>{page.cta.primaryLabel || tNav('catalog')}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contacts">{page.cta.secondaryLabel || tNav('contacts')}</Link>
                </Button>
              </div>
            </section>
          ) : null}

          {page.markets.enabled && (page.markets.title.trim() || page.markets.body.trim()) ? (
            <section className="mx-auto max-w-5xl">
              {page.markets.title ? (
                <h2 className="mb-4 font-serif text-2xl font-semibold text-foreground md:text-3xl">
                  {page.markets.title}
                </h2>
              ) : null}
              <AboutCmsHtml html={page.markets.body} />
            </section>
          ) : null}

          {page.production.enabled && page.production.cards.length > 0 ? (
            <section>
              {page.production.title ? (
                <h2 className="mb-8 text-center font-serif text-2xl font-semibold text-foreground md:text-3xl">
                  {page.production.title}
                </h2>
              ) : null}
              <div className="grid gap-8">
                {page.production.cards.map((line, index) => (
                  <Card
                    key={`${line.title}-${index}`}
                    className="overflow-hidden border-border/60 py-0 shadow-sm"
                  >
                    <CardContent className="flex flex-col items-center gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                      <AboutImage
                        src={line.imageUrl}
                        alt={line.imageAlt || line.title}
                        className={cn(
                          'size-32 shrink-0 rounded-full sm:size-36 md:size-44',
                          index % 2 === 1 && 'sm:order-2',
                        )}
                      />
                      <div
                        className={cn(
                          'min-w-0 flex-1 space-y-3 text-center sm:text-left',
                          index % 2 === 1 && 'sm:order-1',
                        )}
                      >
                        <h3 className="font-serif text-xl font-semibold text-foreground md:text-2xl">
                          {line.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                          {line.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {page.video.enabled && page.video.embedUrl ? (
            <section className="mx-auto max-w-5xl">
              <div className="mb-8 text-center">
                {page.video.title ? (
                  <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
                    {page.video.title}
                  </h2>
                ) : null}
                {page.video.subtitle ? (
                  <p className="mt-2 text-muted-foreground">{page.video.subtitle}</p>
                ) : null}
              </div>
              <AboutVideoEmbed
                src={page.video.embedUrl}
                title={page.video.title || page.hero.title}
              />
            </section>
          ) : null}

          {page.delivery.enabled &&
          (page.delivery.title || page.delivery.body || page.delivery.cities.length > 0) ? (
            <section className="overflow-hidden rounded-2xl border border-border/60 bg-secondary/20">
              <div className="grid md:grid-cols-2">
                <AboutImage
                  src={page.delivery.imageUrl}
                  alt={page.delivery.imageAlt || page.delivery.title}
                  className="min-h-[260px] rounded-none md:min-h-full"
                />
                <div className="flex flex-col justify-center gap-5 p-8 md:p-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-7 w-7 text-primary" />
                  </div>
                  <div className="space-y-4">
                    {page.delivery.title ? (
                      <h2 className="font-serif text-2xl font-semibold text-foreground">
                        {page.delivery.title}
                      </h2>
                    ) : null}
                    <AboutCmsHtml
                      html={page.delivery.body}
                      className="space-y-4 text-base [&_p]:text-base"
                    />
                    {page.delivery.cities.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {page.delivery.cities.join(', ')}
                      </p>
                    ) : null}
                  </div>
                  <Button variant="outline" asChild className="w-fit">
                    <Link href="/shipping">
                      {page.delivery.ctaLabel || tNav('shipping')}
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  )
}
