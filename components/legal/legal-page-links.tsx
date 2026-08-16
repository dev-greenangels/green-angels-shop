import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

type LegalPageKey = 'terms' | 'privacy' | 'cookies'

const PAGES: { key: LegalPageKey; href: '/terms' | '/privacy' | '/cookies' }[] = [
  { key: 'terms', href: '/terms' },
  { key: 'privacy', href: '/privacy' },
  { key: 'cookies', href: '/cookies' },
]

/** Перехресні посилання між правовими сторінками — показуються на /terms, /privacy, /cookies. */
export function LegalPageLinks({ current }: { current: LegalPageKey }) {
  const t = useTranslations('legalPages')

  return (
    <nav aria-label={t('crossLinksLabel')} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="text-muted-foreground">{t('crossLinksLabel')}</span>
      {PAGES.map((page, index) => (
        <span key={page.key} className="flex items-center gap-2">
          {index > 0 ? <span className="text-muted-foreground/50">·</span> : null}
          {page.key === current ? (
            <span className="font-medium text-foreground">{t(`${page.key}Link`)}</span>
          ) : (
            <Link
              href={page.href}
              className={cn('text-primary underline-offset-4 hover:underline')}
            >
              {t(`${page.key}Link`)}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
