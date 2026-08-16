export type DispatchCalendarSettings = {
  enabled: boolean
  blockedWeekdays: number[]
  blackoutDates: string[]
  horizonDays: number
  minLeadDays: number
  dailyCapacity: number
  externalReservedByDate: Record<string, number>
}

export type DispatchDaySlot = {
  date: string
  siteCount: number
  externalReserved: number
  used: number
  capacity: number
  remaining: number | null
}

export type DispatchAvailableDate = {
  date: string
  remaining: number | null
}

export async function fetchDispatchCalendarAdmin(): Promise<{
  settings: DispatchCalendarSettings
  report: DispatchDaySlot[]
}> {
  const res = await fetch('/api/backstage/settings/dispatch-calendar', {
    credentials: 'include',
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    settings?: DispatchCalendarSettings
    report?: DispatchDaySlot[]
  }
  if (!res.ok || !data.settings) {
    throw new Error(data.error || 'Не вдалося завантажити календар відправок')
  }
  return { settings: data.settings, report: data.report ?? [] }
}

export async function updateDispatchCalendarAdmin(
  patch: Partial<DispatchCalendarSettings>,
): Promise<DispatchCalendarSettings> {
  const res = await fetch('/api/backstage/settings/dispatch-calendar', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const data = (await res.json().catch(() => ({}))) as DispatchCalendarSettings & {
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error || 'Не вдалося зберегти календар відправок')
  }
  return data
}

export async function fetchAvailableDispatchDates(input: {
  availableFromDates?: string[]
}): Promise<{ enabled: boolean; dates: DispatchAvailableDate[] }> {
  const res = await fetch('/api/dispatch-calendar/available-dates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  const data = (await res.json().catch(() => ({}))) as {
    enabled?: boolean
    dates?: DispatchAvailableDate[]
    error?: string
  }
  if (!res.ok) {
    throw new Error(data.error || 'Не вдалося завантажити дати відправки')
  }
  return { enabled: Boolean(data.enabled), dates: data.dates ?? [] }
}
