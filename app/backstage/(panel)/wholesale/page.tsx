'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { WholesalePageSettingsForm } from '@/components/backstage/wholesale-page-settings-form'
import {
  fetchBackstageSettings,
  updateBackstageWholesalePageSettings,
} from '@/lib/backstage/settings'
import { DEFAULT_MARKET_SETTINGS } from '@/lib/settings/defaults'
import { normalizeMarketSettings } from '@/lib/settings/market'
import { normalizeWholesalePageSettings } from '@/lib/settings/wholesale.normalize'
import type { MarketSettings, WholesalePageSettings } from '@/lib/settings/types'

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

export default function WholesalePageSettingsPanel() {
  const t = useTranslations('pages.wholesale')
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [wholesale, setWholesale] = useState<WholesalePageSettings | null>(null)
  const [market, setMarket] = useState<MarketSettings | null>(null)
  const [baselineWholesale, setBaselineWholesale] = useState<string | null>(null)

  const wholesaleDirty = useMemo(
    () =>
      Boolean(wholesale && baselineWholesale && stableJson(wholesale) !== baselineWholesale),
    [wholesale, baselineWholesale],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBackstageSettings()
      const nextMarket = normalizeMarketSettings(data.market ?? DEFAULT_MARKET_SETTINGS)
      const nextWholesale = normalizeWholesalePageSettings(data.wholesale, nextMarket.region)
      setMarket(nextMarket)
      setWholesale(nextWholesale)
      setBaselineWholesale(stableJson(nextWholesale))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
      setWholesale(null)
      setMarket(null)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const saveWholesale = async () => {
    if (!wholesale) return
    setSaving(true)
    try {
      const updated = await updateBackstageWholesalePageSettings(wholesale)
      const next = normalizeWholesalePageSettings(updated, market?.region ?? 'ua')
      setWholesale(next)
      setBaselineWholesale(stableJson(next))
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
        ) : wholesale && contentLocaleReady ? (
          <WholesalePageSettingsForm
            settings={wholesale}
            contentLocale={contentLocale}
            onChange={setWholesale}
            onSave={() => void saveWholesale()}
            saving={saving}
            isDirty={wholesaleDirty}
            marketRegion={market?.region ?? 'ua'}
          />
        ) : null}
      </div>
    </AdminLayout>
  )
}
