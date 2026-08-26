import { ArrowRight, Camera, Handshake, Sprout, Truck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { resolveHeroDeliveryCountryCode } from '@/lib/home/hero-delivery-label'
import { pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import type { CountrySiteCode } from '@/lib/country-sites/types'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import type { MarketSettings } from '@/lib/settings/market'
import type { HomePageSettings } from '@/lib/settings/types'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

type HeroSectionProps = {
  settings: HomePageSettings['hero']
  market: MarketSettings
  hostCountryCode?: CountrySiteCode | null
  wholesaleEnabled?: boolean
}

export async function HeroSection({
  settings,
  market,
  hostCountryCode = null,
  wholesaleEnabled = false,
}: HeroSectionProps) {
  const t = await getTranslations('home')
  const tCheckout = await getTranslations('checkout')
  const title = pickHomeCmsText(settings.title, DEFAULT_HOME_SETTINGS.hero.title, t('heroTitle'))
  const titleAccent = pickHomeCmsText(
    settings.titleAccent,
    DEFAULT_HOME_SETTINGS.hero.titleAccent,
    t('heroTitleAccent'),
  )

  const deliveryCountryCode = resolveHeroDeliveryCountryCode(market, hostCountryCode)
  const deliveryLabel =
    market.region === 'ua'
      ? t('heroHighlightDeliveryUa')
      : t('heroHighlightDeliveryTo', {
          country: tCheckout(`deliveryCountries.${deliveryCountryCode}`),
        })

  const highlights = [
    { icon: Camera, label: t('heroHighlightPhotos') },
    { icon: Sprout, label: t('heroHighlightNursery') },
    { icon: Truck, label: deliveryLabel },
  ] as const

  return (
    <section className="relative min-h-[460px] w-full overflow-hidden sm:min-h-[500px] lg:min-h-[560px]">
      <div className={cn(siteContentShellClassName, 'relative z-10')}>
        <div className="flex min-h-[460px] items-center py-12 sm:min-h-[500px] sm:py-14 lg:min-h-[560px] lg:py-16">
          <div className="relative w-full max-w-xl lg:max-w-[34rem]">
            <div className="relative px-1 py-1 sm:px-2">
              <h1 className="font-serif text-4xl font-medium leading-[1.12] text-foreground sm:text-5xl lg:text-[3.1rem]">
                <span className="lg:whitespace-nowrap">{title}</span>
                {titleAccent ? (
                  <>
                    <br />
                    <span className="font-medium text-primary">{titleAccent}</span>
                  </>
                ) : null}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                {highlights.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-primary" strokeWidth={2} aria-hidden />
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
                <Button
                  size="lg"
                  asChild
                  className="h-12 rounded-xl px-7 text-base font-semibold shadow-md shadow-primary/25 transition-transform hover:-translate-y-0.5"
                >
                  <Link href={settings.primaryCtaHref}>
                    {pickHomeCmsText(
                      settings.primaryCtaLabel,
                      DEFAULT_HOME_SETTINGS.hero.primaryCtaLabel,
                      t('heroPrimaryCta'),
                    )}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-12 rounded-xl border-foreground/15 bg-white/80 px-7 text-base font-semibold hover:bg-white"
                >
                  <Link href={settings.secondaryCtaHref}>
                    {pickHomeCmsText(
                      settings.secondaryCtaLabel,
                      DEFAULT_HOME_SETTINGS.hero.secondaryCtaLabel,
                      t('heroSecondaryCta'),
                    )}
                  </Link>
                </Button>
                {wholesaleEnabled ? (
                  <Button
                    variant="ghost"
                    size="lg"
                    asChild
                    className="h-12 rounded-xl border border-dashed border-primary/35 bg-primary/[0.06] px-6 text-base font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <Link href="/wholesale">
                      <Handshake className="mr-2 h-5 w-5" />
                      {t('heroWholesaleCta')}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
