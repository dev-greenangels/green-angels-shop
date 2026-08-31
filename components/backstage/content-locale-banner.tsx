'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { TranslationFieldsDialog } from '@/components/backstage/translation-fields-dialog'
import { LOCALE_FLAGS, LOCALE_LABELS, isSupportedLocale, type AppLocale } from '@/lib/i18n/locales'
import type { TranslationFieldTarget } from '@/lib/backstage/translation-fields'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function TranslationLocaleLabel({
  locale,
  htmlFor,
}: {
  locale: AppLocale
  htmlFor?: string
}) {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-normal text-muted-foreground">
      <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
      <span>{LOCALE_LABELS[locale]}</span>
      <span className="rounded border border-border px-1 py-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {locale}
      </span>
    </Label>
  )
}

export function ContentLocaleBanner({ hint }: { hint?: string }) {
  const { locale, ready } = useBackstageContentLocale()
  const t = useTranslations('contentBanner')

  if (!ready) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
      <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
      <span>{hint ?? t('editing', { locale: LOCALE_LABELS[locale] })}</span>
    </div>
  )
}

export function LocaleTranslationButton({
  translationTarget,
  translationFieldLabel,
  multiline = false,
  onTranslationsSaved,
}: {
  translationTarget: TranslationFieldTarget
  translationFieldLabel: string
  multiline?: boolean
  onTranslationsSaved?: () => void
}) {
  const { locale, ready } = useBackstageContentLocale()
  const tDialog = useTranslations('translationDialog')
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!ready) return null

  return (
    <>
      <button
        type="button"
        className={cn(
          'shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
          'transition-colors hover:border-primary/40 hover:bg-muted/60 hover:text-foreground',
        )}
        title={tDialog('openHint')}
        aria-label={tDialog('openHint')}
        onClick={() => setDialogOpen(true)}
      >
        {locale}
      </button>
      <TranslationFieldsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        target={dialogOpen ? translationTarget : null}
        fieldLabel={translationFieldLabel}
        multiline={multiline}
        onSaved={onTranslationsSaved}
      />
    </>
  )
}

export function ContentLocaleLabel({
  htmlFor,
  children,
  translationTarget,
  translationFieldLabel,
  multiline = false,
  onTranslationsSaved,
}: {
  htmlFor?: string
  children: ReactNode
  translationTarget?: TranslationFieldTarget
  translationFieldLabel?: string
  multiline?: boolean
  onTranslationsSaved?: () => void
}) {
  const { locale, ready } = useBackstageContentLocale()
  const tDialog = useTranslations('translationDialog')
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Label htmlFor={htmlFor} className="flex flex-wrap items-center gap-2">
        <span>{children}</span>
        {ready ? (
          translationTarget ? (
            <LocaleTranslationButton
              translationTarget={translationTarget}
              translationFieldLabel={
                translationFieldLabel ??
                (typeof children === 'string' ? children : tDialog('fieldFallback'))
              }
              multiline={multiline}
              onTranslationsSaved={onTranslationsSaved}
            />
          ) : (
            <span className="rounded border border-border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {locale}
            </span>
          )
        ) : null}
      </Label>
    </>
  )
}

export function TranslationHint({
  hint,
}: {
  hint?: { locale: string; text: string } | null
}) {
  const t = useTranslations('contentBanner')
  const { locale: currentLocale } = useBackstageContentLocale()
  const text = hint?.text.trim()
  const hintLocale = hint?.locale
  if (!text || !hintLocale || hintLocale === currentLocale) return null

  const localeLabel = isSupportedLocale(hintLocale)
    ? LOCALE_LABELS[hintLocale]
    : hintLocale.toUpperCase()
  const flag = isSupportedLocale(hintLocale) ? LOCALE_FLAGS[hintLocale] : ''

  return (
    <p className="text-xs text-muted-foreground">
      <span className="mr-1 font-medium text-foreground/80">
        {flag} {t('hintFrom', { locale: localeLabel })}
      </span>
      <span className="line-clamp-3 whitespace-pre-wrap break-words">{text}</span>
    </p>
  )
}
