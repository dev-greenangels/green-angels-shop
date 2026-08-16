import backstageDe from '@/messages/backstage/de.json'
import backstageEn from '@/messages/backstage/en.json'
import backstageHu from '@/messages/backstage/hu.json'
import backstageSk from '@/messages/backstage/sk.json'
import backstageUk from '@/messages/backstage/uk.json'
import storefrontCs from '@/messages/cs.json'
import storefrontDe from '@/messages/de.json'
import storefrontEn from '@/messages/en.json'
import storefrontHu from '@/messages/hu.json'
import storefrontSk from '@/messages/sk.json'
import storefrontUk from '@/messages/uk.json'

import { deepMergeMessages } from '@/lib/i18n/merge-messages'
import type { AppLocale, LocalizationMessageOverrides } from '@/lib/i18n/locales'

const BASE_MESSAGES: Record<AppLocale, Record<string, unknown>> = {
  uk: backstageUk as Record<string, unknown>,
  en: backstageEn as Record<string, unknown>,
  sk: backstageSk as Record<string, unknown>,
  hu: backstageHu as Record<string, unknown>,
  de: backstageDe as Record<string, unknown>,
  // Backstage UI has no dedicated cs yet — fall back to English chrome.
  cs: backstageEn as Record<string, unknown>,
}

const STOREFRONT_MESSAGES: Record<AppLocale, Record<string, unknown>> = {
  uk: storefrontUk as Record<string, unknown>,
  en: storefrontEn as Record<string, unknown>,
  sk: storefrontSk as Record<string, unknown>,
  hu: storefrontHu as Record<string, unknown>,
  de: storefrontDe as Record<string, unknown>,
  cs: storefrontCs as Record<string, unknown>,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function storefrontReviewsNamespace(locale: AppLocale): Record<string, unknown> {
  const reviews = STOREFRONT_MESSAGES[locale].reviews
  return isRecord(reviews) ? reviews : {}
}

export function buildBackstageMessages(
  locale: AppLocale,
  overrides?: LocalizationMessageOverrides,
): Record<string, unknown> {
  let messages = deepMergeMessages(BASE_MESSAGES[locale], {
    reviews: storefrontReviewsNamespace(locale),
  })

  const localeOverrides = overrides?.[locale]
  const storefrontPatch = localeOverrides?.storefront
  if (isRecord(storefrontPatch) && isRecord(storefrontPatch.reviews)) {
    messages = deepMergeMessages(messages, { reviews: storefrontPatch.reviews })
  }

  const backstagePatch = localeOverrides?.backstage
  if (isRecord(backstagePatch)) {
    messages = deepMergeMessages(messages, backstagePatch)
  }

  return messages
}
