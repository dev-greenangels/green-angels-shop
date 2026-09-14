import type { AppLocale } from '@/lib/i18n/locales'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locales'

/**
 * Customer-facing count-unit symbols by storefront locale.
 * Internal unit identity (code `pcs`, DB row) stays stable — only display changes.
 */
export const COUNT_UNIT_DISPLAY_BY_LOCALE: Record<AppLocale, string> = {
  uk: 'шт',
  sk: 'ks',
  cs: 'ks',
  hu: 'db',
  de: 'Stk.',
  en: 'pcs',
}

/** Tokens that identify the default COUNT / piece unit (code or legacy symbols). */
const COUNT_UNIT_IDENTITY = new Set(
  [
    'pcs',
    'pc',
    'шт',
    'ks',
    'db',
    'stk',
    'stk.',
    'stück',
    'st',
    'st.',
    'piece',
    'pieces',
  ].map((s) => s.toLowerCase()),
)

function normalizeLocale(locale: string | null | undefined): AppLocale {
  const code = (locale ?? '').trim().toLowerCase().slice(0, 2)
  return (SUPPORTED_LOCALES as readonly string[]).includes(code)
    ? (code as AppLocale)
    : 'en'
}

function normalizeToken(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.$/, '')
}

export function isCountUnitIdentity(codeOrSymbol: string | null | undefined): boolean {
  const raw = codeOrSymbol?.trim()
  if (!raw) return true
  return COUNT_UNIT_IDENTITY.has(normalizeToken(raw))
}

/**
 * Resolve the customer-facing unit symbol for the active locale.
 * Non-count units (kg, g, l, …) pass through unchanged.
 */
export function resolveUnitDisplaySymbol(
  codeOrSymbol: string | null | undefined,
  locale: string | null | undefined,
): string {
  const loc = normalizeLocale(locale)
  if (!codeOrSymbol?.trim() || isCountUnitIdentity(codeOrSymbol)) {
    return COUNT_UNIT_DISPLAY_BY_LOCALE[loc]
  }
  return codeOrSymbol.trim()
}
