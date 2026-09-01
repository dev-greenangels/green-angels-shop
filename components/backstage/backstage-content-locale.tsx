'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import {
  BACKSTAGE_CONTENT_LOCALE_STORAGE_KEY,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type AppLocale,
} from '@/lib/i18n/locales'
import { cn } from '@/lib/utils'

type LocaleSwitchHandler = () => void | Promise<void>

type BackstageContentLocaleContextValue = {
  locale: AppLocale
  /** False until localStorage locale is applied. Wait before catalog fetches. */
  ready: boolean
  switching: boolean
  setLocale: (locale: AppLocale) => Promise<void>
  registerLocaleSwitchHandler: (id: string, handler: LocaleSwitchHandler) => void
  unregisterLocaleSwitchHandler: (id: string) => void
}

const BackstageContentLocaleContext = createContext<BackstageContentLocaleContextValue>({
  locale: 'uk',
  ready: false,
  switching: false,
  setLocale: async () => {},
  registerLocaleSwitchHandler: () => {},
  unregisterLocaleSwitchHandler: () => {},
})

export function BackstageContentLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('uk')
  const [ready, setReady] = useState(false)
  const [switching, setSwitching] = useState(false)
  const handlersRef = useRef(new Map<string, LocaleSwitchHandler>())
  const tBanner = useTranslations('contentBanner')

  useEffect(() => {
    const stored = localStorage.getItem(BACKSTAGE_CONTENT_LOCALE_STORAGE_KEY)
    if (stored && isSupportedLocale(stored)) {
      setLocaleState(stored)
    }
    setReady(true)
  }, [])

  const registerLocaleSwitchHandler = useCallback((id: string, handler: LocaleSwitchHandler) => {
    handlersRef.current.set(id, handler)
  }, [])

  const unregisterLocaleSwitchHandler = useCallback((id: string) => {
    handlersRef.current.delete(id)
  }, [])

  const setLocale = useCallback(
    async (next: AppLocale) => {
      if (next === locale || switching) return

      setSwitching(true)
      try {
        for (const handler of handlersRef.current.values()) {
          await handler()
        }
        setLocaleState(next)
        localStorage.setItem(BACKSTAGE_CONTENT_LOCALE_STORAGE_KEY, next)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : tBanner('switchSaveFailed'))
      } finally {
        setSwitching(false)
      }
    },
    [locale, switching, tBanner],
  )

  return (
    <BackstageContentLocaleContext.Provider
      value={{
        locale,
        ready,
        switching,
        setLocale,
        registerLocaleSwitchHandler,
        unregisterLocaleSwitchHandler,
      }}
    >
      {children}
    </BackstageContentLocaleContext.Provider>
  )
}

export function useBackstageContentLocale() {
  return useContext(BackstageContentLocaleContext)
}

/** Auto-save current page before global content-locale switch (when `when` is true). */
export function useContentLocaleSwitchSave(
  save: () => void | Promise<void>,
  options?: { when?: () => boolean },
) {
  const { registerLocaleSwitchHandler, unregisterLocaleSwitchHandler } = useBackstageContentLocale()
  const saveRef = useRef(save)
  const whenRef = useRef(options?.when)

  saveRef.current = save
  whenRef.current = options?.when

  useEffect(() => {
    const id = crypto.randomUUID()
    registerLocaleSwitchHandler(id, async () => {
      if (whenRef.current && !whenRef.current()) return
      await saveRef.current()
    })
    return () => unregisterLocaleSwitchHandler(id)
  }, [registerLocaleSwitchHandler, unregisterLocaleSwitchHandler])
}

export function BackstageContentLocaleSwitcher({ className }: { className?: string }) {
  const { locale, ready, switching, setLocale } = useBackstageContentLocale()
  const t = useTranslations('common')

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="group"
      aria-label={t('contentLocaleAria')}
    >
      <span className="hidden text-xs text-muted-foreground sm:inline">{t('contentLocale')}</span>
      {switching ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
      ) : null}
      {SUPPORTED_LOCALES.map((item) => {
        const active = ready && item === locale
        return (
          <button
            key={item}
            type="button"
            disabled={!ready || switching}
            onClick={() => {
              if (item === locale) return
              void setLocale(item)
            }}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              switching && 'pointer-events-none opacity-60',
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
