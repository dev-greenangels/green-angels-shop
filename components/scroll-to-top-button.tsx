'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOP_THRESHOLD = 120
const SCROLL_DIRECTION_DELTA = 6

export function ScrollToTopButton() {
  const pathname = usePathname()
  const tc = useTranslations('common')
  const [visible, setVisible] = useState(false)
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)

  const updateVisibility = useCallback(() => {
    const currentY = window.scrollY

    if (currentY <= TOP_THRESHOLD) {
      setVisible(false)
    } else if (currentY < lastScrollYRef.current - SCROLL_DIRECTION_DELTA) {
      setVisible(true)
    } else if (currentY > lastScrollYRef.current + SCROLL_DIRECTION_DELTA) {
      setVisible(false)
    }

    lastScrollYRef.current = currentY
    tickingRef.current = false
  }, [])

  useEffect(() => {
    lastScrollYRef.current = window.scrollY
    setVisible(false)

    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      requestAnimationFrame(updateVisibility)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname, updateVisibility])

  if (pathname.startsWith('/backstage')) {
    return null
  }

  const scrollToTop = () => {
    window.dispatchEvent(new CustomEvent('site:scroll-to-top'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      aria-label={tc('scrollToTop')}
      onClick={scrollToTop}
      className={cn(
        'fixed z-40 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full',
        'border border-primary/25 bg-primary/12 text-primary',
        'shadow-[0_8px_24px_rgba(91,148,56,0.18)] backdrop-blur-xl',
        'supports-[backdrop-filter]:bg-primary/10',
        'transition-all duration-300 ease-out',
        'hover:border-primary/40 hover:bg-primary/20 hover:text-primary hover:shadow-[0_10px_28px_rgba(91,148,56,0.28)]',
        'active:scale-95 active:bg-primary/28',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6',
        visible
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/35 to-transparent"
        aria-hidden
      />
      <ArrowUp className="relative h-5 w-5 stroke-[2.25]" aria-hidden />
    </button>
  )
}
