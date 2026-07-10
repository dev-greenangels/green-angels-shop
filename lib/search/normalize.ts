export const SEARCH_QUERY_MAX_LENGTH = 120
export const SEARCH_MIN_TOKEN_LENGTH = 2

const QUOTE_CHARS = /[\u2018\u2019\u201A\u2032`´]/g
const DOUBLE_QUOTE_CHARS = /[\u201C\u201D\u201E\u00AB\u00BB"]/g

export function normalizeSearchQuery(value: string | null | undefined): string {
  if (!value) return ''

  return value
    .normalize('NFC')
    .replace(QUOTE_CHARS, "'")
    .replace(DOUBLE_QUOTE_CHARS, '')
    .replace(/\u00AD/g, '')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SEARCH_QUERY_MAX_LENGTH)
}

export function tokenizeSearchQuery(normalized: string): string[] {
  if (!normalized) return []

  return [
    ...new Set(
      normalized
        .split(/[\s,;.+/]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= SEARCH_MIN_TOKEN_LENGTH),
    ),
  ]
}

export function matchesNormalizedSubstring(haystack: string, needle: string) {
  const normalizedHaystack = normalizeSearchQuery(haystack).toLocaleLowerCase('uk')
  const normalizedNeedle = normalizeSearchQuery(needle).toLocaleLowerCase('uk')
  if (!normalizedNeedle) return false
  return normalizedHaystack.includes(normalizedNeedle)
}
