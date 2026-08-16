import { useEffect } from 'react'

import { clearBodyScrollLock } from '@/lib/clear-body-scroll-lock'

let lockCount = 0

function applyBodyScrollLock() {
  if (typeof document === 'undefined') return
  document.body.style.overflow = 'hidden'
  document.body.setAttribute('data-scroll-locked', '1')
}

/** Reference-counted body scroll lock for stacked inline panels / menus. */
export function acquireBodyScrollLock() {
  lockCount += 1
  if (lockCount === 1) applyBodyScrollLock()
}

export function releaseBodyScrollLock() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) clearBodyScrollLock()
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    acquireBodyScrollLock()
    return () => releaseBodyScrollLock()
  }, [locked])
}
