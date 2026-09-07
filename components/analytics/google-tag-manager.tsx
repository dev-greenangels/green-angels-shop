import Script from 'next/script'

import { buildConsentBootstrapScript } from '@/lib/analytics/consent-mode'
import { buildGtmScript, gtmNoscriptSrc } from '@/lib/analytics/gtm'
import type { CookieConsentValue } from '@/lib/legal/cookie-consent'

type GoogleTagManagerProps = {
  gtmId: string
  initialConsent: CookieConsentValue | null
}

/**
 * Single GTM installation path (root layout only; skipped on `/backstage` via `x-ga-surface`).
 * Consent Mode defaults stay `beforeInteractive`; container loads `lazyOnload` to shorten critical path.
 */
export function GoogleTagManager({ gtmId, initialConsent }: GoogleTagManagerProps) {
  return (
    <>
      <Script id="ga-consent-mode" strategy="beforeInteractive">
        {buildConsentBootstrapScript(initialConsent)}
      </Script>
      <Script id="google-tag-manager" strategy="lazyOnload">
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
