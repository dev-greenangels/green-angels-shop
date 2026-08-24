import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/lib/types'
import { resolveVariantAttributeIcon } from '@/lib/variant-attributes/icons'
import { getVariantSizeIconName } from '@/lib/variant-attributes/size-icon'

type VariantSizeLabelProps = {
  label: string
  variant?: Pick<ProductVariant, 'displayAttributes'> | null
  className?: string
  textClassName?: string
  /** Defaults to 1em so the icon matches text size and does not grow the row. */
  iconClassName?: string
  as?: 'span' | 'p'
}

export function VariantSizeLabel({
  label,
  variant,
  className,
  textClassName,
  iconClassName = 'h-[1em] w-[1em]',
  as: Tag = 'span',
}: VariantSizeLabelProps) {
  const Icon = resolveVariantAttributeIcon(getVariantSizeIconName(variant))
  const trimmed = label.trim()
  if (!trimmed) return null

  return (
    <Tag
      className={cn(
        'inline-flex min-w-0 max-w-full flex-nowrap items-center gap-1 leading-[inherit]',
        className,
      )}
    >
      {Icon ? (
        <Icon className={cn('shrink-0', iconClassName)} aria-hidden />
      ) : null}
      <span className={cn('min-w-0 truncate', textClassName)}>{trimmed}</span>
    </Tag>
  )
}
