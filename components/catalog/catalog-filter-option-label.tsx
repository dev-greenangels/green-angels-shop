'use client'

import { ColorDisplaySwatch } from '@/components/product/color-display-swatch'
import { CharacteristicIconInline } from '@/components/backstage/characteristic-icon-inline'
import { Label } from '@/components/ui/label'
import type { CharacteristicDefinition, ColorDisplayMode } from '@/lib/backstage/characteristics'
import { cn } from '@/lib/utils'

function resolveColorDisplayMode(mode: ColorDisplayMode | null | undefined): ColorDisplayMode {
  return mode ?? 'BOTH'
}

export function CatalogFilterOptionLabel({
  label,
  colorHex,
  colorDisplayMode,
  icon,
  compact = true,
}: {
  label: string
  colorHex?: string | null
  colorDisplayMode?: ColorDisplayMode | null
  icon?: string | null
  compact?: boolean
}) {
  const mode = resolveColorDisplayMode(colorDisplayMode)
  const showSwatch =
    Boolean(colorHex?.trim()) && (mode === 'SWATCH' || mode === 'BOTH')
  const showText = mode === 'TEXT' || mode === 'BOTH' || !showSwatch
  const swatchSize = compact ? 'sm' : 'md'

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', compact && 'gap-1')}>
      {showSwatch && colorHex ? (
        <ColorDisplaySwatch hex={colorHex.trim()} label={label} size={swatchSize} />
      ) : icon ? (
        <CharacteristicIconInline icon={icon} className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      ) : null}
      {showText ? <span className="truncate">{label}</span> : null}
    </span>
  )
}

export function CatalogFilterSectionTitle({
  name,
  icon,
}: {
  name: string
  icon?: string | null
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon ? <CharacteristicIconInline icon={icon} className="h-3.5 w-3.5 text-foreground/70" /> : null}
      <span>{name}</span>
    </span>
  )
}

export function characteristicOptionLabel(
  characteristic: Pick<CharacteristicDefinition, 'colorDisplayMode' | 'icon'>,
  option: { label: string; colorHex?: string | null },
) {
  return (
    <CatalogFilterOptionLabel
      label={option.label}
      colorHex={option.colorHex}
      colorDisplayMode={characteristic.colorDisplayMode}
      icon={characteristic.icon}
    />
  )
}
