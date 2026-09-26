/**
 * Shared Backoffice country display — Unicode regional-indicator flags, no network.
 */

const COUNTRY_NAMES: Record<string, Record<'uk' | 'en' | 'sk', string>> = {
  SK: { uk: 'Словаччина', en: 'Slovakia', sk: 'Slovensko' },
  AT: { uk: 'Австрія', en: 'Austria', sk: 'Rakúsko' },
  HU: { uk: 'Угорщина', en: 'Hungary', sk: 'Maďarsko' },
  CZ: { uk: 'Чехія', en: 'Czechia', sk: 'Česko' },
  DE: { uk: 'Німеччина', en: 'Germany', sk: 'Nemecko' },
  PL: { uk: 'Польща', en: 'Poland', sk: 'Poľsko' },
  UA: { uk: 'Україна', en: 'Ukraine', sk: 'Ukrajina' },
  RO: { uk: 'Румунія', en: 'Romania', sk: 'Rumunsko' },
  IT: { uk: 'Італія', en: 'Italy', sk: 'Taliansko' },
  FR: { uk: 'Франція', en: 'France', sk: 'Francúzsko' },
  GB: { uk: 'Велика Британія', en: 'United Kingdom', sk: 'Spojené kráľovstvo' },
  US: { uk: 'США', en: 'United States', sk: 'Spojené štáty' },
}

export type BackstageCountryLocale = 'uk' | 'en' | 'sk'

export function normalizeCountryCode(code: string | null | undefined): string | null {
  if (code == null) return null
  const normalized = String(code).trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) return null
  return normalized
}

/** ISO 3166-1 alpha-2 → regional indicator emoji (e.g. AT → 🇦🇹). */
export function countryCodeToFlagEmoji(code: string | null | undefined): string | null {
  const normalized = normalizeCountryCode(code)
  if (!normalized) return null
  const a = normalized.codePointAt(0)
  const b = normalized.codePointAt(1)
  if (a == null || b == null) return null
  return String.fromCodePoint(0x1f1e6 + (a - 65), 0x1f1e6 + (b - 65))
}

export function countryLocalizedName(
  code: string | null | undefined,
  locale: BackstageCountryLocale = 'en',
): string | null {
  const normalized = normalizeCountryCode(code)
  if (!normalized) return null
  const entry = COUNTRY_NAMES[normalized]
  if (entry) return entry[locale] ?? entry.en
  try {
    const intlLocale = locale === 'uk' ? 'uk' : locale === 'sk' ? 'sk' : 'en'
    const name = new Intl.DisplayNames([intlLocale], { type: 'region' }).of(normalized)
    return name ?? normalized
  } catch {
    return normalized
  }
}

export function formatCountryDisplay(
  code: string | null | undefined,
  locale: BackstageCountryLocale = 'en',
): { code: string; flag: string; name: string; label: string } | null {
  const normalized = normalizeCountryCode(code)
  if (!normalized) return null
  const flag = countryCodeToFlagEmoji(normalized) ?? ''
  const name = countryLocalizedName(normalized, locale) ?? normalized
  const label = flag ? `${flag} ${normalized} · ${name}` : `${normalized} · ${name}`
  return { code: normalized, flag, name, label }
}
