import type { StoreContactLine, StoreContactLineType, StoreFooterVisibility } from '@/lib/settings/types'
import { DEFAULT_FOOTER_VISIBILITY } from '@/lib/settings/defaults'

export const FOOTER_VISIBILITY_OPTIONS: ReadonlyArray<{
  key: keyof StoreFooterVisibility
  label: string
}> = [
  { key: 'showAddress', label: 'Адреса' },
  { key: 'showPhone', label: 'Телефон' },
  { key: 'showEmail', label: 'Email' },
  { key: 'showViber', label: 'Чат Viber' },
  { key: 'showTelegram', label: 'Чат Telegram' },
  { key: 'showWhatsApp', label: 'Чат WhatsApp' },
  { key: 'showLink', label: 'Веб-посилання' },
  { key: 'showSchedules', label: 'Графік роботи' },
  { key: 'showCompanyDetails', label: 'Реквізити компанії' },
]

export const CONTACT_LINE_TYPE_OPTIONS: ReadonlyArray<{
  value: StoreContactLineType
  label: string
  placeholder: string
}> = [
  { value: 'phone', label: 'Телефон', placeholder: '+XXX …' },
  { value: 'email', label: 'Email', placeholder: 'info@example.com' },
  { value: 'viber', label: 'Viber', placeholder: 'Посилання (viber://, номер або https://...)' },
  { value: 'telegram', label: 'Telegram', placeholder: 'Посилання (https://t.me/... або @username)' },
  { value: 'whatsapp', label: 'WhatsApp', placeholder: 'Посилання (https://wa.me/... або номер)' },
  { value: 'link', label: 'Веб-посилання', placeholder: 'https://...' },
]

export function contactLineTypeLabel(type: StoreContactLineType): string {
  return CONTACT_LINE_TYPE_OPTIONS.find((item) => item.value === type)?.label ?? type
}

export function contactLinePlaceholder(type: StoreContactLineType): string {
  return CONTACT_LINE_TYPE_OPTIONS.find((item) => item.value === type)?.placeholder ?? ''
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function isMessengerContactLine(type: StoreContactLineType): boolean {
  return type === 'viber' || type === 'telegram' || type === 'whatsapp'
}

export function contactLineHref(line: Pick<StoreContactLine, 'type' | 'value'>): string {
  const value = line.value.trim()
  if (!value) return '#'

  switch (line.type) {
    case 'phone': {
      const digits = digitsOnly(value)
      return digits ? `tel:+${digits}` : '#'
    }
    case 'email':
      return `mailto:${value}`
    case 'viber':
      if (/^(https?:|viber:)/i.test(value)) return value
      return `viber://chat?number=%2B${digitsOnly(value)}`
    case 'telegram':
      if (/^(https?:|tg:)/i.test(value)) return value
      if (value.startsWith('@')) return `https://t.me/${value.slice(1)}`
      return `https://t.me/${value.replace(/^@/, '')}`
    case 'whatsapp':
      if (/^https?:/i.test(value)) return value
      return `https://wa.me/${digitsOnly(value)}`
    case 'link':
      return /^https?:/i.test(value) ? value : `https://${value}`
    default:
      return value
  }
}

export function contactLineRowLabel(line: StoreContactLine): string {
  if (isMessengerContactLine(line.type)) {
    return line.label?.trim() || contactLineTypeLabel(line.type)
  }
  if (line.label?.trim()) return line.label.trim()
  return contactLineTypeLabel(line.type)
}

/** Текст, який бачить відвідувач (без прихованих URL для месенджерів). */
export function contactLineDisplayText(line: StoreContactLine): string {
  if (isMessengerContactLine(line.type)) {
    return line.label?.trim() || contactLineTypeLabel(line.type)
  }
  if (line.type === 'link') {
    return line.label?.trim() || line.value.trim()
  }
  if (line.label?.trim() && line.type !== 'phone' && line.type !== 'email') {
    return line.label.trim()
  }
  return line.value.trim()
}

export function contactLineOpensInNewTab(line: Pick<StoreContactLine, 'type'>): boolean {
  return isMessengerContactLine(line.type) || line.type === 'link'
}

export function isContactLineVisibleInFooter(
  line: StoreContactLine,
  visibility: Partial<StoreFooterVisibility>,
): boolean {
  const v = { ...DEFAULT_FOOTER_VISIBILITY, ...visibility }

  switch (line.type) {
    case 'phone':
      return v.showPhone
    case 'email':
      return v.showEmail
    case 'viber':
      return v.showViber
    case 'telegram':
      return v.showTelegram
    case 'whatsapp':
      return v.showWhatsApp
    case 'link':
      return v.showLink
    default:
      return true
  }
}

export function hasHiddenFooterContacts(footer: StoreFooterVisibility): boolean {
  return FOOTER_VISIBILITY_OPTIONS.some((option) => !footer[option.key])
}

const FOOTER_KEY_BY_CONTACT_LINE_TYPE: Record<StoreContactLineType, keyof StoreFooterVisibility | null> = {
  phone: 'showPhone',
  email: 'showEmail',
  viber: 'showViber',
  telegram: 'showTelegram',
  whatsapp: 'showWhatsApp',
  link: 'showLink',
}

export function getContactLineTypesInStore(
  contactBlocks: ReadonlyArray<{ lines: ReadonlyArray<Pick<StoreContactLine, 'type' | 'value'>> }>,
): Set<StoreContactLineType> {
  const types = new Set<StoreContactLineType>()
  for (const block of contactBlocks) {
    for (const line of block.lines) {
      if (line.value.trim()) types.add(line.type)
    }
  }
  return types
}

/** Перемикачі футера лише для типів контактів, які реально є в блоках (+ адреса та графік). */
export function getFooterVisibilityOptionsForStore(
  contactBlocks: ReadonlyArray<{ lines: ReadonlyArray<Pick<StoreContactLine, 'type' | 'value'>> }>,
): typeof FOOTER_VISIBILITY_OPTIONS {
  const types = getContactLineTypesInStore(contactBlocks)

  return FOOTER_VISIBILITY_OPTIONS.filter((option) => {
    if (
      option.key === 'showAddress' ||
      option.key === 'showSchedules' ||
      option.key === 'showCompanyDetails'
    ) {
      return true
    }
    return Array.from(types).some(
      (type) => FOOTER_KEY_BY_CONTACT_LINE_TYPE[type] === option.key,
    )
  })
}
