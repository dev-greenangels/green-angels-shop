import Image from 'next/image'
import { ArrowRight, Flower2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HERO_PROMO_BADGES } from '@/lib/home/hero-promo-badges'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import type { HomePageSettings } from '@/lib/settings/types'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const PLACEHOLDER_IMAGE = '/images/category-placeholder.svg'

type HeroSectionProps = {
  settings: HomePageSettings['hero']
}

function HeroPromoBadge({
  label,
  href,
  icon: Icon,
}: (typeof HERO_PROMO_BADGES)[number]) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-white/60 bg-white/95 px-4 py-3 shadow-md shadow-black/10',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white hover:shadow-lg hover:shadow-black/15',
        'active:translate-y-0 active:scale-[0.98]',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary transition-colors group-hover:border-primary/35 group-hover:bg-primary/10">
        <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="text-sm font-semibold leading-snug text-foreground">{label}</span>
      <ArrowRight
        className="ml-auto h-4 w-4 shrink-0 text-primary/70 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
        aria-hidden
      />
    </Link>
  )
}

export function HeroSection({ settings }: HeroSectionProps) {
  const imageSrc = settings.imageUrl?.trim() || PLACEHOLDER_IMAGE

  return (
    <section className="bg-gradient-to-b from-muted/40 to-background py-6 md:py-8">
      <div className={siteContentShellClassName}>
        <div className="relative min-h-[min(88vw,520px)] overflow-hidden rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] sm:min-h-[480px] sm:rounded-3xl lg:min-h-[500px]">
          <div className="absolute inset-0">
            <Image
              src={imageSrc}
              alt={settings.title}
              fill
              priority
              className="object-cover object-[center_42%]"
              sizes="(max-width: 1024px) 100vw, 1152px"
            />
          </div>

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, #ffffff 0%, #ffffff 22%, rgba(255,255,255,0.96) 32%, rgba(255,255,255,0.72) 44%, rgba(255,255,255,0.2) 58%, transparent 72%)',
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white/20 sm:hidden"
            aria-hidden
          />

          <div className="relative z-10 flex h-full min-h-[inherit] flex-col lg:flex-row">
            <div className="flex flex-1 flex-col justify-center px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-10 lg:max-w-[46%] lg:px-10 lg:py-12 xl:px-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-muted/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Flower2 className="h-3.5 w-3.5 text-primary" aria-hidden />
                {settings.badge}
              </div>

              <h1 className="mt-5 font-serif text-3xl font-bold leading-[1.12] text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]">
                {settings.title}
                {settings.titleAccent ? (
                  <>
                    <br />
                    <span className="text-foreground/90">{settings.titleAccent}</span>
                  </>
                ) : null}
              </h1>

              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-[17px]">
                {settings.subtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4 sm:gap-5">
                <Button
                  size="lg"
                  asChild
                  className="h-12 rounded-xl px-7 text-base font-semibold shadow-md shadow-primary/20 transition-transform hover:-translate-y-0.5"
                >
                  <Link href={settings.primaryCtaHref}>
                    {settings.primaryCtaLabel}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Link
                  href={settings.secondaryCtaHref}
                  className="text-base font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {settings.secondaryCtaLabel}
                </Link>
              </div>
            </div>

            <div className="relative mt-auto flex flex-1 items-end justify-end px-4 pb-5 sm:px-6 sm:pb-6 lg:mt-0 lg:items-center lg:px-8 lg:pb-0 xl:pr-10">
              <div className="flex w-full max-w-xs flex-col gap-2.5 sm:max-w-sm sm:gap-3">
                {HERO_PROMO_BADGES.map((badge) => (
                  <HeroPromoBadge key={badge.label} {...badge} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
