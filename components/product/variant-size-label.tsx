import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/lib/types'
import { resolveVariantAttributeIcon } from '@/lib/variant-attributes/icons'
import { getVariantSizeIconName } from '@/lib/variant-attributes/size-icon'

type VariantSizeLabelProps = {
  label: string
  variant?: Pick<ProductVariant, 'displayAttributes'> | null
  /** When variant attributes are unavailable (e.g. order snapshots), force an icon. */
  iconName?: string | null
  className?: string
  textClassName?: string
  /**
   * Icon box size. Prefer explicit rem sizes on review/cart snippets —
   * `1em` can collapse next to truncated labels and look missing.
   */
  iconClassName?: string
  as?: 'span' | 'p'
}

export function VariantSizeLabel({
  label,
  variant,
  iconName,
  className,
  textClassName,
  iconClassName,
  as: Tag = 'span',
}: VariantSizeLabelProps) {
  const Icon = resolveVariantAttributeIcon(iconName ?? getVariantSizeIconName(variant))
  const trimmed = label.trim()
  if (!trimmed) return null
  const resolvedIconClass =
    iconClassName ?? (iconName ? 'h-3.5 w-3.5' : 'h-[1em] w-[1em]')

  return (
    <Tag
      className={cn(
        'inline-flex min-w-0 max-w-full flex-nowrap items-center gap-1 leading-[inherit]',
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={cn('shrink-0', resolvedIconClass)}
          aria-hidden
        />
      ) : null}
      <span className={cn('min-w-0 truncate', textClassName)}>{trimmed}</span>
    </Tag>
  )
}
