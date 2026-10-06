'use client'

import { useLayoutEffect } from 'react'

/**
 * Keep `--site-header-offset` equal to the real sticky `#site-header` height
 * so catalog / alphabet toolbars dock flush (no green gap under the header).
 */
export function useSyncSiteHeaderOffset(headerId = 'site-header') {
  useLayoutEffect(() => {
    const header = document.getElementById(headerId)
    if (!header) return

    const sync = () => {
      // offsetHeight = layout box (padding + bar), independent of scroll/transform.
      const height = Math.ceil(header.offsetHeight)
      if (height > 0) {
        document.documentElement.style.setProperty('--site-header-offset', `${height}px`)
      }
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(header)
    window.addEventListener('orientationchange', sync)

    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', sync)
    }
  }, [headerId])
}
