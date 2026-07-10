'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { LocalizationSettingsForm } from '@/components/backstage/localization-settings-form'
import { Button } from '@/components/ui/button'
import {
  fetchBackstageSettings,
  updateBackstageLocalizationSettings,
} from '@/lib/backstage/settings'
import { DEFAULT_LOCALIZATION_SETTINGS } from '@/lib/settings/defaults'
import { normalizeLocalizationSettings } from '@/lib/settings/localization.normalize'
import type { LocalizationSettings } from '@/lib/settings/types'

export default function LocalizationPage() {
  const tPages = useTranslations('pages.localization')
  const tActions = useTranslations('actions')
  const tCommon = useTranslations('common')
  const tt = useTranslations('toast')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localization, setLocalization] = useState<LocalizationSettings | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBackstageSettings()
      setLocalization(
        normalizeLocalizationSettings(data.localization ?? DEFAULT_LOCALIZATION_SETTINGS),
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('loadSettingsFailed'))
      setLocalization(null)
    } finally {
      setLoading(false)
    }
  }, [tt])

  useEffect(() => {
    void load()
  }, [load])

  const saveLocalization = async () => {
    if (!localization) return
    setSaving(true)
    try {
      const updated = await updateBackstageLocalizationSettings(localization)
      setLocalization(normalizeLocalizationSettings(updated))
      toast.success(tt('localizationSaved'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">{tPages('title')}</h1>
            <p className="mt-1 text-muted-foreground">{tPages('subtitle')}</p>
          </div>
          <Button type="button" variant="outline" className="shrink-0 border-2" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {tActions('refresh')}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {tCommon('loading')}
          </div>
        ) : localization ? (
          <LocalizationSettingsForm
            settings={localization}
            onChange={setLocalization}
            onSave={() => void saveLocalization()}
            saving={saving}
          />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-muted-foreground">{tPages('loadFailed')}</p>
            <Button type="button" variant="outline" className="mt-4 border-2" onClick={() => void load()}>
              {tActions('retry')}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
