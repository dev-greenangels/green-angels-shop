'use client'

import { ColorDisplaySwatch } from '@/components/product/color-display-swatch'
import { CharacteristicIconInline } from '@/components/backstage/characteristic-icon-inline'
import type { CharacteristicDefinition, ColorDisplayMode } from '@/lib/backstage/characteristics'
import { CHARACTERISTIC_ICON_NAMES } from '@/lib/characteristics/icons'
import { resolveVariantAttributeIcon } from '@/lib/variant-attributes/icons'
import { cn } from '@/lib/utils'

const CHARACTERISTIC_ICON_NAME_SET = new Set(CHARACTERISTIC_ICON_NAMES)

function resolveColorDisplayMode(mode: ColorDisplayMode | null | undefined): ColorDisplayMode {
  return mode ?? 'BOTH'
}

/** Nursery attribute icons (Container, …) first; else known characteristic Lucide names. */
function FilterIcon({
  icon,
  className,
}: {
  icon?: string | null
  className?: string
}) {
  const trimmed = icon?.trim()
  if (!trimmed) return null

  const VariantIcon = resolveVariantAttributeIcon(trimmed)
  if (VariantIcon) {
    return <VariantIcon className={cn('h-3.5 w-3.5 shrink-0', className)} />
  }

  if (!CHARACTERISTIC_ICON_NAME_SET.has(trimmed)) return null
  return <CharacteristicIconInline icon={trimmed} className={className} />
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
      ) : (
        <FilterIcon icon={icon} className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
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
      <FilterIcon icon={icon} className="h-3.5 w-3.5 text-foreground/70" />
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
