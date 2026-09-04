import { ArrowRight, Camera, Sprout, Truck } from 'lucide-react'
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

  const heroDesktopSrc = resolveHeroDisplayUrl(settings.imageUrl)
  const heroMobileOnlySrc = resolveHeroDisplayUrl(settings.mobileImageUrl)
  const heroImageSrc = heroDesktopSrc ?? heroMobileOnlySrc
  const hasHeroImage = Boolean(heroImageSrc)
  const useMobilePictureSource = Boolean(
    heroDesktopSrc && heroMobileOnlySrc && heroDesktopSrc !== heroMobileOnlySrc,
  )

  return (
    <section className="w-full py-6 sm:py-8 lg:py-10">
      <div
        className={cn(
          siteContentShellClassName,
          'max-lg:max-w-none max-lg:px-0',
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden',
            hasHeroImage && 'lg:rounded-xl lg:ring-1 lg:ring-border/40',
            hasHeroImage ? heroMinHeight.withImage : heroMinHeight.withoutImage,
          )}
        >
          {heroImageSrc ? (
            <picture className="absolute inset-0 block">
              {useMobilePictureSource && heroMobileOnlySrc ? (
                <source media="(max-width: 639px)" srcSet={heroMobileOnlySrc} />
              ) : null}
              <img
                src={heroImageSrc}
                alt=""
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </picture>
          ) : null}

          {hasHeroImage ? (
            <div
              className="hero-fog-panel pointer-events-none absolute inset-y-0 left-0 z-[1] w-[min(100%,46rem)] lg:rounded-l-xl"
              aria-hidden
            />
          ) : null}

          <div
            className={cn(
              'relative z-10 flex items-center',
              hasHeroImage
                ? cn('px-0 py-4 sm:py-6 lg:p-8', heroMinHeight.withImage)
                : cn('px-0 py-12 sm:py-14 lg:px-0 lg:py-16', heroMinHeight.withoutImage),
            )}
          >
            <div className="w-full max-w-xl px-4 sm:px-6 lg:max-w-[34rem] lg:px-0">
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

              <div className="mt-6 flex flex-wrap items-center gap-2.5 sm:gap-4">
                <Button
                  size="lg"
                  asChild
                  className="h-10 rounded-lg px-5 text-sm font-semibold shadow-md shadow-primary/25 transition-transform hover:-translate-y-0.5 sm:h-12 sm:rounded-xl sm:px-7 sm:text-base"
                >
                  <Link href={settings.primaryCtaHref}>
                    {pickHomeCmsText(
                      settings.primaryCtaLabel,
                      DEFAULT_HOME_SETTINGS.hero.primaryCtaLabel,
                      t('heroPrimaryCta'),
                    )}
                    <ArrowRight className="ml-1.5 h-4 w-4 sm:ml-2 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className={cn(
                    'h-10 rounded-lg px-5 text-sm font-semibold shadow-md transition-transform hover:-translate-y-0.5 sm:h-12 sm:rounded-xl sm:px-7 sm:text-base',
                    hasHeroImage
                      ? 'border-white/40 bg-white/10 text-white shadow-black/20 hover:bg-white/15 hover:text-white'
                      : 'border-foreground/15 bg-white/80 shadow-foreground/10 hover:bg-white',
                  )}
                >
                  <Link href={settings.secondaryCtaHref}>
                    {pickHomeCmsText(
                      settings.secondaryCtaLabel,
                      DEFAULT_HOME_SETTINGS.hero.secondaryCtaLabel,
                      t('heroSecondaryCta'),
                    )}
                    <ArrowRight className="ml-1.5 h-4 w-4 sm:ml-2 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                {wholesaleEnabled ? (
                  <Button
                    size="lg"
                    asChild
                    className={cn(
                      'h-10 rounded-lg border-2 px-5 text-sm font-semibold shadow-md transition-transform hover:-translate-y-0.5 sm:h-12 sm:rounded-xl sm:px-6 sm:text-base',
                      hasHeroImage
                        ? 'border-amber-300 bg-amber-400/25 text-white shadow-amber-500/35 hover:bg-amber-400/40 hover:text-white'
                        : 'border-amber-500 bg-amber-50 text-amber-950 shadow-amber-500/25 hover:bg-amber-100 hover:text-amber-950',
                    )}
                  >
                    <Link href="/wholesale">
                      {t('heroWholesaleCta')}
                      <ArrowRight className="ml-1.5 h-4 w-4 sm:ml-2 sm:h-5 sm:w-5" />
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
