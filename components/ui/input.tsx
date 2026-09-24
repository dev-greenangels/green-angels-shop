import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ref, onWheel, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      {...props}
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground text-foreground placeholder:text-muted-foreground/80 selection:bg-primary selection:text-primary-foreground',
        'border-border/80 bg-background dark:bg-input/30 h-10 w-full min-w-0 rounded-md border px-3 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        type === 'number' && 'tabular-nums font-medium',
        className,
      )}
      onWheel={(event) => {
        // Prevent scroll-wheel from changing focused number inputs while allowing page scroll.
        if (type === 'number') {
          event.currentTarget.blur()
        }
        onWheel?.(event)
      }}
    />
  )
}

export { Input }
