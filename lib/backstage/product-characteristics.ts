export const sunRequirements = [
  { value: 'full-sun', label: 'Повне сонце' },
  { value: 'partial-shade', label: 'Напівтінь' },
  { value: 'full-shade', label: 'Тінь' },
] as const

export const soilTypes = [
  { value: 'acidic', label: 'Кислий' },
  { value: 'neutral', label: 'Нейтральний' },
  { value: 'alkaline', label: 'Лужний' },
  { value: 'any', label: 'Будь-який' },
] as const

export const hardinessZones = [
  { value: '2-7', label: 'Зона 2-7' },
  { value: '3-7', label: 'Зона 3-7' },
  { value: '3-8', label: 'Зона 3-8' },
  { value: '3-9', label: 'Зона 3-9' },
  { value: '4-7', label: 'Зона 4-7' },
  { value: '4-8', label: 'Зона 4-8' },
] as const

export const wateringNeeds = [
  { value: 'low', label: 'Низькі' },
  { value: 'moderate', label: 'Помірні' },
  { value: 'high', label: 'Високі' },
] as const

export type ProductCharacteristicsForm = {
  sunRequirement: string
  soilType: string
  hardinessZone: string
  wateringNeeds: string
  height: string
}

export const emptyProductCharacteristics = (): ProductCharacteristicsForm => ({
  sunRequirement: '',
  soilType: '',
  hardinessZone: '',
  wateringNeeds: '',
  height: '',
})

export function hasProductCharacteristics(form: ProductCharacteristicsForm) {
  return Boolean(
    form.sunRequirement ||
      form.soilType ||
      form.hardinessZone ||
      form.wateringNeeds ||
      form.height.trim(),
  )
}

export function buildCharacteristicsPayload(form: ProductCharacteristicsForm) {
  if (!hasProductCharacteristics(form)) return undefined

  return {
    sunRequirement: form.sunRequirement || undefined,
    soilType: form.soilType || undefined,
    hardinessZone: form.hardinessZone || undefined,
    wateringNeeds: form.wateringNeeds || undefined,
    height: form.height.trim() || undefined,
  }
}
