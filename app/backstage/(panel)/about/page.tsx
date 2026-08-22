'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { AboutPageSettingsForm } from '@/components/backstage/about-page-settings-form'
import {
  fetchBackstageSettings,
  updateBackstageAboutPageSettings,
} from '@/lib/backstage/settings'
import { normalizeAboutPageSettings } from '@/lib/settings/about.normalize'
import { DEFAULT_MARKET_SETTINGS } from '@/lib/settings/defaults'
import { normalizeMarketSettings } from '@/lib/settings/market'
import type { AboutPageSettings, MarketSettings } from '@/lib/settings/types'

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

export default function AboutPageSettingsPanel() {
  const t = useTranslations('pages.about')
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [about, setAbout] = useState<AboutPageSettings | null>(null)
  const [market, setMarket] = useState<MarketSettings | null>(null)
  const [baselineAbout, setBaselineAbout] = useState<string | null>(null)

  const aboutDirty = useMemo(
    () => Boolean(about && baselineAbout && stableJson(about) !== baselineAbout),
    [about, baselineAbout],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBackstageSettings()
      const nextMarket = normalizeMarketSettings(data.market ?? DEFAULT_MARKET_SETTINGS)
      const nextAbout = normalizeAboutPageSettings(data.about, nextMarket.region)
      setMarket(nextMarket)
      setAbout(nextAbout)
      setBaselineAbout(stableJson(nextAbout))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
      setAbout(null)
      setMarket(null)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const saveAbout = async () => {
    if (!about) return
    setSaving(true)
    try {
      const updated = await updateBackstageAboutPageSettings(about)
      const next = normalizeAboutPageSettings(updated, market?.region ?? 'ua')
      setAbout(next)
      setBaselineAbout(stableJson(next))
      toast.success(t('saveSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
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
        ) : about && contentLocaleReady ? (
          <AboutPageSettingsForm
            settings={about}
            contentLocale={contentLocale}
            onChange={setAbout}
            onSave={() => void saveAbout()}
            saving={saving}
            isDirty={aboutDirty}
            marketRegion={market?.region ?? 'ua'}
          />
        ) : null}
      </div>
    </AdminLayout>
  )
}
