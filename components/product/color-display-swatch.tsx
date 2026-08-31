import { cn } from '@/lib/utils'

export type ColorDisplayMode = 'TEXT' | 'SWATCH' | 'BOTH'

function isLightColor(hex: string): boolean {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return false
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return false
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.72
}

export function ColorDisplaySwatch({
  hex,
  label,
  size = 'md',
  className,
}: {
  hex: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClass =
    size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
  const light = isLightColor(hex)

  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-[0.35rem] ring-1 ring-inset',
        light ? 'ring-border/80' : 'ring-black/15',
        sizeClass,
        className,
      )}
      style={{ backgroundColor: hex }}
      title={label ?? hex}
      aria-hidden={label ? undefined : true}
      aria-label={label ? `${label} (${hex})` : hex}
    />
  )
}

export function ColorDisplayValue({
  displayValue,
  colorHex,
  colorDisplayMode,
}: {
  displayValue: string
  colorHex?: string | null
  colorDisplayMode?: ColorDisplayMode | null
}) {
  const mode = colorDisplayMode ?? 'BOTH'
  const showText = mode !== 'SWATCH' && displayValue.trim()
  const showSwatch = mode !== 'TEXT' && colorHex

  if (!showText && !showSwatch) {
    return <span className="text-sm font-medium">{displayValue}</span>
  }

  if (showSwatch && !showText) {
    return (
      <ColorDisplaySwatch
        hex={colorHex!}
        label={displayValue.trim() || undefined}
        size="sm"
        className="mt-0.5"
      />
    )
  }

  return (
    <p className="inline-flex min-w-0 max-w-full items-center gap-2 text-sm font-medium">
      {showSwatch ? (
        <ColorDisplaySwatch
          hex={colorHex!}
          label={displayValue.trim() || undefined}
          size="sm"
        />
      ) : null}
      {showText ? <span className="truncate">{displayValue}</span> : null}
    </p>
  )
}
