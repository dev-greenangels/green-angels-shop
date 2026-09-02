import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { MarketingUnsubscribeClient } from '@/components/legal/marketing-unsubscribe-client'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/robots-directives'
import { cn } from '@/lib/utils'

type PageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketingConsent')
  return {
    title: t('unsubscribeTitle'),
    robots: PRIVATE_PAGE_ROBOTS,
  }
}

export default async function MarketingUnsubscribePage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('marketingConsent')

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <Suspense
          fallback={
            <div className={cn(siteContentShellClassName, 'py-16 text-center text-muted-foreground')}>
              {t('unsubscribeLoading')}
            </div>
          }
        >
          <MarketingUnsubscribeClient />
        </Suspense>
      </main>
    </>
  )
}
