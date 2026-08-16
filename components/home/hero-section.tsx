import { ArrowRight, Camera, Sprout, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import type { HomePageSettings } from '@/lib/settings/types'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

type HeroSectionProps = {
  settings: HomePageSettings['hero']
}

const HERO_HIGHLIGHTS = [
  { icon: Camera, label: 'Актуальні фото' },
  { icon: Sprout, label: 'Власний розсадник' },
  { icon: Truck, label: 'Доставка по Україні' },
] as const

export function HeroSection({ settings }: HeroSectionProps) {
  return (
    <section className="relative min-h-[460px] w-full overflow-hidden sm:min-h-[500px] lg:min-h-[560px]">
      <div className={cn(siteContentShellClassName, 'relative z-10')}>
        <div className="flex min-h-[460px] items-center py-12 sm:min-h-[500px] sm:py-14 lg:min-h-[560px] lg:py-16">
          <div className="relative w-full max-w-xl lg:max-w-[34rem]">
            <div className="relative px-1 py-1 sm:px-2">
              <h1 className="font-serif text-4xl font-medium leading-[1.12] text-foreground sm:text-5xl lg:text-[3.1rem]">
                <span className="lg:whitespace-nowrap">{settings.title}</span>
                {settings.titleAccent ? (
                  <>
                    <br />
                    <span className="font-medium text-primary">{settings.titleAccent}</span>
                  </>
                ) : null}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                {HERO_HIGHLIGHTS.map(({ icon: Icon, label }) => (
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
                    {settings.primaryCtaLabel}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="h-12 rounded-xl border-foreground/15 bg-white/80 px-7 text-base font-semibold hover:bg-white"
                >
                  <Link href={settings.secondaryCtaHref}>{settings.secondaryCtaLabel}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
