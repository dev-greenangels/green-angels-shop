'use client'

import { Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  RECENTLY_VIEWED_PAGE_KEYS,
  RECENTLY_VIEWED_PAGE_LABELS,
  type RecentlyViewedPageKey,
  type RecentlyViewedSettings,
} from '@/lib/settings/recently-viewed'

export function RecentlyViewedSettingsForm({
  settings,
  onChange,
  onSave,
  saving,
}: {
  settings: RecentlyViewedSettings
  onChange: (next: RecentlyViewedSettings) => void
  onSave: () => void
  saving: boolean
}) {
  const setPage = (page: RecentlyViewedPageKey, enabled: boolean) => {
    onChange({
      ...settings,
      pages: { ...settings.pages, [page]: enabled },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Останні переглянуті</CardTitle>
        <CardDescription>
          Горизонтальна смуга товарів, які відвідувач нещодавно переглядав. Список зберігається в
          браузері клієнта.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="recently-viewed-enabled">Увімкнути блок</Label>
            <p className="text-sm text-muted-foreground">
              Якщо вимкнено, блок не показується на жодній сторінці.
            </p>
          </div>
          <Switch
            id="recently-viewed-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="recently-viewed-title">Заголовок блоку</Label>
            <Input
              id="recently-viewed-title"
              value={settings.title}
              onChange={(event) => onChange({ ...settings, title: event.target.value })}
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recently-viewed-max">Максимум товарів</Label>
            <Input
              id="recently-viewed-max"
              type="number"
              min={4}
              max={50}
              value={settings.maxItems}
              onChange={(event) =>
                onChange({
                  ...settings,
                  maxItems: Number(event.target.value) || settings.maxItems,
                })
              }
            />
            <p className="text-sm text-muted-foreground">Від 4 до 50. Зберігається в браузері користувача.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Сторінки показу</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Оберіть, на яких сторінках показувати блок «Останні переглянуті».
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {RECENTLY_VIEWED_PAGE_KEYS.map((page) => (
              <div
                key={page}
                className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <Label htmlFor={`recently-viewed-page-${page}`} className="font-normal">
                  {RECENTLY_VIEWED_PAGE_LABELS[page]}
                </Label>
                <Switch
                  id={`recently-viewed-page-${page}`}
                  checked={settings.pages[page]}
                  onCheckedChange={(checked) => setPage(page, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        <Button type="button" onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Збереження…' : 'Зберегти'}
        </Button>
      </CardContent>
    </Card>
  )
}
