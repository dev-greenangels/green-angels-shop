'use client'

import * as React from 'react'
import { X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const inputClearButtonClassName =
  'absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

export function InputClearButton({
  onClear,
  className,
  'aria-label': ariaLabel = 'Очистити',
}: {
  onClear: () => void
  className?: string
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={ariaLabel}
      className={cn(inputClearButtonClassName, className)}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.preventDefault()
        onClear()
      }}
    >
      <X className="size-4" />
    </button>
  )
}

type InputWithClearProps = React.ComponentProps<typeof Input> & {
  onClear?: () => void
  clearPaddingClass?: string
  clearButtonClassName?: string
  /** Додатковий відступ справа (наприклад, під інший значок) */
  endPaddingClass?: string
}

export const InputWithClear = React.forwardRef<HTMLInputElement, InputWithClearProps>(
  function InputWithClear(
    {
      value,
      onChange,
      onClear,
      disabled,
      className,
      clearPaddingClass = 'pr-9',
      clearButtonClassName,
      endPaddingClass,
      ...props
    },
    ref
  ) {
    const strValue = typeof value === 'string' ? value : String(value ?? '')
    const showClear = !disabled && strValue.length > 0

    const handleClear = () => {
      if (onClear) {
        onClear()
        return
      }
      onChange?.({
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(className, endPaddingClass, showClear && clearPaddingClass)}
          {...props}
        />
        {showClear && (
          <InputClearButton onClear={handleClear} className={clearButtonClassName} />
        )}
      </div>
    )
  }
)
