import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpDown,
  CloudRain,
  Droplets,
  Flower2,
  Leaf,
  MoveHorizontal,
  Mountain,
  Ruler,
  Shovel,
  Sun,
  Thermometer,
  TreeDeciduous,
  Waves,
  Wind,
} from 'lucide-react'

import { WateringPlants } from '@/lib/characteristics/watering-plants-icon'

export type CharacteristicIconOption = {
  name: string
  icon: LucideIcon
}

export const CHARACTERISTIC_ICON_OPTIONS: CharacteristicIconOption[] = [
  { name: 'Sun', icon: Sun },
  { name: 'Thermometer', icon: Thermometer },
  { name: 'Droplets', icon: Droplets },
  { name: 'WateringCan', icon: WateringPlants },
  { name: 'Mountain', icon: Mountain },
  { name: 'ArrowUpDown', icon: ArrowUpDown },
  { name: 'MoveHorizontal', icon: MoveHorizontal },
  { name: 'Ruler', icon: Ruler },
  { name: 'Leaf', icon: Leaf },
  { name: 'TreeDeciduous', icon: TreeDeciduous },
  { name: 'Flower2', icon: Flower2 },
  { name: 'Shovel', icon: Shovel },
  { name: 'Wind', icon: Wind },
  { name: 'CloudRain', icon: CloudRain },
  { name: 'Waves', icon: Waves },
]

const iconByName = new Map(CHARACTERISTIC_ICON_OPTIONS.map((item) => [item.name, item.icon]))

export function resolveCharacteristicIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Leaf
  return iconByName.get(name) ?? Leaf
}

export const CHARACTERISTIC_ICON_NAMES = CHARACTERISTIC_ICON_OPTIONS.map((item) => item.name)
