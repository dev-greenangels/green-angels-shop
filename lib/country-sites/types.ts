export type CountrySiteCode = 'sk' | 'hu' | 'at'

export const COUNTRY_SITE_CODES: CountrySiteCode[] = ['sk', 'hu', 'at']

export function isCountrySiteCode(value: string): value is CountrySiteCode {
  return (COUNTRY_SITE_CODES as readonly string[]).includes(value)
}

/** Request / response header set by proxy for SK multi-domain. */
export const GA_COUNTRY_HEADER = 'x-ga-country'
export const GA_DEFAULT_LOCALE_HEADER = 'x-ga-default-locale'
