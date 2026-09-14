'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import {
  useBackstageContentLocale,
  useContentLocaleSwitchSave,
} from '@/components/backstage/backstage-content-locale'
import { HomePageSettingsForm } from '@/components/backstage/home-page-settings-form'
import {
  fetchBackstageSettings,
  updateBackstageHomeSettings,
} from '@/lib/backstage/settings'
import {
  applyHomeCmsCopy,
  commitHomeCmsForLocale,
  getHomeCmsCopyForEdit,
} from '@/lib/settings/home-cms'
import { normalizeHomeSettings } from '@/lib/settings/home.normalize'
import { DEFAULT_MARKET_SETTINGS } from '@/lib/settings/defaults'
import { normalizeMarketSettings } from '@/lib/settings/market'
import type { HomePageSettings, MarketSettings } from '@/lib/settings/types'
import type { AppLocale } from '@/lib/i18n/locales'

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

export default function HomePageSettingsPanel() {
  const t = useTranslations('pages.home')
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [home, setHome] = useState<HomePageSettings | null>(null)
  const [market, setMarket] = useState<MarketSettings | null>(null)
  const [baselineHome, setBaselineHome] = useState<string | null>(null)
  const [activeLocale, setActiveLocale] = useState<AppLocale | null>(null)

  const region = market?.region ?? 'ua'

  const homeDirty = useMemo(
    () => Boolean(home && baselineHome && stableJson(home) !== baselineHome),
    [home, baselineHome],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBackstageSettings()
      const nextMarket = normalizeMarketSettings(data.market ?? DEFAULT_MARKET_SETTINGS)
      const nextHome = normalizeHomeSettings(data.home, nextMarket.region)
      setMarket(nextMarket)
      setHome(nextHome)
      setBaselineHome(stableJson(nextHome))
      setActiveLocale(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
      setHome(null)
      setMarket(null)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!home || !contentLocaleReady) return
    if (activeLocale === contentLocale) return
    const copy = getHomeCmsCopyForEdit(home, contentLocale, region)
    const next = applyHomeCmsCopy(home, copy)
    setHome(next)
    setBaselineHome(stableJson(next))
    setActiveLocale(contentLocale)
  }, [contentLocale, contentLocaleReady, home, activeLocale, region])

  const saveHome = async () => {
    if (!home) return
    setSaving(true)
    try {
      const payload = commitHomeCmsForLocale(home, contentLocale)
      const updated = normalizeHomeSettings(
        await updateBackstageHomeSettings(payload),
        region,
      )
      const forEdit = applyHomeCmsCopy(
        updated,
        getHomeCmsCopyForEdit(updated, contentLocale, region),
      )
      setHome(forEdit)
      setBaselineHome(stableJson(forEdit))
      setActiveLocale(contentLocale)
      toast.success(t('saveSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'))
      throw err
    } finally {
      setSaving(false)
    }
  }

  useContentLocaleSwitchSave(() => saveHome(), { when: () => homeDirty })

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
        ) : home && contentLocaleReady ? (
          <HomePageSettingsForm
            settings={home}
            contentLocale={contentLocale}
            marketRegion={region}
            onChange={(next) => setHome(commitHomeCmsForLocale(next, contentLocale))}
            onSave={() => void saveHome()}
            saving={saving}
            isDirty={homeDirty}
          />
        ) : null}
      </div>
    </AdminLayout>
  )
}
