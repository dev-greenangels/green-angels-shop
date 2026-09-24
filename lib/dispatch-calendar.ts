export type ShippingLeadNoticeShowMode =
  | 'when_calendar_off'
  | 'always'
  | 'with_calendar'

export type ShippingLeadNoticeSettings = {
  enabled: boolean
  showMode: ShippingLeadNoticeShowMode
  texts: Record<string, string>
}

export const SHIPPING_LEAD_NOTICE_LOCALES = [
  'uk',
  'en',
  'sk',
  'cs',
  'hu',
  'de',
] as const

export const DEFAULT_SHIPPING_LEAD_NOTICE_TEXTS: Record<
  (typeof SHIPPING_LEAD_NOTICE_LOCALES)[number],
  string
> = {
  uk: 'Відправка замовлення зазвичай протягом 1–3 робочих днів після підтвердження.',
  en: 'Orders are usually dispatched within 1–3 business days after confirmation.',
  sk: 'Objednávku zvyčajne odosielame do 1–3 pracovných dní po potvrdení.',
  cs: 'Objednávku obvykle odesíláme do 1–3 pracovních dnů po potvrzení.',
  hu: 'A rendelést általában a visszaigazolástól számított 1–3 munkanapon belül feladjuk.',
  de: 'Bestellungen werden in der Regel innerhalb von 1–3 Werktagen nach Bestätigung versendet.',
}

export type DispatchCalendarSettings = {
  enabled: boolean
  blockedWeekdays: number[]
  blackoutDates: string[]
  horizonDays: number
  minLeadDays: number
  dailyCapacity: number
  externalReservedByDate: Record<string, number>
  shippingLeadNotice: ShippingLeadNoticeSettings
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

export function resolveShippingLeadNoticeText(
  notice: ShippingLeadNoticeSettings | null | undefined,
  locale: string,
): string {
  if (!notice?.enabled) return ''
  const texts = notice.texts ?? {}
  const primary = String(texts[locale] ?? '').trim()
  if (primary) return primary
  const uk = String(texts.uk ?? '').trim()
  if (uk) return uk
  return String(texts.en ?? '').trim()
}

export function shouldShowShippingLeadNotice(
  notice: ShippingLeadNoticeSettings | null | undefined,
  calendarEnabled: boolean,
): boolean {
  if (!notice?.enabled) return false
  switch (notice.showMode) {
    case 'always':
      return true
    case 'with_calendar':
      return calendarEnabled
    case 'when_calendar_off':
    default:
      return !calendarEnabled
  }
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
