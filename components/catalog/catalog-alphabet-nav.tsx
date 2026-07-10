'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import {
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

type CatalogAlphabetNavProps = {
  activeLetter: string | null
  onLetterChange: (letter: string | null) => void
  /** Без власного sticky-обгортки — для вбудовування в батьківський липкий блок */
  embedded?: boolean
}

export function CatalogAlphabetNav({
  activeLetter,
  onLetterChange,
  embedded = false,
}: CatalogAlphabetNavProps) {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const [letters, setLetters] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/catalog/alphabet-letters?locale=${encodeURIComponent(locale)}`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => {
        if (cancelled) return
        setLetters(Array.isArray(data) ? data.filter((item) => typeof item === 'string') : [])
      })
      .catch(() => {
        if (!cancelled) setLetters([])
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  if (!letters.length) return null

  const letterRow = (
    <div className="flex w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onLetterChange(null)}
        className={cn(
          'inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-2.5 text-sm font-medium transition-colors',
          !activeLetter
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-foreground hover:bg-muted',
        )}
      >
        {t('alphabetAll')}
      </button>
      {letters.map((letter) => {
        const isActive = activeLetter === letter
        return (
          <button
            key={letter}
            type="button"
            onClick={() => onLetterChange(letter)}
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm font-semibold transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:bg-muted',
            )}
            aria-current={isActive ? 'true' : undefined}
          >
            {letter}
          </button>
        )
      })}
    </div>
  )

  if (embedded) {
    return letterRow
  }

  return (
    <div className={siteStickyToolbarOuterClassName}>
      <div className={siteStickyToolbarInnerClassName}>
        {letterRow}
      </div>
    </div>
  )
}
