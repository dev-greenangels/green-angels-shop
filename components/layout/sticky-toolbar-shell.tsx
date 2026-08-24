'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useBodyScrollLock } from '@/lib/body-scroll-lock'
import { siteStickyToolbarOuterClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

type StickyToolbarContextValue = {
  openPanel: string | null
  setOpenPanel: (id: string | null) => void
  togglePanel: (id: string) => void
  isOpen: (id: string) => boolean
}

const StickyToolbarContext = createContext<StickyToolbarContextValue | null>(null)

export function useStickyToolbar() {
  const ctx = useContext(StickyToolbarContext)
  if (!ctx) {
    throw new Error('useStickyToolbar must be used within StickyToolbarShell')
  }
  return ctx
}

export function useStickyToolbarOptional() {
  return useContext(StickyToolbarContext)
}

const PANEL_EASE = 'duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]'

type StickyToolbarShellProps = {
  children: ReactNode
  className?: string
  outerClassName?: string
  innerClassName?: string
  /** Apply `.boty-glass` on the expanding surface (default true). */
  glass?: boolean
  /** Lock page scroll while any panel is open (default true). */
  lockBodyScroll?: boolean
  /** Shorter toolbar row (h-10 instead of h-12). */
  compact?: boolean
}

/**
 * Boty-style sticky toolbar: one `.boty-glass` surface; panels expand inside it.
 * Fixed-height slot so open/close does not push page content.
 */
export function StickyToolbarShell({
  children,
  className,
  outerClassName,
  innerClassName,
  glass = true,
  lockBodyScroll = true,
  compact = false,
}: StickyToolbarShellProps) {
  const [openPanel, setOpenPanel] = useState<string | null>(null)

  const togglePanel = useCallback((id: string) => {
    setOpenPanel((prev) => (prev === id ? null : id))
  }, [])

  const isOpen = useCallback((id: string) => openPanel === id, [openPanel])

  const value = useMemo(
    () => ({ openPanel, setOpenPanel, togglePanel, isOpen }),
    [openPanel, togglePanel, isOpen],
  )

  useBodyScrollLock(lockBodyScroll && openPanel != null)

  return (
    <StickyToolbarContext.Provider value={value}>
      <div className={cn(siteStickyToolbarOuterClassName, outerClassName, className)}>
        {/* Layout slot = row height only; glass expands absolutely over content */}
        <div className={cn('relative', compact ? 'h-10' : 'h-12')}>
          <div
            className={cn(
              'absolute inset-x-0 top-0 z-50 overflow-hidden rounded-b-[0.5rem]',
              glass && 'boty-glass',
              innerClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </StickyToolbarContext.Provider>
  )
}

type StickyToolbarRowProps = {
  children: ReactNode
  className?: string
}

export function StickyToolbarRow({ children, className }: StickyToolbarRowProps) {
  return (
    <div
      className={cn(
        'relative z-10 flex h-12 w-full items-center gap-2 px-2.5 sm:px-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

type StickyToolbarPanelProps = {
  id: string
  children: ReactNode
  contentClassName?: string
}

/** Expands inside the shared `.boty-glass` shell — same fill as the header menu. */
export function StickyToolbarPanel({ id, children, contentClassName }: StickyToolbarPanelProps) {
  const { isOpen } = useStickyToolbar()
  const open = isOpen(id)

  return (
    <div
      className={cn(
        'overflow-hidden transition-[max-height]',
        PANEL_EASE,
        open ? 'max-h-[70vh]' : 'max-h-0',
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
