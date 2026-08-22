'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { HomePageSettingsForm } from '@/components/backstage/home-page-settings-form'
import {
  fetchBackstageSettings,
  updateBackstageHomeSettings,
} from '@/lib/backstage/settings'
import { normalizeHomeSettings } from '@/lib/settings/home.normalize'
import type { HomePageSettings } from '@/lib/settings/types'

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

export default function HomePageSettingsPanel() {
  const t = useTranslations('pages.home')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [home, setHome] = useState<HomePageSettings | null>(null)
  const [baselineHome, setBaselineHome] = useState<string | null>(null)

  const homeDirty = useMemo(
    () => Boolean(home && baselineHome && stableJson(home) !== baselineHome),
    [home, baselineHome],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBackstageSettings()
      const nextHome = normalizeHomeSettings(data.home)
      setHome(nextHome)
      setBaselineHome(stableJson(nextHome))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
      setHome(null)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const saveHome = async () => {
    if (!home) return
    setSaving(true)
    try {
      const updated = await updateBackstageHomeSettings(home)
      setHome(updated)
      setBaselineHome(stableJson(updated))
      toast.success(t('saveSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading')}
          </div>
        ) : home ? (
          <HomePageSettingsForm
            settings={home}
            onChange={setHome}
            onSave={() => void saveHome()}
            saving={saving}
            isDirty={homeDirty}
          />
        ) : null}
      </div>
    </AdminLayout>
  )
}
