'use client'

import { Loader2, Plus, Save, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CONTACT_LINE_TYPE_OPTIONS, getFooterVisibilityOptionsForStore, isMessengerContactLine } from '@/lib/settings/store-contact-lines'
import type { StoreContactLineType, StoreContactSettings, StoreSocialLinks } from '@/lib/settings/types'

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'viberCommunity', label: 'Viber спільнота' },
  { key: 'telegramCommunity', label: 'Telegram спільнота' },
] as const satisfies ReadonlyArray<{ key: keyof StoreSocialLinks; label: string }>

type StoreContactSettingsFormProps = {
  store: StoreContactSettings
  onChange: (store: StoreContactSettings) => void
  onSave: () => void
  saving: boolean
}

export function StoreContactSettingsForm({
  store,
  onChange,
  onSave,
  saving,
}: StoreContactSettingsFormProps) {
  const footerVisibilityOptions = getFooterVisibilityOptionsForStore(store.contactBlocks)

  const updateContactBlock = (
    blockIndex: number,
    patch: Partial<StoreContactSettings['contactBlocks'][number]>,
  ) => {
    const contactBlocks = store.contactBlocks.map((block, i) =>
      i === blockIndex ? { ...block, ...patch } : block,
    )
    onChange({ ...store, contactBlocks })
  }

  const updateContactLine = (
    blockIndex: number,
    lineIndex: number,
    patch: Partial<StoreContactSettings['contactBlocks'][number]['lines'][number]>,
  ) => {
    const contactBlocks = store.contactBlocks.map((block, i) => {
      if (i !== blockIndex) return block
      const lines = block.lines.map((line, j) => (j === lineIndex ? { ...line, ...patch } : line))
      return { ...block, lines }
    })
    onChange({ ...store, contactBlocks })
  }

  const updateSchedule = (
    index: number,
    patch: Partial<StoreContactSettings['schedules'][number]>,
  ) => {
    const schedules = store.schedules.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange({ ...store, schedules })
  }

  const updateScheduleEntry = (
    scheduleIndex: number,
    entryIndex: number,
    patch: Partial<StoreContactSettings['schedules'][number]['entries'][number]>,
  ) => {
    const schedules = store.schedules.map((schedule, i) => {
      if (i !== scheduleIndex) return schedule
      const entries = schedule.entries.map((entry, j) =>
        j === entryIndex ? { ...entry, ...patch } : entry,
      )
      return { ...schedule, entries }
    })
    onChange({ ...store, schedules })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Контакти та графік роботи</CardTitle>
        <CardDescription>
          Блоки контактів (як на сайті: Підтримка, Гурт тощо), графіки роботи та соцмережі. У кожному
          блоці можна додати телефон, email, Viber, Telegram та інші посилання.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mapsUrl">Посилання Google Maps</Label>
            <Input
              id="mapsUrl"
              type="url"
              placeholder="https://maps.app.goo.gl/..."
              value={store.mapsUrl}
              onChange={(e) => onChange({ ...store, mapsUrl: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Відкривається при кліку на адресу у футері та на сторінці контактів.
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mapsEmbedUrl">URL вбудованої карти (необовʼязково)</Label>
            <Input
              id="mapsEmbedUrl"
              type="url"
              placeholder="https://www.google.com/maps/embed?pb=..."
              value={store.mapsEmbedUrl ?? ''}
              onChange={(e) =>
                onChange({
                  ...store,
                  mapsEmbedUrl: e.target.value.trim() || undefined,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Якщо порожньо — карта будується за адресою автоматично.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address1">Адреса (рядок 1)</Label>
            <Input
              id="address1"
              value={store.addressLine1}
              onChange={(e) => onChange({ ...store, addressLine1: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address2">Адреса (рядок 2)</Label>
            <Input
              id="address2"
              value={store.addressLine2}
              onChange={(e) => onChange({ ...store, addressLine2: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Контактні блоки</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Заголовок блоку (напр. «Підтримка») і довільна кількість рядків з типом контакту.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...store,
                  contactBlocks: [
                    ...store.contactBlocks,
                    { title: '', lines: [{ type: 'phone', value: '' }] },
                  ],
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Блок
            </Button>
          </div>

          {store.contactBlocks.map((block, blockIndex) => (
            <div key={blockIndex} className="space-y-3 rounded-lg border p-4">
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="Заголовок (напр. Підтримка, Гурт)"
                  value={block.title}
                  onChange={(e) => updateContactBlock(blockIndex, { title: e.target.value })}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    onChange({
                      ...store,
                      contactBlocks: store.contactBlocks.filter((_, i) => i !== blockIndex),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {block.lines.map((line, lineIndex) => {
                  const isMessenger = isMessengerContactLine(line.type)
                  return (
                  <div key={lineIndex} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row">
                    <Select
                      value={line.type}
                      onValueChange={(value) =>
                        updateContactLine(blockIndex, lineIndex, {
                          type: value as StoreContactLineType,
                        })
                      }
                    >
                      <SelectTrigger className="w-full sm:w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_LINE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="sm:w-40"
                      placeholder={isMessenger ? 'Текст на сайті' : 'Підпис (необовʼязково)'}
                      value={line.label ?? ''}
                      onChange={(e) =>
                        updateContactLine(blockIndex, lineIndex, {
                          label: e.target.value || undefined,
                        })
                      }
                    />
                    <Input
                      className="flex-1"
                      placeholder={
                        isMessenger
                          ? 'Посилання (не видно відвідувачам)'
                          : CONTACT_LINE_TYPE_OPTIONS.find((item) => item.value === line.type)
                              ?.placeholder
                      }
                      value={line.value}
                      onChange={(e) =>
                        updateContactLine(blockIndex, lineIndex, { value: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0 self-end sm:self-auto"
                      onClick={() => {
                        const lines = block.lines.filter((_, i) => i !== lineIndex)
                        updateContactBlock(blockIndex, {
                          lines: lines.length ? lines : [{ type: 'phone', value: '' }],
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  )
                })}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  updateContactBlock(blockIndex, {
                    lines: [...block.lines, { type: 'phone', value: '' }],
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Рядок контакту
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Графіки роботи</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onChange({
                  ...store,
                  schedules: [
                    ...store.schedules,
                    { title: '', entries: [{ label: '', value: '' }], note: '' },
                  ],
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Блок
            </Button>
          </div>

          {store.schedules.map((schedule, scheduleIndex) => (
            <div key={scheduleIndex} className="space-y-3 rounded-lg border p-4">
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  placeholder="Назва (напр. Садовий центр)"
                  value={schedule.title}
                  onChange={(e) => updateSchedule(scheduleIndex, { title: e.target.value })}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    onChange({
                      ...store,
                      schedules: store.schedules.filter((_, i) => i !== scheduleIndex),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {schedule.entries.map((entry, entryIndex) => (
                  <div key={entryIndex} className="flex gap-2">
                    <Input
                      className="w-36 shrink-0"
                      placeholder="День"
                      value={entry.label}
                      onChange={(e) =>
                        updateScheduleEntry(scheduleIndex, entryIndex, { label: e.target.value })
                      }
                    />
                    <Input
                      className="flex-1"
                      placeholder="Години або «вихідний»"
                      value={entry.value}
                      onChange={(e) =>
                        updateScheduleEntry(scheduleIndex, entryIndex, { value: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        const entries = schedule.entries.filter((_, i) => i !== entryIndex)
                        updateSchedule(scheduleIndex, {
                          entries: entries.length
                            ? entries
                            : [{ label: '', value: '' }],
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  updateSchedule(scheduleIndex, {
                    entries: [...schedule.entries, { label: '', value: '' }],
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Рядок графіку
              </Button>

              <div className="space-y-2">
                <Label>Примітка (свята, особливі дні)</Label>
                <Textarea
                  rows={2}
                  placeholder="Напр.: у святкові дні графік може змінюватися"
                  value={schedule.note ?? ''}
                  onChange={(e) => updateSchedule(scheduleIndex, { note: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <Label className="text-base">Соціальні мережі</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Клікабельні іконки у футері та внизу мобільного меню. Увімкніть потрібні мережі та
              вкажіть посилання на профіль або спільноту.
            </p>
          </div>
          <div className="space-y-3">
            {SOCIAL_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor={`social-${key}`} className="text-sm font-medium">
                    {label}
                  </Label>
                  <Switch
                    id={`social-${key}`}
                    checked={store.social[key].show}
                    onCheckedChange={(checked) =>
                      onChange({
                        ...store,
                        social: {
                          ...store.social,
                          [key]: { ...store.social[key], show: checked },
                        },
                      })
                    }
                  />
                </div>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={store.social[key].url}
                  onChange={(e) =>
                    onChange({
                      ...store,
                      social: {
                        ...store.social,
                        [key]: { ...store.social[key], url: e.target.value },
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div>
            <Label className="text-base">Відображення в футері</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Оберіть, які контакти показувати внизу сайту. Перемикачі зʼявляються лише для типів
              рядків, які є у блоках контактів вище. Повна інформація завжди на сторінці «Контакти».
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {footerVisibilityOptions.map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  checked={store.footer[key]}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...store,
                      footer: { ...store.footer, [key]: checked === true },
                    })
                  }
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Зберегти
        </Button>
      </CardContent>
    </Card>
  )
}
