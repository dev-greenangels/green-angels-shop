'use client'

import { useTranslations } from 'next-intl'

/**
 * Translate a stable validation code via `validation.*`.
 * Does not couple pure validators to next-intl.
 */
export function useFormatFieldError() {
  const t = useTranslations('validation')
  return (code: string | null | undefined): string | null => {
    if (!code) return null
    if (t.has(code)) return t(code)
    return t('required')
  }
}
