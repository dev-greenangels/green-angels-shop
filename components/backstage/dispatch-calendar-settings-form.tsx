'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from '@/lib/toast'

import { FormSaveBar } from '@/components/backstage/form-save-bar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  fetchDispatchCalendarAdmin,
  updateDispatchCalendarAdmin,
  type DispatchCalendarSettings,
  type DispatchDaySlot,
} from '@/lib/dispatch-calendar'

const WEEKDAYS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
  { value: 0, label: 'Нд' },
]

const EMPTY: DispatchCalendarSettings = {
  enabled: false,
  blockedWeekdays: [0, 6],
  blackoutDates: [],
  horizonDays: 45,
  minLeadDays: 0,
  dailyCapacity: 100,
  externalReservedByDate: {},
}

function settingsSnapshot(s: DispatchCalendarSettings): string {
  return JSON.stringify({
    enabled: s.enabled,
    blockedWeekdays: s.blockedWeekdays,
    blackoutDates: s.blackoutDates,
    horizonDays: s.horizonDays,
    minLeadDays: s.minLeadDays,
    dailyCapacity: s.dailyCapacity,
    externalReservedByDate: s.externalReservedByDate,
  })
}

function rebuildReportSlots(
  report: DispatchDaySlot[],
  externalReservedByDate: Record<string, number>,
  dailyCapacity: number,
): DispatchDaySlot[] {
  return report.map((row) => {
    const externalReserved = externalReservedByDate[row.date] ?? 0
    const used = row.siteCount + externalReserved
    const remaining =
      dailyCapacity > 0 ? Math.max(0, dailyCapacity - used) : null
    return {
      ...row,
      externalReserved,
      used,
      capacity: dailyCapacity,
      remaining,
    }
  })
}

export function DispatchCalendarSettingsForm() {
  const [settings, setSettings] = useState<DispatchCalendarSettings>(EMPTY)
  const [baseline, setBaseline] = useState('')
  const [report, setReport] = useState<DispatchDaySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [blackoutInput, setBlackoutInput] = useState('')
  const [externalDate, setExternalDate] = useState('')
  const [externalCount, setExternalCount] = useState('0')

  const isDirty = useMemo(
    () => Boolean(baseline) && settingsSnapshot(settings) !== baseline,
    [baseline, settings],
  )

  const externalEntries = useMemo(
    () =>
      Object.entries(settings.externalReservedByDate)
        .filter(([, n]) => n > 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    [settings.externalReservedByDate],
  )

  // Preview capacity columns from draft settings (before Save).
  useEffect(() => {
    if (loading) return
    setReport((r) =>
      rebuildReportSlots(r, settings.externalReservedByDate, settings.dailyCapacity),
    )
  }, [loading, settings.externalReservedByDate, settings.dailyCapacity])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchDispatchCalendarAdmin()
      const next = { ...EMPTY, ...data.settings }
      setSettings(next)
      setBaseline(settingsSnapshot(next))
      setReport(data.report)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patchSettings = useCallback(
    (updater: (prev: DispatchCalendarSettings) => DispatchCalendarSettings) => {
      setSettings(updater)
    },
    [],
  )

  const isOpenWeekday = (day: number) => !settings.blockedWeekdays.includes(day)

  const toggleWeekday = (day: number, open: boolean) => {
    patchSettings((s) => {
      const blocked = new Set(s.blockedWeekdays)
      if (open) blocked.delete(day)
      else blocked.add(day)
      return { ...s, blockedWeekdays: [...blocked].sort((a, b) => a - b) }
    })
  }

  const addExternalReserve = () => {
    if (!externalDate) {
      toast.error('Оберіть дату для резерву 1С')
      return
    }
    const n = Math.max(0, Math.trunc(Number(externalCount) || 0))
    patchSettings((s) => ({
      ...s,
      externalReservedByDate: {
        ...s.externalReservedByDate,
        [externalDate]: n,
      },
    }))
    toast.success(
      n > 0
        ? `Резерв 1С: ${externalDate} → ${n}`
        : `Резерв 1С для ${externalDate} скинуто`,
    )
    setExternalCount('0')
  }

  const save = async () => {
    setSaving(true)
    try {
      const next = await updateDispatchCalendarAdmin(settings)
      const normalized = { ...EMPTY, ...next }
      setSettings(normalized)
      setBaseline(settingsSnapshot(normalized))
      toast.success('Календар відправок збережено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Завантаження…</p>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div>
          <p className="font-medium">Увімкнути календар відправок</p>
          <p className="text-sm text-muted-foreground">
            Клієнт обирає дату в checkout; ліміт і вихідні керують чергою пакування.
          </p>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(enabled) => patchSettings((s) => ({ ...s, enabled }))}
        />
      </div>

      <div className="space-y-3">
        <Label>Дні відправки (можна відкрити сб/нд)</Label>
        <div className="flex flex-wrap gap-3">
          {WEEKDAYS.map((d) => (
            <label key={d.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isOpenWeekday(d.value)}
                onCheckedChange={(v) => toggleWeekday(d.value, Boolean(v))}
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Ліміт відправок на день</Label>
          <Input
            type="number"
            min={0}
            value={settings.dailyCapacity}
            onChange={(e) =>
              patchSettings((s) => ({
                ...s,
                dailyCapacity: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
          <p className="text-xs text-muted-foreground">0 = без ліміту</p>
        </div>
        <div className="space-y-2">
          <Label>Скільки днів наперед показувати</Label>
          <Input
            type="number"
            min={7}
            max={180}
            value={settings.horizonDays}
            onChange={(e) =>
              patchSettings((s) => ({
                ...s,
                horizonDays: Math.max(7, Number(e.target.value) || 45),
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Горизонт календаря для клієнта (7–180).
          </p>
        </div>
        <div className="space-y-2">
          <Label>Не раніше ніж через (днів)</Label>
          <Input
            type="number"
            min={0}
            max={30}
            value={settings.minLeadDays}
            onChange={(e) =>
              patchSettings((s) => ({
                ...s,
                minLeadDays: Math.max(0, Number(e.target.value) || 0),
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Мін. відступ від сьогодні до першої доступної дати (0 = можна сьогодні).
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Чорний список дат (свята / позапланові)</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            type="date"
            value={blackoutInput}
            onChange={(e) => setBlackoutInput(e.target.value)}
            className="w-auto"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!blackoutInput) return
              patchSettings((s) => ({
                ...s,
                blackoutDates: [...new Set([...s.blackoutDates, blackoutInput])].sort(),
              }))
              setBlackoutInput('')
            }}
          >
            Додати
          </Button>
        </div>
        <ul className="space-y-1 text-sm">
          {settings.blackoutDates.map((d) => (
            <li key={d} className="flex items-center gap-2">
              <span>{d}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  patchSettings((s) => ({
                    ...s,
                    blackoutDates: s.blackoutDates.filter((x) => x !== d),
                  }))
                }
              >
                Видалити
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <Label>Зовнішній резерв (1С вручну)</Label>
        <p className="text-xs text-muted-foreground">
          Скільки замовлень на день уже враховано в 1С (поки немає API). Після додавання
          натисніть «Зберегти» внизу, щоб записати в базу.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Дата</Label>
            <Input
              type="date"
              value={externalDate}
              onChange={(e) => setExternalDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Кількість</Label>
            <Input
              type="number"
              min={0}
              value={externalCount}
              onChange={(e) => setExternalCount(e.target.value)}
              className="w-24"
            />
          </div>
          <Button type="button" variant="outline" onClick={addExternalReserve}>
            Додати
          </Button>
        </div>
        <ul className="space-y-1 text-sm">
          {externalEntries.map(([date, count]) => (
            <li key={date} className="flex items-center gap-2">
              <span>
                {date}: <strong>{count}</strong>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  patchSettings((s) => {
                    const next = { ...s.externalReservedByDate }
                    delete next[date]
                    return { ...s, externalReservedByDate: next }
                  })
                }
              >
                Видалити
              </Button>
            </li>
          ))}
          {externalEntries.length === 0 ? (
            <li className="text-muted-foreground">Резервів ще немає.</li>
          ) : null}
        </ul>
      </div>

      <div className="space-y-2">
        <Label>Звіт завантаження (відкриті дні)</Label>
        <p className="text-xs text-muted-foreground">
          Колонка «1С/зовн.» оновлюється одразу після «Додати»; у базу — лише після
          «Зберегти».
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2">Дата</th>
                <th className="px-3 py-2">Сайт</th>
                <th className="px-3 py-2">1С/зовн.</th>
                <th className="px-3 py-2">Разом</th>
                <th className="px-3 py-2">Ліміт</th>
                <th className="px-3 py-2">Залишок</th>
              </tr>
            </thead>
            <tbody>
              {report.map((row) => (
                <tr key={row.date} className="border-t">
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2">{row.siteCount}</td>
                  <td className="px-3 py-2">{row.externalReserved}</td>
                  <td className="px-3 py-2">{row.used}</td>
                  <td className="px-3 py-2">{row.capacity || '∞'}</td>
                  <td className="px-3 py-2">
                    {row.remaining == null ? '∞' : row.remaining}
                  </td>
                </tr>
              ))}
              {report.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-muted-foreground">
                    Немає відкритих днів у горизонті (або календар вимкнено).
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <FormSaveBar
        onSave={() => void save()}
        saving={saving}
        isDirty={isDirty}
        sticky
        label="Зберегти календар відправок"
      />
    </div>
  )
}
