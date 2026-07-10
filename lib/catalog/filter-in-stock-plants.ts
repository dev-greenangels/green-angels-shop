import { getVisiblePlantVariants } from '@/lib/plant-variants'
import type { Plant } from '@/lib/types'

export function filterInStockPlants(plants: Plant[]): Plant[] {
  return plants.filter((plant) => getVisiblePlantVariants(plant).length > 0)
}
