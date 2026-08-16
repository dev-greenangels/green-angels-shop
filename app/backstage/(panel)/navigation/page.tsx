'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { NavigationSettingsForm } from '@/components/backstage/navigation-settings-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { fetchBackstageSettings } from '@/lib/backstage/settings'
import { updateBackstageNavigationSettings } from '@/lib/backstage/navigation'
import { normalizeNavigationSettings } from '@/lib/settings/navigation.normalize'
import type { NavigationSettings } from '@/lib/settings/types'

export default function NavigationPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [navigation, setNavigation] = useState<NavigationSettings | null>(null)
  const [baseline, setBaseline] = useState<string | null>(null)
  const isDirty = useMemo(
    () => Boolean(navigation && baseline && JSON.stringify(navigation) !== baseline),
    [navigation, baseline],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBackstageSettings()
      const next = normalizeNavigationSettings(data.navigation)
      setNavigation(next)
      setBaseline(JSON.stringify(next))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити меню.')
      setNavigation(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (!navigation) return
    setSaving(true)
    try {
      const updated = await updateBackstageNavigationSettings(navigation)
      const next = normalizeNavigationSettings(updated)
      setNavigation(next)
      setBaseline(JSON.stringify(next))
      toast.success('Меню збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  if (!navigation) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">Не вдалося завантажити меню.</p>
            <Button type="button" variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Спробувати знову
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Меню сайту</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Пункти головної навігації на публічному сайті
          </p>
        </div>
        <NavigationSettingsForm
          navigation={navigation}
          onChange={setNavigation}
          onSave={() => void save()}
          saving={saving}
          isDirty={isDirty}
        />
      </div>
    </AdminLayout>
  )
}
