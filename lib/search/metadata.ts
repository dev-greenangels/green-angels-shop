import type { Metadata } from 'next'

import { buildSearchCanonicalUrl, normalizeSearchQuery } from '@/lib/search/url'

const SITE_NAME = 'Зелені Янголи'

export function buildSearchPageMetadata(query: string, locale: string): Metadata {
  const normalized = normalizeSearchQuery(query)

  if (!normalized) {
    return {
      title: `Пошук · ${SITE_NAME}`,
      description: `Пошук рослин у каталозі розсадника ${SITE_NAME}.`,
      robots: { index: false, follow: true },
    }
  }

  const title = `Результати пошуку «${normalized}» · ${SITE_NAME}`
  const description = `Рослини та саджанці за запитом «${normalized}» в інтернет-магазині ${SITE_NAME}. Перегляньте асортимент розсадника та оберіть потрібні позиції.`
  const canonical = buildSearchCanonicalUrl(normalized, locale)

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: 'uk_UA',
      siteName: SITE_NAME,
    },
  }
}
