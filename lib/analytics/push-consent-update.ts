import type { GoogleConsentState } from '@/lib/analytics/consent-mode'

type GtagWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

/** Client-only: push Consent Mode update after the user changes cookie preferences. */
export function pushGoogleConsentUpdate(state: GoogleConsentState): void {
  if (typeof window === 'undefined') return

  const w = window as GtagWindow
  w.dataLayer = w.dataLayer || []
  if (!w.gtag) {
    w.gtag = function gtag(...args: unknown[]) {
      w.dataLayer!.push(args)
    }
  }

  w.gtag('consent', 'update', state)
}
