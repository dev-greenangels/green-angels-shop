import Script from 'next/script'

import { buildConsentBootstrapScript } from '@/lib/analytics/consent-mode'
import { buildGtmScript, gtmNoscriptSrc } from '@/lib/analytics/gtm'
import type { CookieConsentValue } from '@/lib/legal/cookie-consent'

type GoogleTagManagerProps = {
  gtmId: string
  initialConsent: CookieConsentValue | null
}

/**
 * Single GTM installation path (root layout only).
 * Consent default + optional restore run before the GTM loader (`beforeInteractive`).
 */
export function GoogleTagManager({ gtmId, initialConsent }: GoogleTagManagerProps) {
  return (
    <>
      <Script id="ga-consent-mode" strategy="beforeInteractive">
        {buildConsentBootstrapScript(initialConsent)}
      </Script>
      <Script id="google-tag-manager" strategy="beforeInteractive">
        {buildGtmScript(gtmId)}
      </Script>
      <noscript>
        <iframe
          src={gtmNoscriptSrc(gtmId)}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  )
}
