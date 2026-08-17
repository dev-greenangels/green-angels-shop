'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useTranslations } from 'next-intl'

import {
  BACKSTAGE_CONTENT_LOCALE_STORAGE_KEY,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type AppLocale,
} from '@/lib/i18n/locales'
import { cn } from '@/lib/utils'

type BackstageContentLocaleContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

const BackstageContentLocaleContext = createContext<BackstageContentLocaleContextValue>({
  locale: 'uk',
  setLocale: () => {},
})

export function BackstageContentLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('uk')

  useEffect(() => {
    const stored = localStorage.getItem(BACKSTAGE_CONTENT_LOCALE_STORAGE_KEY)
    if (stored && isSupportedLocale(stored)) {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next)
    localStorage.setItem(BACKSTAGE_CONTENT_LOCALE_STORAGE_KEY, next)
  }, [])

  return (
    <BackstageContentLocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </BackstageContentLocaleContext.Provider>
  )
}

export function useBackstageContentLocale() {
  return useContext(BackstageContentLocaleContext)
}

export function BackstageContentLocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useBackstageContentLocale()
  const t = useTranslations('common')
  const tBanner = useTranslations('contentBanner')

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="group"
      aria-label={t('contentLocaleAria')}
    >
      <span className="hidden text-xs text-muted-foreground sm:inline">{t('contentLocale')}</span>
      {SUPPORTED_LOCALES.map((item) => {
        const active = item === locale
        return (
          <button
            key={item}
            type="button"
            onClick={() => {
              if (item === locale) return
              if (typeof window !== 'undefined' && !window.confirm(tBanner('switchConfirm'))) {
                return
              }
              setLocale(item)
            }}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-pressed={active}
            title={LOCALE_LABELS[item]}
          >
            <span aria-hidden>{LOCALE_FLAGS[item]}</span>
            <span>{item.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
