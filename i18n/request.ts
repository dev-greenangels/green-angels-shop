import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isAppLocale } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale: typeof defaultLocale =
    requested && isAppLocale(requested) ? requested : defaultLocale

  return {
    locale,
    timeZone: 'Europe/Kyiv',
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
