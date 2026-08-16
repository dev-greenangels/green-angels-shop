'use client'

import type { CSSProperties } from 'react'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const TOAST_OFFSET_BOTTOM = 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'
const TOAST_OFFSET_LEFT = 'calc(1rem + env(safe-area-inset-left, 0px))'
const CENTER_TOAST_OFFSET_TOP = 'calc(var(--site-header-offset, 2.75rem) + 0.75rem)'

const toasterStyle = {
  '--normal-bg': 'var(--card)',
  '--normal-text': 'var(--foreground)',
  '--normal-border': 'var(--border)',
  '--success-bg': 'var(--card)',
  '--success-text': 'var(--foreground)',
  '--success-border': 'var(--border)',
  '--error-bg': '#fef2f2',
  '--error-text': '#7f1d1d',
  '--error-border': '#fecaca',
} as CSSProperties

const toastClassNames = {
  toast:
    'group toast !rounded-xl !border !border-primary/20 !bg-background/80 !text-foreground !shadow-md !backdrop-blur-md supports-[backdrop-filter]:!bg-background/70 !ring-1 !ring-primary/10 px-3 py-2.5',
  title: 'font-semibold text-sm',
  description: 'text-sm text-muted-foreground/90',
  closeButton:
    'border-border/60 bg-background/60 text-muted-foreground hover:bg-background/80 hover:text-foreground',
  actionButton: 'bg-primary-gradient text-primary-foreground',
  cancelButton: 'bg-background text-foreground border border-border hover:bg-muted',
  success:
    '!bg-primary/10 !border-primary/35 !text-primary [&_[data-title]]:!text-primary [&_[data-description]]:!text-primary/85',
  error:
    '!bg-red-50/95 !border-red-200/90 !text-red-950 !shadow-md !backdrop-blur-sm [&_[data-title]]:!text-red-900 [&_[data-description]]:!text-red-800/90 [&_[data-button]]:!border-red-200/80 [&_[data-button]]:!bg-white/70',
}

const Toaster = ({
  position = 'bottom-left',
  offset = {
    top: CENTER_TOAST_OFFSET_TOP,
    bottom: TOAST_OFFSET_BOTTOM,
    left: TOAST_OFFSET_LEFT,
  },
  mobileOffset = {
    top: CENTER_TOAST_OFFSET_TOP,
    bottom: TOAST_OFFSET_BOTTOM,
    left: TOAST_OFFSET_LEFT,
  },
  ...props
}: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position={position}
      offset={offset}
      mobileOffset={mobileOffset}
      className="toaster group"
      style={toasterStyle}
      toastOptions={{ classNames: toastClassNames }}
      {...props}
    />
  )
}

function AppToasters() {
  const pathname = usePathname()

  useEffect(() => {
    const isBackstage = pathname?.startsWith('/backstage')
    document.documentElement.style.setProperty(
      '--site-header-offset',
      isBackstage ? '2.25rem' : '2.75rem',
    )
  }, [pathname])

  return <Toaster />
}

export { Toaster, AppToasters }
