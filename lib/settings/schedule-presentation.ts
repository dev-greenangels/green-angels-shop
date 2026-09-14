/**
 * Presentation layer for store schedules / contact block titles.
 * CMS keeps free-text DATA (times, day ranges); storefront shows localized PRESENTATION.
 */

export type SchedulePresentationMessages = {
  hours: string
  contactUs: string
  closed: string
  open: string
  weekday: {
    mon: string
    tue: string
    wed: string
    thu: string
    fri: string
    sat: string
    sun: string
  }
  weekdayRange: (from: string, to: string) => string
}

type WeekdayKey = keyof SchedulePresentationMessages['weekday']

const WEEKDAY_ALIASES: Record<WeekdayKey, string[]> = {
  mon: ['mon', 'monday', 'pon', 'pondelok', 'pondělí', 'hétfő', 'hétfo', 'mo', 'пн', 'понеділок'],
  tue: ['tue', 'tuesday', 'uto', 'utorok', 'úterý', 'kedd', 'di', 'вт', 'вівторок'],
  wed: ['wed', 'wednesday', 'str', 'streda', 'středa', 'szerda', 'mi', 'ср', 'середа'],
  thu: ['thu', 'thursday', 'štv', 'stv', 'štvrtok', 'čtvrtek', 'csütörtök', 'do', 'чт', 'четвер'],
  fri: ['fri', 'friday', 'pia', 'piatok', 'pátek', 'péntek', 'fr', 'пт', 'пʼятниця', "п'ятниця"],
  sat: ['sat', 'saturday', 'sob', 'sobota', 'szombat', 'sa', 'сб', 'субота'],
  sun: ['sun', 'sunday', 'ned', 'nedeľa', 'neděle', 'vasárnap', 'so', 'нд', 'неділя'],
}

const CLOSED_ALIASES = [
  'zatvorené',
  'zatvorene',
  'zavřeno',
  'zavreno',
  'geschlossen',
  'closed',
  'zárva',
  'zarva',
  'зачинено',
  'вихідний',
  'выходной',
]

const OPEN_ALIASES = ['otvorené', 'otvorene', 'otevřeno', 'offen', 'open', 'nyitva', 'відкрито']

/** Titles that mean “opening hours” — never show CMS language; use i18n `hours`. */
const HOURS_TITLE_ALIASES = [
  'otváracie hodiny',
  'otvaracie hodiny',
  'otevírací doba',
  'oteviraci doba',
  'opening hours',
  'öffnungszeiten',
  'offnungszeiten',
  'nyitvatartás',
  'графіфік роботи',
  'график работы',
  'hours',
]

/** Titles that mean “contact us” — use i18n `contactUs` instead of CMS language. */
const CONTACT_TITLE_ALIASES = [
  'kontaktujte nás',
  'kontaktujte nas',
  'kontaktujte nás',
  'contact us',
  'kontaktieren sie uns',
  'lépjen kapcsolatba',
  'kapcsolat',
  'kontakt',
  "зв'яжіться з нами",
  'звяжіться з нами',
  'напишіть нам',
]

function fold(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/['’ʻʼ]/g, '')
}

function isHoursTitle(title: string): boolean {
  const f = fold(title)
  return HOURS_TITLE_ALIASES.some((alias) => f === fold(alias) || f.includes(fold(alias)))
}

function isContactTitle(title: string): boolean {
  const f = fold(title)
  return CONTACT_TITLE_ALIASES.some((alias) => f === fold(alias) || f.includes(fold(alias)))
}

function matchWeekdayToken(token: string): WeekdayKey | null {
  const f = fold(token).replace(/\./g, '')
  for (const [key, aliases] of Object.entries(WEEKDAY_ALIASES) as [WeekdayKey, string[]][]) {
    if (aliases.some((a) => fold(a) === f)) return key
  }
  return null
}

function localizeStatusValue(value: string, messages: SchedulePresentationMessages): string {
  const f = fold(value)
  if (CLOSED_ALIASES.some((a) => f === fold(a) || f.includes(fold(a)))) {
    return messages.closed
  }
  if (OPEN_ALIASES.some((a) => f === fold(a))) {
    return messages.open
  }
  return value.trim()
}

/**
 * Localize a day-range label like "Pon - Pia", "Пн-Пт", "Mon–Fri".
 * If unrecognized, returns the original label (DATA kept).
 */
export function presentScheduleLabel(
  label: string,
  messages: SchedulePresentationMessages,
): string {
  const raw = label.trim()
  if (!raw) return raw

  const parts = raw.split(/\s*[-–—]\s*/)
  if (parts.length === 2) {
    const from = matchWeekdayToken(parts[0]!)
    const to = matchWeekdayToken(parts[1]!)
    if (from && to) {
      return messages.weekdayRange(messages.weekday[from], messages.weekday[to])
    }
  }

  const single = matchWeekdayToken(raw)
  if (single) return messages.weekday[single]

  return raw
}

export function presentScheduleValue(
  value: string,
  messages: SchedulePresentationMessages,
): string {
  return localizeStatusValue(value, messages)
}

export function presentScheduleTitle(
  cmsTitle: string,
  messages: SchedulePresentationMessages,
): string {
  if (!cmsTitle.trim() || isHoursTitle(cmsTitle)) return messages.hours
  return cmsTitle.trim()
}

export function presentContactBlockTitle(
  cmsTitle: string,
  messages: Pick<SchedulePresentationMessages, 'contactUs'>,
): string {
  if (!cmsTitle.trim()) return ''
  if (isContactTitle(cmsTitle)) return messages.contactUs
  return cmsTitle.trim()
}

export function presentScheduleEntries(
  entries: Array<{ label: string; value: string }>,
  messages: SchedulePresentationMessages,
): string[] {
  return entries
    .filter((entry) => entry.label.trim() && entry.value.trim())
    .map(
      (entry) =>
        `${presentScheduleLabel(entry.label, messages)}: ${presentScheduleValue(entry.value, messages)}`,
    )
}
