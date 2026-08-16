'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { NextIntlClientProvider, useTranslations } from 'next-intl'

import { fetchBackstageSettings } from '@/lib/backstage/settings'
import { buildBackstageMessages } from '@/lib/i18n/load-backstage-messages'
import {
  BACKSTAGE_UI_LOCALE_STORAGE_KEY,
  BACKSTAGE_UI_LOCALES,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  isBackstageUiLocale,
  type AppLocale,
  type BackstageUiLocale,
  type LocalizationMessageOverrides,
} from '@/lib/i18n/locales'
import { normalizeLocalizationSettings } from '@/lib/settings/localization.normalize'
import { DEFAULT_LOCALIZATION_SETTINGS } from '@/lib/settings/defaults'
import { cn } from '@/lib/utils'

type BackstageUiLocaleContextValue = {
  locale: BackstageUiLocale
  setLocale: (locale: BackstageUiLocale) => void
}

const BackstageUiLocaleContext = createContext<BackstageUiLocaleContextValue>({
  locale: 'uk',
  setLocale: () => {},
})

export function useBackstageUiLocale() {
  return useContext(BackstageUiLocaleContext)
}

export function BackstageUiLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<BackstageUiLocale>('uk')
  const [overrides, setOverrides] = useState<LocalizationMessageOverrides | undefined>()

  useEffect(() => {
    const stored = localStorage.getItem(BACKSTAGE_UI_LOCALE_STORAGE_KEY)
    if (stored && isBackstageUiLocale(stored)) {
      setLocaleState(stored)
    } else if (stored) {
      // Drop unsupported UI locales (hu/de/cs) → Ukrainian
      localStorage.setItem(BACKSTAGE_UI_LOCALE_STORAGE_KEY, 'uk')
      setLocaleState('uk')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetchBackstageSettings()
      .then((data) => {
        if (cancelled) return
        setOverrides(
          normalizeLocalizationSettings(data.localization ?? DEFAULT_LOCALIZATION_SETTINGS)
            .messageOverrides,
        )
      })
      .catch(() => {
        if (!cancelled) setOverrides(undefined)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setLocale = useCallback((next: BackstageUiLocale) => {
    setLocaleState(next)
    localStorage.setItem(BACKSTAGE_UI_LOCALE_STORAGE_KEY, next)
  }, [])

  const messages = useMemo(
    () => buildBackstageMessages(locale as AppLocale, overrides),
    [locale, overrides],
  )

  return (
    <BackstageUiLocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Kyiv">
        {children}
      </NextIntlClientProvider>
    </BackstageUiLocaleContext.Provider>
  )
}

export function BackstageUiLocaleSwitcher({
  className,
  variant = 'header',
}: {
  className?: string
  variant?: 'header' | 'sidebar'
}) {
  const { locale, setLocale } = useBackstageUiLocale()
  const t = useTranslations('common')
  const isSidebar = variant === 'sidebar'

  return (
    <div
      className={cn(
        isSidebar ? 'flex flex-wrap items-center gap-1' : 'flex items-center gap-1',
        className,
      )}
      role="group"
      aria-label={t('uiLocaleAria')}
    >
      {BACKSTAGE_UI_LOCALES.map((item) => {
        const active = item === locale
        return (
          <button
            key={item}
            type="button"
            onClick={() => setLocale(item)}
            className={cn(
              'inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors',
              isSidebar
                ? active
                  ? 'border-sidebar-primary bg-sidebar-primary/20 text-sidebar-primary-foreground'
                  : 'border-sidebar-border text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                : active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-pressed={active}
            title={LOCALE_LABELS[item]}
          >
            <span className="text-sm leading-none" aria-hidden>
              {LOCALE_FLAGS[item]}
            </span>
            <span>{item.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
