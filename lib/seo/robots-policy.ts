/** Path prefixes that must not be indexed. Locale-prefixed copies use wildcard /star/account paths. */
export const ROBOTS_DISALLOW_PATHS = [
  '/api/',
  '/backstage',
  '/admin',
  '/account',
  '/auth',
  '/checkout',
  '/search',
  '/favorites',
  '/cart',
  '/*/account',
  '/*/auth',
  '/*/checkout',
  '/*/search',
  '/*/favorites',
  '/*/cart',
] as const

export function buildRobotsRules(input: { origin: string; indexingAllowed: boolean }) {
  const origin = input.origin.replace(/\/$/, '')

  if (!input.indexingAllowed || !origin) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https?:\/\//, ''),
  }
}
