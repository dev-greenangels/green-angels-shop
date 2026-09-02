import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/robots-directives'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth')
  return {
    title: t('loginTitle'),
    robots: PRIVATE_PAGE_ROBOTS,
  }
}

export default function AuthSectionLayout({ children }: { children: React.ReactNode }) {
  return children
}
