'use client'

import { useTranslations } from 'next-intl'

import { Input } from '@/components/ui/input'
import {
  colorHexForNativeInput,
  isValidColorHex,
  normalizeColorHex,
  PRESET_COLOR_HEX,
} from '@/lib/backstage/color-hex'
import { cn } from '@/lib/utils'

function ColorSwatch({
  hex,
  className,
  title,
}: {
  hex: string
  className?: string
  title?: string
}) {
  if (!isValidColorHex(hex)) return null
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full border border-border',
        className,
      )}
      style={{ backgroundColor: normalizeColorHex(hex) }}
      title={title}
      aria-hidden
    />
  )
}

export function ColorHexField({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: string
  onChange: (hex: string) => void
  className?: string
  compact?: boolean
}) {
  const tLabels = useTranslations('labels')

  const normalized = normalizeColorHex(value)
  const valid = isValidColorHex(normalized)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESET_COLOR_HEX.map((hex) => {
          const active = valid && normalized === hex
          return (
            <button
              key={hex}
              type="button"
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-transform hover:scale-105',
                active ? 'border-primary ring-2 ring-primary/30' : 'border-border/80',
                hex === '#FFFFFF' && 'shadow-inner',
              )}
              style={{ backgroundColor: hex }}
              aria-label={hex}
              aria-pressed={active}
              onClick={() => onChange(hex)}
            />
          )
        })}
      </div>
      <div className={cn('flex items-center gap-2', compact && 'flex-wrap')}>
        <label className="relative shrink-0 cursor-pointer">
          <span className="sr-only">{tLabels('pickColor')}</span>
          <input
            type="color"
            value={colorHexForNativeInput(normalized)}
            onChange={(e) => onChange(normalizeColorHex(e.target.value))}
            className="h-9 w-9 cursor-pointer rounded-md border border-input bg-background p-0.5"
          />
        </label>
        <ColorSwatch hex={normalized} className="h-5 w-5" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (valid) onChange(normalized)
          }}
          placeholder="#FFD500"
          className={cn('h-9 font-mono text-xs', compact ? 'min-w-[96px] flex-1' : 'w-[108px]')}
          spellCheck={false}
        />
      </div>
    </div>
  )
}

export function ColorSwatchPreview({ hex, className }: { hex: string; className?: string }) {
  return <ColorSwatch hex={hex} className={cn('h-4 w-4', className)} />
}
