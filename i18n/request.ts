import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { getBackendApiUrl } from '@/lib/api/backend-url'
import { deepMergeMessages } from '@/lib/i18n/merge-messages'
import { DEFAULT_LOCALIZATION_SETTINGS } from '@/lib/i18n/locales'
import { normalizeLocalizationSettings } from '@/lib/settings/localization.normalize'

import { routing } from './routing'

async function loadLocalizationOverrides(locale: string) {
  try {
    const res = await fetch(`${getBackendApiUrl()}/settings/public`, { cache: 'no-store' })
    if (!res.ok) return {}
    const data = (await res.json()) as { localization?: unknown }
    const localization = normalizeLocalizationSettings(
      data.localization ?? DEFAULT_LOCALIZATION_SETTINGS,
    )
    const overrides = localization.messageOverrides[locale as keyof typeof localization.messageOverrides]
    return overrides && typeof overrides === 'object' ? overrides : {}
  } catch {
    return {}
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = requested && hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const baseMessages = (await import(`../messages/${locale}.json`)).default
  const overrides = await loadLocalizationOverrides(locale)
  const { backstage: _backstage, ...storefrontOverrides } = overrides as Record<string, unknown>
  const messages = deepMergeMessages(baseMessages, storefrontOverrides)

  return {
    locale,
    timeZone: 'Europe/Kyiv',
    messages,
  }
})
