/** Public GTM container id, e.g. GTM-MSNVH28D */
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/

/** Set by proxy on `/backstage` so root layout can skip GTM / Vercel Analytics. */
export const GA_SURFACE_HEADER = 'x-ga-surface'
export const GA_SURFACE_BACKSTAGE = 'backstage'

export function isBackstageSurface(headerValue?: string | null): boolean {
  return headerValue === GA_SURFACE_BACKSTAGE
}

export function getGtmId(envValue?: string | null): string | null {
  const raw = (envValue ?? process.env.NEXT_PUBLIC_GTM_ID ?? '').trim()
  if (!raw || !GTM_ID_PATTERN.test(raw)) return null
  return raw
}

export function isGtmEnabled(envValue?: string | null): boolean {
  return getGtmId(envValue) !== null
}

export function buildGtmScript(gtmId: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`
}

export function gtmNoscriptSrc(gtmId: string): string {
  return `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`
}
