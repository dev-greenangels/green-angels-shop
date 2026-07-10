'use client'

import type { CSSProperties } from 'react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const TOAST_OFFSET_BOTTOM = 'calc(1.25rem + env(safe-area-inset-bottom, 0px))'
const TOAST_OFFSET_LEFT = 'calc(1rem + env(safe-area-inset-left, 0px))'

const Toaster = ({
  position = 'bottom-left',
  offset = { bottom: TOAST_OFFSET_BOTTOM, left: TOAST_OFFSET_LEFT },
  mobileOffset = { bottom: TOAST_OFFSET_BOTTOM, left: TOAST_OFFSET_LEFT },
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
      style={
        {
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
      }
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-xl !border !border-primary/20 !bg-background/80 !text-foreground !shadow-md !backdrop-blur-md supports-[backdrop-filter]:!bg-background/70 !ring-1 !ring-primary/10 px-3 py-2.5',
          title: 'font-semibold text-sm',
          description: 'text-sm text-muted-foreground/90',
          closeButton:
            'border-border/60 bg-background/60 text-muted-foreground hover:bg-background/80 hover:text-foreground',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary/90',
          cancelButton:
            'bg-background text-foreground border border-border hover:bg-muted',
          success:
            '!bg-primary/10 !border-primary/35 !text-primary [&_[data-title]]:!text-primary [&_[data-description]]:!text-primary/85',
          error:
            '!bg-red-50/95 !border-red-200/90 !text-red-950 !shadow-md !backdrop-blur-sm [&_[data-title]]:!text-red-900 [&_[data-description]]:!text-red-800/90 [&_[data-button]]:!border-red-200/80 [&_[data-button]]:!bg-white/70',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
