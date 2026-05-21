/**
 * Маршрутизація локалей. Зараз лише `uk`; додайте код мови та файл у `messages/`
 * для розширення (наприклад `en` + `messages/en.json`), потім оновіть middleware/plugin.
 */
export const locales = ['uk'] as const

export type AppLocale = (typeof locales)[number]

export const defaultLocale: AppLocale = 'uk'

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value)
}
