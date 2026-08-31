'use client'

import { useTranslations } from 'next-intl'

import { siteContentShellClassName } from '@/lib/layout/site-shell'

type CatalogCategoryFooterProps = {
  content: string
}

const catalogDescriptionCardClassName =
  'w-full rounded-2xl border border-primary/15 bg-[rgba(232,240,227,0.68)] px-5 py-5 shadow-sm backdrop-blur-[2px] sm:px-7 sm:py-6 md:px-8 md:py-7'

export function CatalogCategoryFooter({ content }: CatalogCategoryFooterProps) {
  const t = useTranslations('catalog')
  const text = content.trim()
  if (!text) return null

  const paragraphs = text.split(/\n{2,}/).filter((part) => part.trim())

  return (
    <section className="border-t border-border/70 bg-transparent py-10 md:py-12">
      <div className={siteContentShellClassName}>
        <div className={catalogDescriptionCardClassName}>
          <h2 className="mb-4 font-serif text-xl font-semibold leading-snug text-foreground md:mb-5 md:text-2xl">
            {t('categoryFooterHeading')}
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-foreground/85 md:text-[1.0625rem] md:leading-7">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
