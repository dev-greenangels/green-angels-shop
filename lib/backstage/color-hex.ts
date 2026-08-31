export const PRESET_COLOR_HEX = [
  '#FFFFFF',
  '#FFD500',
  '#FFA500',
  '#FF6B6B',
  '#FF69B4',
  '#9B59B6',
  '#3498DB',
  '#2ECC71',
  '#006400',
  '#8B4513',
  '#708090',
  '#000000',
] as const

export function normalizeColorHex(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash)) return trimmed
  return withHash.toUpperCase()
}

export function isValidColorHex(raw: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(normalizeColorHex(raw))
}

export function colorHexForNativeInput(hex: string): string {
  const normalized = normalizeColorHex(hex)
  return /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized : '#000000'
}
