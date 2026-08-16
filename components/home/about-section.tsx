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
    <section className="relative overflow-hidden border-y border-border/30 py-12 md:py-16">
      <div className={siteContentShellClassName}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-7">
            <HomeSectionHeader
              eyebrow={t('aboutEyebrow')}
              title={settings.title}
              subtitle={settings.subtitle}
              align="left"
              className="mb-0"
            />

            <div className="grid gap-3.5 sm:grid-cols-2">
              {settings.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-medium leading-snug text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {settings.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/50 bg-card p-6 text-center shadow-sm transition-transform hover:-translate-y-0.5 md:p-8"
              >
                <p className="mb-2 font-serif text-4xl font-medium text-primary md:text-5xl">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-muted-foreground md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
