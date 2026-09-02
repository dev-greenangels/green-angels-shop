import { Suspense } from 'react'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

function FooterFallback() {
  // Без aria-hidden — атрибути мають збігатися з реальним <Footer>, інакше hydration mismatch.
  return <footer className="bg-footer-gradient text-primary-foreground" />
}

import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/robots-directives'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account')
  return {
    title: t('title'),
    robots: PRIVATE_PAGE_ROBOTS,
  }
}

export default function AccountSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Suspense fallback={<FooterFallback />}>
        <Footer />
      </Suspense>
    </div>
  )
}
