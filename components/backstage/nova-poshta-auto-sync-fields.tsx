'use client'

import type { NpAutoSyncConfig, NpHumanSchedule } from '@/lib/nova-poshta/cron-schedule'
import {
  DEFAULT_AUTO_SYNC_CONFIG,
  formatHumanSchedule,
  NP_WEEKDAY_LABELS,
  toggleWeekday,
} from '@/lib/nova-poshta/cron-schedule'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

function ScheduleFields({
  title,
  schedule,
  onChange,
  showEnabled,
}: {
  title: string
  schedule: NpHumanSchedule
  onChange: (next: NpHumanSchedule) => void
  showEnabled?: boolean
}) {
  const timeValue = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{title}</p>
        {showEnabled && (
          <div className="flex items-center gap-2">
            <Label htmlFor={`${title}-enabled`} className="text-xs text-muted-foreground">
              Увімкнено
            </Label>
            <Switch
              id={`${title}-enabled`}
              checked={schedule.enabled}
              onCheckedChange={(enabled) => onChange({ ...schedule, enabled })}
            />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Час</Label>
          <input
            type="time"
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
            value={timeValue}
            onChange={(e) => {
              const [hour, minute] = e.target.value.split(':').map(Number)
              onChange({
                ...schedule,
                hour: Number.isFinite(hour) ? hour : schedule.hour,
                minute: Number.isFinite(minute) ? minute : schedule.minute,
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>День місяця</Label>
          <select
            className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
            value={schedule.dayOfMonth === null ? '' : String(schedule.dayOfMonth)}
            onChange={(e) =>
              onChange({
                ...schedule,
                dayOfMonth: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">Кожного дня / за днями тижня</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day}-го числа
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Дні тижня (порожньо = щодня)</Label>
        <div className="flex flex-wrap gap-2">
          {NP_WEEKDAY_LABELS.map((label, day) => (
            <button
              key={label}
              type="button"
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs transition-colors',
                schedule.daysOfWeek.includes(day)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50',
              )}
              onClick={() =>
                onChange({ ...schedule, daysOfWeek: toggleWeekday(schedule.daysOfWeek, day) })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{formatHumanSchedule(schedule)}</p>
    </div>
  )
}

export function NovaPoshtaAutoSyncFields({
  autoSync,
  onChange,
}: {
  autoSync: NpAutoSyncConfig
  onChange: (next: NpAutoSyncConfig) => void
}) {
  const updateSchedule = (
    key: keyof NpAutoSyncConfig['schedules'],
    schedule: NpHumanSchedule,
  ) => {
    onChange({
      ...autoSync,
      schedules: { ...autoSync.schedules, [key]: schedule },
    })
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="np-auto-sync">Автооновлення довідників</Label>
        <Switch
          id="np-auto-sync"
          checked={autoSync.enabled}
          onCheckedChange={(enabled) => onChange({ ...autoSync, enabled })}
        />
      </div>

      <div className="space-y-2">
        <Label>Режим розкладу</Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Все разом'],
              ['separate', 'Окремо по довідниках'],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-colors',
                autoSync.mode === mode
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50',
              )}
              onClick={() => onChange({ ...autoSync, mode })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {autoSync.mode === 'all' ? (
        <ScheduleFields
          title="Розклад для всіх довідників"
          schedule={autoSync.schedules.all}
          onChange={(schedule) => updateSchedule('all', schedule)}
        />
      ) : (
        <div className="grid gap-3">
          <ScheduleFields
            title="Міста"
            schedule={autoSync.schedules.settlements}
            onChange={(schedule) => updateSchedule('settlements', schedule)}
            showEnabled
          />
          <ScheduleFields
            title="Відділення"
            schedule={autoSync.schedules.warehouses}
            onChange={(schedule) => updateSchedule('warehouses', schedule)}
            showEnabled
          />
          <ScheduleFields
            title="Типи відділень"
            schedule={autoSync.schedules.warehouse_types}
            onChange={(schedule) => updateSchedule('warehouse_types', schedule)}
            showEnabled
          />
        </div>
      )}
    </div>
  )
}

export { DEFAULT_AUTO_SYNC_CONFIG }
