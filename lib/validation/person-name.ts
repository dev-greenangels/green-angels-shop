/**
 * Unicode human person-name sanitize/validate (Latin + Cyrillic + EU diacritics).
 * Shared by wholesale, contract withdrawal, and review author name.
 * Not market/locale-gated — display names may use either script on any deploy.
 */

/** Letters: Latin (incl. EU diacritics) + Cyrillic (UA/RU). Separators: space ' ʼ - . */
const PERSON_NAME_CHAR_CLASS =
  "A-Za-zÀ-ÖØ-öø-ÿĀ-žĄąĆćČčĎďĐđĘęĚěĹĺĽľŁłŃńŇňŐőŘřŚśŠšŤťŮůŰűŹźŻżŽžА-Яа-яІіЇїЄєҐґЁё'ʼ\\s.-"

const PERSON_NAME_FILTER = new RegExp(`[^${PERSON_NAME_CHAR_CLASS}]`, 'g')

/** Full-string match after trim; length 2–120 enforced here. */
export const PERSON_NAME_REGEX = new RegExp(
  `^[${PERSON_NAME_CHAR_CLASS}]{2,120}$`,
)

const PERSON_NAME_LETTER_REGEX =
  /[A-Za-zÀ-ÖØ-öø-ÿĀ-žА-Яа-яІіЇїЄєҐґЁё]/

export function sanitizePersonName(value: string): string {
  return value.replace(PERSON_NAME_FILTER, '').replace(/\s+/g, ' ').slice(0, 120)
}

export function isValidPersonName(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 2 || trimmed.length > 120) return false
  if (!PERSON_NAME_LETTER_REGEX.test(trimmed)) return false
  return PERSON_NAME_REGEX.test(trimmed)
}
