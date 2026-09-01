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
  colorOptions,
}: {
  displayValue: string
  colorHex?: string | null
  colorDisplayMode?: ColorDisplayMode | null
  colorOptions?: Array<{ displayValue: string; colorHex: string | null }>
}) {
  const mode = colorDisplayMode ?? 'BOTH'
  const showText = mode !== 'SWATCH'
  const showSwatch = mode !== 'TEXT'

  const options =
    colorOptions && colorOptions.length > 0
      ? colorOptions
      : displayValue.trim() || colorHex
        ? [{ displayValue, colorHex: colorHex ?? null }]
        : []

  if (!options.length) {
    return <span className="text-sm font-medium">{displayValue}</span>
  }

  if (options.length > 1) {
    return (
      <div className="flex flex-col gap-1.5">
        {showText && displayValue.trim() ? (
          <p className="text-sm font-medium">{displayValue}</p>
        ) : null}
        {showSwatch ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {options.map((option, index) =>
              option.colorHex ? (
                <ColorDisplaySwatch
                  key={`${option.colorHex}-${index}`}
                  hex={option.colorHex}
                  label={option.displayValue.trim() || undefined}
                  size="sm"
                />
              ) : null,
            )}
          </div>
        ) : null}
      </div>
    )
  }

  const single = options[0]
  const singleText = showText ? single.displayValue.trim() || displayValue.trim() : ''
  const singleHex = showSwatch ? single.colorHex : null

  if (!singleText && !singleHex) {
    return <span className="text-sm font-medium">{displayValue}</span>
  }

  if (singleHex && !singleText) {
    return (
      <ColorDisplaySwatch
        hex={singleHex}
        label={displayValue.trim() || undefined}
        size="sm"
        className="mt-0.5"
      />
    )
  }

  return (
    <p className="inline-flex min-w-0 max-w-full items-center gap-2 text-sm font-medium">
      {singleHex ? (
        <ColorDisplaySwatch
          hex={singleHex}
          label={singleText || undefined}
          size="sm"
        />
      ) : null}
      {singleText ? <span className="truncate">{singleText}</span> : null}
    </p>
  )
}
