'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import {
  useBackstageContentLocale,
} from '@/components/backstage/backstage-content-locale'
import { TranslationLocaleLabel } from '@/components/backstage/content-locale-banner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'
import { cn } from '@/lib/utils'

/** In-memory multi-locale string editor (Settings CMS — no Prisma translation API). */
export function CmsLocaleFieldsDialog({
  open,
  onOpenChange,
  fieldLabel,
  values,
  sourceLocale,
  multiline = false,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldLabel: string
  values: Partial<Record<AppLocale, string>>
  /** Locale whose value is copied when using «fill all». */
  sourceLocale: AppLocale
  multiline?: boolean
  onSave: (next: Partial<Record<AppLocale, string>>) => void
}) {
  const tActions = useTranslations('actions')
  const tDialog = useTranslations('translationDialog')
  const tBanner = useTranslations('contentBanner')
  const [draft, setDraft] = useState<Partial<Record<AppLocale, string>>>({})

  useEffect(() => {
    if (!open) return
    const next: Partial<Record<AppLocale, string>> = {}
    for (const locale of SUPPORTED_LOCALES) {
      next[locale] = values[locale] ?? ''
    }
    setDraft(next)
  }, [open, values])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tDialog('title')}</DialogTitle>
          <DialogDescription>{tDialog('description', { field: fieldLabel })}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto pr-1">
          {SUPPORTED_LOCALES.map((locale) => (
            <div key={locale} className="space-y-1.5">
              <TranslationLocaleLabel locale={locale} htmlFor={`cms-translation-${locale}`} />
              {multiline ? (
                <Textarea
                  id={`cms-translation-${locale}`}
                  value={draft[locale] ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [locale]: e.target.value }))
                  }
                  rows={3}
                  placeholder={tBanner('missingPlaceholder')}
                />
              ) : (
                <Input
                  id={`cms-translation-${locale}`}
                  value={draft[locale] ?? ''}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [locale]: e.target.value }))
                  }
                  placeholder={tBanner('missingPlaceholder')}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              const fill = (draft[sourceLocale] ?? values[sourceLocale] ?? '').trim()
                ? (draft[sourceLocale] ?? values[sourceLocale] ?? '')
                : (SUPPORTED_LOCALES.map((l) => draft[l] ?? '').find((v) => v.trim()) ?? '')
              const next: Partial<Record<AppLocale, string>> = {}
              for (const locale of SUPPORTED_LOCALES) {
                next[locale] = fill
              }
              setDraft(next)
            }}
          >
            {tDialog('fillAllFromCurrent')}
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tActions('cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSave(draft)
                onOpenChange(false)
              }}
            >
              {tActions('save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CmsLocaleFieldLabel({
  htmlFor,
  children,
  fieldLabel,
  values,
  multiline = false,
  onSaveTranslations,
}: {
  htmlFor?: string
  children: ReactNode
  fieldLabel?: string
  values: Partial<Record<AppLocale, string>>
  multiline?: boolean
  onSaveTranslations: (next: Partial<Record<AppLocale, string>>) => void
}) {
  const { locale, ready } = useBackstageContentLocale()
  const tDialog = useTranslations('translationDialog')
  const [open, setOpen] = useState(false)
  const label =
    fieldLabel ?? (typeof children === 'string' ? children : tDialog('fieldFallback'))

  return (
    <>
      <Label htmlFor={htmlFor} className="flex flex-wrap items-center gap-2">
        <span>{children}</span>
        {ready ? (
          <button
            type="button"
            className={cn(
              'shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
              'transition-colors hover:border-primary/40 hover:bg-muted/60 hover:text-foreground',
            )}
            title={tDialog('openHint')}
            aria-label={tDialog('openHint')}
            onClick={() => setOpen(true)}
          >
            {locale}
          </button>
        ) : null}
      </Label>
      <CmsLocaleFieldsDialog
        open={open}
        onOpenChange={setOpen}
        fieldLabel={label}
        values={values}
        sourceLocale={locale}
        multiline={multiline}
        onSave={onSaveTranslations}
      />
    </>
  )
}
