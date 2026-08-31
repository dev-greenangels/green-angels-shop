'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
import {
  fetchTranslationField,
  patchTranslationField,
  type TranslationFieldTarget,
} from '@/lib/backstage/translation-fields'
import { TranslationLocaleLabel } from '@/components/backstage/content-locale-banner'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales'

export function TranslationFieldsDialog({
  open,
  onOpenChange,
  target,
  fieldLabel,
  multiline = false,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: TranslationFieldTarget | null
  fieldLabel: string
  multiline?: boolean
  onSaved?: () => void
}) {
  const tActions = useTranslations('actions')
  const tDialog = useTranslations('translationDialog')
  const tBanner = useTranslations('contentBanner')
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !target) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchTranslationField(target)
      .then((translations) => {
        if (cancelled) return
        setValues(translations)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : tDialog('loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, target, tDialog])

  const handleSave = async () => {
    if (!target) return
    setSaving(true)
    setError(null)
    try {
      await patchTranslationField(target, values)
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : tDialog('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tDialog('title')}</DialogTitle>
          <DialogDescription>{tDialog('description', { field: fieldLabel })}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {tDialog('loading')}
          </div>
        ) : (
          <div className="max-h-[min(60vh,28rem)] space-y-3 overflow-y-auto pr-1">
            {SUPPORTED_LOCALES.map((locale) => (
              <div key={locale} className="space-y-1.5">
                <TranslationLocaleLabel locale={locale} htmlFor={`translation-${locale}`} />
                {multiline ? (
                  <Textarea
                    id={`translation-${locale}`}
                    value={values[locale] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [locale]: e.target.value }))
                    }
                    rows={3}
                    placeholder={tBanner('missingPlaceholder')}
                  />
                ) : (
                  <Input
                    id={`translation-${locale}`}
                    value={values[locale] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [locale]: e.target.value }))
                    }
                    placeholder={tBanner('missingPlaceholder')}
                  />
                )}
              </div>
            ))}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tActions('cancel')}
          </Button>
          <Button type="button" disabled={loading || saving || !target} onClick={() => void handleSave()}>
            {saving ? tActions('saving') : tActions('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
