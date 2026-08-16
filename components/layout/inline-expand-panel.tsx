'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const PANEL_EASE = 'duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]'

type InlineExpandPanelProps = {
  open: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Standalone overlay expand with shared `.boty-glass` (when not inside StickyToolbarShell).
 */
export function InlineExpandPanel({
  open,
  children,
  className,
  contentClassName,
}: InlineExpandPanelProps) {
  return (
    <div
      className={cn(
        'boty-glass overflow-hidden rounded-b-xl border-t-0 transition-[max-height]',
        PANEL_EASE,
        open ? 'max-h-[70vh]' : 'max-h-0 border-transparent shadow-none',
        className,
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          'max-h-[70vh] overflow-y-auto overscroll-contain border-t border-border/50 px-3 py-3',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
