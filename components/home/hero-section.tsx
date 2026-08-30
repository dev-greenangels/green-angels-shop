import { ArrowRight, Camera, Handshake, Sprout, Truck } from 'lucide-react'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import { Button } from '@/components/ui/button'
import { resolveHeroDisplayUrl } from '@/lib/home/hero-image'
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

const heroMinHeight = {
  withImage: 'min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]',
  withoutImage: 'min-h-[460px] sm:min-h-[500px] lg:min-h-[560px]',
} as const

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

  const heroImageSrc = resolveHeroDisplayUrl(settings.imageUrl)
  const hasHeroImage = Boolean(heroImageSrc)

  return (
    <section className="w-full py-6 sm:py-8 lg:py-10">
      <div className={siteContentShellClassName}>
        <div
          className={cn(
            'relative overflow-hidden',
            hasHeroImage && 'rounded-xl ring-1 ring-border/40',
            hasHeroImage ? heroMinHeight.withImage : heroMinHeight.withoutImage,
          )}
        >
          {heroImageSrc ? (
            <Image
              src={heroImageSrc}
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          ) : null}

          {hasHeroImage ? (
            <div
              className="hero-fog-panel pointer-events-none absolute inset-y-0 left-0 z-[1] w-[min(100%,46rem)] rounded-l-xl"
              aria-hidden
            />
          ) : null}

          <div
            className={cn(
              'relative z-10 flex items-center',
              hasHeroImage
                ? cn('p-4 sm:p-6 lg:p-8', heroMinHeight.withImage)
                : cn('py-12 sm:py-14 lg:py-16', heroMinHeight.withoutImage),
            )}
          >
            <div className="w-full max-w-xl lg:max-w-[34rem]">
              <h1
                className={cn(
                  'font-serif text-3xl font-bold leading-[1.15] sm:text-4xl lg:text-[2.35rem]',
                  hasHeroImage ? 'text-white' : 'text-foreground',
                )}
              >
                <span>{title}</span>
                {titleAccent ? (
                  <span
                    className={cn(
                      'mt-1 block text-2xl font-semibold leading-snug sm:text-[1.65rem] lg:text-[1.85rem]',
                      hasHeroImage ? 'text-[#a8e06a]' : 'text-primary',
                    )}
                  >
                    {titleAccent}
                  </span>
                ) : null}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                {highlights.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      hasHeroImage ? 'text-white/90' : 'text-muted-foreground',
                    )}
                  >
                    <Icon
                      className={cn('h-4 w-4', hasHeroImage ? 'text-[#a8e06a]' : 'text-primary')}
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
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
                  className={cn(
                    'h-12 rounded-xl px-7 text-base font-semibold',
                    hasHeroImage
                      ? 'border-white/40 bg-white/10 text-white hover:bg-white/15 hover:text-white'
                      : 'border-foreground/15 bg-white/80 hover:bg-white',
                  )}
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
                    className={cn(
                      'h-12 rounded-xl border border-dashed px-6 text-base font-semibold',
                      hasHeroImage
                        ? 'border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white'
                        : 'border-primary/35 bg-primary/[0.06] text-primary hover:bg-primary/10 hover:text-primary',
                    )}
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
