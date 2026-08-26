export const DELIVERY_COUNTRY_FLAGS: Record<string, string> = {
  sk: '🇸🇰',
  hu: '🇭🇺',
  at: '🇦🇹',
  cz: '🇨🇿',
  de: '🇩🇪',
  ua: '🇺🇦',
}

export function deliveryCountryFlag(code: string): string {
  return DELIVERY_COUNTRY_FLAGS[code.toLowerCase()] ?? '🏳️'
}
