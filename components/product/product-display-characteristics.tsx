import { resolveCharacteristicIcon } from '@/lib/characteristics/icons'
import type { ProductDisplayCharacteristic } from '@/lib/types'
import { ColorDisplayValue } from '@/components/product/color-display-swatch'

function CharacteristicValue({ item }: { item: ProductDisplayCharacteristic }) {
  if (item.valueType === 'COLOR' && (item.colorHex || item.colorOptions?.length || item.colorDisplayMode)) {
    return (
      <ColorDisplayValue
        displayValue={item.displayValue}
        colorHex={item.colorHex}
        colorDisplayMode={item.colorDisplayMode}
        colorOptions={item.colorOptions}
      />
    )
  }

  return <p className="text-sm font-medium">{item.displayValue}</p>
}

export function ProductDisplayCharacteristics({
  items,
}: {
  items: ProductDisplayCharacteristic[]
}) {
  if (!items.length) return null

  return (
    <div className="grid grid-cols-2 gap-4 border-y border-border py-4">
      {items.map((item) => {
        const Icon = resolveCharacteristicIcon(item.icon)
        return (
          <div key={item.id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.name}</p>
              <CharacteristicValue item={item} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
