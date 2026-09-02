import type { Metadata } from 'next'

/** Private flows: checkout, account, auth, backstage. */
export const PRIVATE_PAGE_ROBOTS: Metadata['robots'] = { index: false, follow: false }

/** Utility listings that should not rank but may pass crawl equity. */
export const UTILITY_PAGE_ROBOTS: Metadata['robots'] = { index: false, follow: true }
