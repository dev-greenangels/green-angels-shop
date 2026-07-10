'use client'

import { useLocale } from 'next-intl'
import { useEffect } from 'react'

/** Keeps <html lang> in sync when switching locale via client navigation. */
export function DocumentLang() {
  const locale = useLocale()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
