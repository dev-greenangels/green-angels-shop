export function parseSearchSynonyms(stored: string | null | undefined): string[] {
  if (!stored?.trim()) return []

  return stored
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
