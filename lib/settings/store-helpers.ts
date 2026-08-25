import type {
  StoreContactBlock,
  StoreContactSettings,
  StoreEmailContact,
  StoreHoursSchedule,
  StorePhoneContact,
} from '@/lib/settings/types'
import { isContactLineVisibleInFooter } from '@/lib/settings/store-contact-lines'

export function formatStoreAddress(
  store: Pick<StoreContactSettings, 'addressLine1' | 'addressLine2'>,
): string {
  return [store.addressLine1.trim(), store.addressLine2.trim()].filter(Boolean).join(', ')
}

export function getStoreMapsUrl(
  store: Pick<StoreContactSettings, 'mapsUrl'>,
): string {
  return store.mapsUrl?.trim() ?? ''
}

export function getStoreMapsEmbedUrl(store: StoreContactSettings, locale = 'uk'): string {
  if (store.mapsEmbedUrl?.trim()) {
    return store.mapsEmbedUrl.trim()
  }

  const address = formatStoreAddress(store)
  if (!address) return ''

  const hl = locale.trim() || 'uk'
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&hl=${encodeURIComponent(hl)}&z=15&output=embed`
}

export function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits ? `tel:+${digits}` : '#'
}

function findByLabel<T extends { label: string }>(items: T[], ...labels: string[]): T | undefined {
  const normalized = labels.map((label) => label.toLowerCase())
  return (
    items.find((item) => normalized.includes(item.label.trim().toLowerCase())) ?? items[0]
  )
}

export function getStoreContactBlocks(store: StoreContactSettings): StoreContactBlock[] {
  return store.contactBlocks
    .map((block) => ({
      title: block.title.trim() || 'Контакти',
      lines: block.lines.filter((line) => line.value.trim()),
    }))
    .filter((block) => block.lines.length > 0)
}

export function getStorePhones(store: StoreContactSettings): StorePhoneContact[] {
  return store.phones.filter((item) => item.phone.trim())
}

export function getStoreEmails(store: StoreContactSettings): StoreEmailContact[] {
  return store.emails.filter((item) => item.email.trim())
}

export type StoreContactGroup = {
  label: string
  phone?: string
  email?: string
}

/** @deprecated використовуйте getStoreContactBlocks */
export function getStoreContactGroups(store: StoreContactSettings): StoreContactGroup[] {
  return getStoreContactBlocks(store).map((block) => {
    const phone = block.lines.find((line) => line.type === 'phone')?.value
    const email = block.lines.find((line) => line.type === 'email')?.value
    return {
      label: block.title,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
    }
  })
}

export function getVisibleStoreContactBlocks(
  store: StoreContactSettings,
  visibility?: Partial<StoreContactSettings['footer']>,
): StoreContactBlock[] {
  return getStoreContactBlocks(store)
    .map((block) => ({
      ...block,
      lines: block.lines.filter((line) => isContactLineVisibleInFooter(line, visibility ?? store.footer)),
    }))
    .filter((block) => block.lines.length > 0)
}

export function getSupportPhone(store: StoreContactSettings): string {
  return findByLabel(getStorePhones(store), 'підтримка', 'support')?.phone ?? ''
}

export function getWholesalePhone(store: StoreContactSettings): string {
  return findByLabel(getStorePhones(store), 'гурт', 'опт', 'wholesale')?.phone ?? ''
}

export function getSupportEmail(store: StoreContactSettings): string {
  return findByLabel(getStoreEmails(store), 'підтримка', 'support')?.email ?? ''
}

export function getWholesaleEmail(store: StoreContactSettings): string {
  return findByLabel(getStoreEmails(store), 'гурт', 'опт', 'wholesale')?.email ?? ''
}

export function getStoreSchedules(store: StoreContactSettings): StoreHoursSchedule[] {
  return store.schedules.filter(
    (schedule) => schedule.title.trim() && schedule.entries.length > 0,
  )
}

export function hasStoreContactInfo(store: StoreContactSettings): boolean {
  return Boolean(
    formatStoreAddress(store) ||
      getStoreContactBlocks(store).length ||
      getStoreSchedules(store).length,
  )
}

export function findStoreSchedule(
  store: StoreContactSettings,
  ...titleHints: string[]
): StoreHoursSchedule | undefined {
  const hints = titleHints.map((hint) => hint.toLowerCase())
  const schedules = getStoreSchedules(store)
  return (
    schedules.find((schedule) =>
      hints.some((hint) => schedule.title.toLowerCase().includes(hint)),
    ) ?? schedules[0]
  )
}

export function formatScheduleEntries(schedule: StoreHoursSchedule): string[] {
  return schedule.entries
    .filter((entry) => entry.label.trim() && entry.value.trim())
    .map((entry) => `${entry.label}: ${entry.value}`)
}

export function formatScheduleBlock(schedule: StoreHoursSchedule): string {
  const lines = formatScheduleEntries(schedule)
  if (schedule.note?.trim()) {
    lines.push(schedule.note.trim())
  }
  return lines.join('\n')
}

/** Графік для самовивозу — переважно садовий центр. */
export function formatPickupHours(store: StoreContactSettings): string {
  const schedule =
    findStoreSchedule(store, 'садов', 'центр') ?? getStoreSchedules(store)[0]
  if (!schedule) return ''
  return formatScheduleBlock(schedule)
}

/** Усі графіки одним текстом (для сторінок доставки тощо). */
export function formatAllSchedules(store: StoreContactSettings): string {
  return getStoreSchedules(store).map(formatScheduleBlock).join('\n\n')
}

/** @deprecated використовуйте formatPickupHours */
export function formatStoreHoursInline(store: StoreContactSettings): string {
  return formatPickupHours(store)
}
