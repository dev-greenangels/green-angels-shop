'use client'

import type { CSSProperties } from 'react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

/** Під основний/чекаут-хедер (h-16 + safe-area + невеликий відступ). */
const TOAST_OFFSET_TOP = 'calc(4.5rem + env(safe-area-inset-top, 0px))'

const Toaster = ({
  position = 'top-center',
  offset = { top: TOAST_OFFSET_TOP },
  mobileOffset = { top: TOAST_OFFSET_TOP },
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
          '--error-bg': 'var(--card)',
          '--error-text': 'var(--foreground)',
          '--error-border': 'var(--border)',
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
          error: '!bg-destructive/10 !border-destructive/30 !text-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
