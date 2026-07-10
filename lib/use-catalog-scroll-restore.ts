'use client'

import { useLayoutEffect, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const SCROLL_KEY_PREFIX = 'catalog-scroll:'

function scrollStorageKey(pathname: string, search: string) {
  return `${SCROLL_KEY_PREFIX}${pathname}${search ? `?${search}` : ''}`
}

export function useCatalogScrollRestore(ready: boolean) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const restoredRef = useRef(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    history.scrollRestoration = 'manual'
  }, [])

  useEffect(() => {
    const key = scrollStorageKey(pathname, search)

    const saveScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }

    let saveTimer: ReturnType<typeof setTimeout> | undefined
    const onScroll = () => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(saveScroll, 120)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', saveScroll)

    return () => {
      if (saveTimer) clearTimeout(saveTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', saveScroll)
      saveScroll()
    }
  }, [pathname, search])

  useEffect(() => {
    restoredRef.current = false
  }, [pathname, search])

  useEffect(() => {
    if (!ready || restoredRef.current) return

    const key = scrollStorageKey(pathname, search)
    const saved = sessionStorage.getItem(key)
    if (!saved) return

    const targetY = Number.parseInt(saved, 10)
    if (!Number.isFinite(targetY) || targetY <= 0) return

    restoredRef.current = true

    const restore = () => {
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo({ top: Math.min(targetY, maxY), left: 0, behavior: 'instant' })
    }

    restore()
    const frame = window.requestAnimationFrame(restore)
    const timers = [50, 150, 350, 700].map((delay) => window.setTimeout(restore, delay))

    return () => {
      window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [ready, pathname, search])
}
