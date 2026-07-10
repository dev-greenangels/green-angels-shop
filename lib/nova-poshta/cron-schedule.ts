export type NpHumanSchedule = {
  enabled: boolean
  hour: number
  minute: number
  daysOfWeek: number[]
  dayOfMonth: number | null
}

export type NpAutoSyncConfig = {
  enabled: boolean
  mode: 'all' | 'separate'
  schedules: {
    all: NpHumanSchedule
    settlements: NpHumanSchedule
    warehouses: NpHumanSchedule
    warehouse_types: NpHumanSchedule
  }
}

export const NP_WEEKDAY_LABELS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const

export const DEFAULT_HUMAN_SCHEDULE: NpHumanSchedule = {
  enabled: true,
  hour: 3,
  minute: 0,
  daysOfWeek: [],
  dayOfMonth: 1,
}

export const DEFAULT_AUTO_SYNC_CONFIG: NpAutoSyncConfig = {
  enabled: true,
  mode: 'all',
  schedules: {
    all: { ...DEFAULT_HUMAN_SCHEDULE },
    settlements: { ...DEFAULT_HUMAN_SCHEDULE, dayOfMonth: null },
    warehouses: { ...DEFAULT_HUMAN_SCHEDULE, dayOfMonth: null },
    warehouse_types: { ...DEFAULT_HUMAN_SCHEDULE, dayOfMonth: null },
  },
}

export function formatHumanSchedule(schedule: NpHumanSchedule): string {
  const time = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`
  const parts: string[] = []

  if (schedule.dayOfMonth !== null) {
    parts.push(`${schedule.dayOfMonth}-го числа`)
  }

  if (schedule.daysOfWeek.length > 0) {
    parts.push(schedule.daysOfWeek.map((d) => NP_WEEKDAY_LABELS[d] ?? String(d)).join(', '))
  } else if (schedule.dayOfMonth === null) {
    parts.push('щодня')
  }

  return `${time} · ${parts.join(' · ') || 'щомісяця'}`
}

export function toggleWeekday(days: number[], day: number): number[] {
  return days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b)
}
