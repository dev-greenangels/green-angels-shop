import { resolveCharacteristicIcon } from '@/lib/characteristics/icons'
import { resolveVariantAttributeIcon } from '@/lib/variant-attributes/icons'
import type { ProductDisplayCharacteristic } from '@/lib/types'

export function ProductDisplayCharacteristics({
  items,
}: {
  items: ProductDisplayCharacteristic[]
}) {
  if (!items.length) return null

  return (
    <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
      {items.map((item) => {
        const AttributeIcon = resolveVariantAttributeIcon(item.icon)
        const Icon = AttributeIcon ?? resolveCharacteristicIcon(item.icon)
        return (
          <div key={item.id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Icon className={AttributeIcon ? 'h-10 w-10' : 'h-5 w-5 text-primary'} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.name}</p>
              <p className="text-sm font-medium">{item.displayValue}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
