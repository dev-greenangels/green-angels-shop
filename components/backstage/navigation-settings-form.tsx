'use client'

import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { NavigationMenuItem, NavigationSettings } from '@/lib/settings/types'

const ICON_OPTIONS = [
  'Home',
  'LayoutGrid',
  'List',
  'Percent',
  'Sparkles',
  'Camera',
  'BookOpen',
  'Star',
  'Heart',
  'Info',
]

type NavigationSettingsFormProps = {
  navigation: NavigationSettings
  onChange: (next: NavigationSettings) => void
  onSave: () => void
  saving?: boolean
}

function createEmptyItem(sortOrder: number): NavigationMenuItem {
  return {
    id: `custom-${Date.now()}`,
    labels: { uk: 'Новий пункт' },
    href: '/',
    icon: 'Info',
    visible: true,
    sortOrder,
  }
}

export function NavigationSettingsForm({
  navigation,
  onChange,
  onSave,
  saving = false,
}: NavigationSettingsFormProps) {
  const updateItem = (index: number, patch: Partial<NavigationMenuItem>) => {
    const items = navigation.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ items })
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= navigation.items.length) return
    const items = [...navigation.items]
    const [moved] = items.splice(index, 1)
    items.splice(target, 0, moved)
    onChange({
      items: items.map((item, sortOrder) => ({ ...item, sortOrder: sortOrder * 10 })),
    })
  }

  const removeItem = (index: number) => {
    onChange({ items: navigation.items.filter((_, i) => i !== index) })
  }

  const addItem = () => {
    const nextOrder = navigation.items.length
      ? Math.max(...navigation.items.map((item) => item.sortOrder)) + 10
      : 0
    onChange({ items: [...navigation.items, createEmptyItem(nextOrder)] })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Меню сайту</CardTitle>
          <CardDescription>
            Керуйте видимістю, порядком і посиланнями пунктів головного меню.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1 h-4 w-4" />
          Додати пункт
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {navigation.items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border border-border/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.visible}
                  onCheckedChange={(visible) => updateItem(index, { visible })}
                />
                <span className="text-sm font-medium">{item.labels?.uk || item.labelKey || item.id}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => moveItem(index, -1)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => moveItem(index, 1)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Посилання</Label>
                <Input
                  value={item.href}
                  onChange={(e) => updateItem(index, { href: e.target.value })}
                  placeholder="/about"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ключ i18n (nav.*)</Label>
                <Input
                  value={item.labelKey ?? ''}
                  onChange={(e) => updateItem(index, { labelKey: e.target.value || undefined })}
                  placeholder="catalog"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Підпис (uk)</Label>
                <Input
                  value={item.labels?.uk ?? ''}
                  onChange={(e) =>
                    updateItem(index, {
                      labels: { ...item.labels, uk: e.target.value || undefined },
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Іконка</Label>
                <Input
                  list={`nav-icons-${item.id}`}
                  value={item.icon ?? ''}
                  onChange={(e) => updateItem(index, { icon: e.target.value || undefined })}
                />
                <datalist id={`nav-icons-${item.id}`}>
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={item.useCatalogHref === true}
                  onCheckedChange={(useCatalogHref) => updateItem(index, { useCatalogHref })}
                />
                Динамічне посилання каталогу
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={item.openInNewTab === true}
                  onCheckedChange={(openInNewTab) => updateItem(index, { openInNewTab })}
                />
                Відкривати в новій вкладці
              </label>
            </div>
          </div>
        ))}

        <Button type="button" onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Збереження...' : 'Зберегти меню'}
        </Button>
      </CardContent>
    </Card>
  )
}
