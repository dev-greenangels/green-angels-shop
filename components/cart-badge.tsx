'use client'

import { useEffect, useState } from 'react'

import { CART_TOAST_LANDED_EVENT } from '@/components/cart/added-to-cart-toast'
import { cn } from '@/lib/utils'

/** Бейдж кількості — лише після mount, щоб не ламати hydration. */
export function CartBadge({ count, className }: { count: number; className?: string }) {
  const [mounted, setMounted] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const onLanded = () => {
      setPulse(true)
      window.setTimeout(() => setPulse(false), 420)
    }
    document.addEventListener(CART_TOAST_LANDED_EVENT, onLanded)
    return () => document.removeEventListener(CART_TOAST_LANDED_EVENT, onLanded)
  }, [mounted])

  if (!mounted || count <= 0) return null

  const label = count > 999 ? '999+' : String(count)
  const digitCount = label.length

  return (
    <span
      className={cn(
        'pointer-events-none absolute z-10 flex items-center justify-center rounded-full',
        'bg-primary-gradient text-[12px] font-bold leading-none text-primary-foreground tabular-nums',
        'origin-center transition-transform duration-300 ease-out',
        pulse && 'scale-125',
        digitCount <= 1 && '-top-2 -right-2 h-5 min-w-5',
        digitCount === 2 && '-top-2 -right-2 h-5 min-w-[22px] px-1.5',
        digitCount >= 3 && '-top-2 -right-2 h-5 min-w-[34px] px-1.5',
        className,
      )}
      aria-hidden
    >
      {label}
    </span>
  )
}
