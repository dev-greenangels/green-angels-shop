/**
 * Next `proxy.ts` `config.matcher` must be **string literals** (static analysis).
 * Keep these values identical to `export const config` in `proxy.ts`.
 *
 * Rule:
 * 1. Run proxy for locale/app routes (no file extension / no `.` in the path).
 * 2. Also run for Presta legacy `*.html` / `*.php` so Redirect table 301s fire.
 * 3. Skip `_next`, `_vercel`, and every other dotted file (css, js, images,
 *    robots.txt, sitemap.xml, …).
 */
export const SHOP_PROXY_MATCHERS = [
  '/((?!_next|_vercel|favicon.ico|.*\\..*).*)',
  '/((?!_next|_vercel).*)\\.html',
  '/((?!_next|_vercel).*)\\.php',
] as const

export function shouldRunShopProxy(pathname: string): boolean {
  const path = (pathname.split('?')[0] || '/').split('#')[0] || '/'
  if (path.startsWith('/_next')) return false
  if (path.startsWith('/_vercel')) return false
  if (path === '/favicon.ico' || path.endsWith('/favicon.ico')) return false
  if (/\.html$/i.test(path) || /\.php$/i.test(path)) return true
  if (path.includes('.')) return false
  return true
}
