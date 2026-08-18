import type { ComponentType } from 'react'

import {
  AgeIcon,
  ContainerIcon,
  CrownDiameterIcon,
  FlowerColorIcon,
  LeafColorIcon,
  RootBallIcon,
  StandardStemIcon,
  TrunkGirthIcon,
} from '@/lib/variant-attributes/nursery-icons'

type NurseryIcon = ComponentType<{ className?: string }>

export type VariantAttributeIconOption = {
  name: string
  icon: NurseryIcon
}

/** Nursery marking icons from the Green Angels attribute set. */
export const VARIANT_ATTRIBUTE_ICON_OPTIONS: VariantAttributeIconOption[] = [
  { name: 'TrunkGirth', icon: TrunkGirthIcon },
  { name: 'StandardStem', icon: StandardStemIcon },
  { name: 'Container', icon: ContainerIcon },
  { name: 'RootBall', icon: RootBallIcon },
  { name: 'CrownDiameter', icon: CrownDiameterIcon },
  { name: 'LeafColor', icon: LeafColorIcon },
  { name: 'FlowerColor', icon: FlowerColorIcon },
  { name: 'Age', icon: AgeIcon },
]

const iconByName = new Map<string, NurseryIcon>(
  VARIANT_ATTRIBUTE_ICON_OPTIONS.map((item) => [item.name, item.icon]),
)

/** Previously saved Lucide names still resolve to the closest nursery mark. */
iconByName.set('BareRoot', RootBallIcon)
iconByName.set('Height', StandardStemIcon)
iconByName.set('Width', CrownDiameterIcon)

export function resolveVariantAttributeIcon(name: string | null | undefined): NurseryIcon | null {
  if (!name) return null
  return iconByName.get(name) ?? null
}
