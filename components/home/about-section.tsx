import { CheckCircle2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { HomeSectionHeader } from '@/components/home/home-section-header'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import type { HomePageSettings } from '@/lib/settings/types'

type AboutSectionProps = {
  settings: HomePageSettings['whyUs']
}

export async function AboutSection({ settings }: AboutSectionProps) {
  const t = await getTranslations('home')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/[0.07] via-muted/50 to-background py-16 md:py-24">
      <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className={siteContentShellClassName}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <HomeSectionHeader
              eyebrow={t('aboutEyebrow')}
              title={settings.title}
              subtitle={settings.subtitle}
              align="left"
              className="mb-0"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {settings.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/70 px-4 py-3 shadow-sm backdrop-blur-sm"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {settings.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/40 bg-card p-6 text-center shadow-lg shadow-primary/5 transition-transform hover:-translate-y-0.5 md:p-7"
              >
                <p className="mb-2 font-serif text-4xl font-bold text-primary md:text-5xl">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
