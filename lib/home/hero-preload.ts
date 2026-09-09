import 'server-only'

import { preload } from 'react-dom'

import { HERO_DESKTOP_MEDIA, HERO_MOBILE_MEDIA } from '@/lib/home/hero-image'

/**
 * SSR head preload for homepage hero. Uses mutually exclusive `media` so the
 * browser downloads only the art-direction URL that matches the viewport.
 */
export function preloadHomeHeroImages(input: {
  desktopSrc: string | null
  mobileSrc: string | null
}): void {
  const { desktopSrc, mobileSrc } = input
  const useArtDirection = Boolean(desktopSrc && mobileSrc && desktopSrc !== mobileSrc)

  if (useArtDirection && desktopSrc && mobileSrc) {
    preload(mobileSrc, {
      as: 'image',
      fetchPriority: 'high',
      media: HERO_MOBILE_MEDIA,
    })
    preload(desktopSrc, {
      as: 'image',
      fetchPriority: 'high',
      media: HERO_DESKTOP_MEDIA,
    })
    return
  }

  const single = desktopSrc ?? mobileSrc
  if (single) {
    preload(single, { as: 'image', fetchPriority: 'high' })
  }
}
