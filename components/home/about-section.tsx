import { CheckCircle2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { HomeSectionHeader } from '@/components/home/home-section-header'
import { pickHomeCmsList, pickHomeCmsStats, pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import type { HomePageSettings } from '@/lib/settings/types'

type AboutSectionProps = {
  settings: HomePageSettings['whyUs']
}

export async function AboutSection({ settings }: AboutSectionProps) {
  const t = await getTranslations('home')
  const title = pickHomeCmsText(settings.title, DEFAULT_HOME_SETTINGS.whyUs.title, t('aboutTitle'))
  const subtitle = pickHomeCmsText(
    settings.subtitle,
    DEFAULT_HOME_SETTINGS.whyUs.subtitle,
    t('aboutSubtitle'),
  )
  const features = pickHomeCmsList(settings.features, DEFAULT_HOME_SETTINGS.whyUs.features, [
    t('whyUsFeature1'),
    t('whyUsFeature2'),
    t('whyUsFeature3'),
    t('whyUsFeature4'),
    t('whyUsFeature5'),
    t('whyUsFeature6'),
  ])
  const stats = pickHomeCmsStats(settings.stats, DEFAULT_HOME_SETTINGS.whyUs.stats, [
    t('whyUsStat1'),
    t('whyUsStat2'),
    t('whyUsStat3'),
    t('whyUsStat4'),
  ])

  return (
    <section className="relative overflow-hidden border-y border-border/30 py-12 md:py-16">
      <div className={siteContentShellClassName}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-7">
            <HomeSectionHeader
              eyebrow={t('aboutEyebrow')}
              title={title}
              subtitle={subtitle}
              align="left"
              className="mb-0"
            />

            <div className="grid gap-3.5 sm:grid-cols-2">
              {features.map((feature) => (
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
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border/50 bg-card p-6 text-center shadow-sm transition-transform hover:-translate-y-0.5 md:p-8"
              >
                <p className="mb-2 font-serif text-4xl font-bold text-primary md:text-5xl">
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
